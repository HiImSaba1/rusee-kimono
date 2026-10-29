import mysql from "mysql2/promise";
const definitions=[
  ["payment_confirmation","Επιβεβαίωση πληρωμής","{{order_number}} · Επιβεβαίωση","{{order_number}} · Confirmation"],
  ["admin_new_order","Νέα πληρωμένη παραγγελία","Νέα παραγγελία {{order_number}}","New order {{order_number}}"],
  ["fulfilment_update","Ενημέρωση αποστολής","Ενημέρωση {{order_number}}","Update for {{order_number}}"],
  ["contact_enquiry_notification","Νέο μήνυμα πελάτη","Νέο μήνυμα από {{customer_name}}","New enquiry from {{customer_name}}"],
  ["admin_return_request","Νέο αίτημα επιστροφής","Επιστροφή {{order_number}}","Return {{order_number}}"],
  ["return_status_update","Κατάσταση επιστροφής","Επιστροφή {{order_number}}","Return update {{order_number}}"],
];
const connection=await mysql.createConnection({host:process.env.DB_HOST,port:Number(process.env.DB_PORT),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD??""});
try{await connection.beginTransaction();for(const [key,name,subjectEl,subjectEn] of definitions){const [result]=await connection.execute("INSERT IGNORE INTO email_templates (template_key,name,`system`,status) VALUES (?,?,true,'draft')",[key,name]);const [rows]=await connection.execute("SELECT id FROM email_templates WHERE template_key=? LIMIT 1",[key]);const id=rows[0].id;if(result.affectedRows===1)await connection.execute("INSERT INTO email_template_versions (template_id,version,subject_el,subject_en,html_el,html_en,text_el,text_en,allowed_variables) VALUES (?,1,?,?, '<h1>{{order_number}}</h1>','<h1>{{order_number}}</h1>','{{order_number}}','{{order_number}}',JSON_ARRAY())",[id,subjectEl,subjectEn]);}await connection.commit();console.log(`PASS - ${definitions.length} system email-template drafts are available; code fallbacks remain active.`);}catch(error){await connection.rollback();throw error;}finally{await connection.end();}
