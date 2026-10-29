export const systemEmailTemplateKeys = ["payment_confirmation","admin_new_order","fulfilment_update","contact_enquiry_notification","admin_return_request","return_status_update"] as const;
export type SystemEmailTemplateKey = typeof systemEmailTemplateKeys[number];

export const templateVariables:Record<SystemEmailTemplateKey,readonly string[]>={
  payment_confirmation:["order_number","order_total","order_status_url"],
  admin_new_order:["order_number","order_total","admin_order_url"],
  fulfilment_update:["order_number","fulfilment_status","carrier_name","tracking_code","tracking_url","order_status_url"],
  contact_enquiry_notification:["customer_name","customer_email","enquiry_subject","order_number","customer_message","locale"],
  admin_return_request:["order_number","return_reason","admin_return_url"],
  return_status_update:["order_number","return_status","order_status_url"],
};

const token=/{{\s*([a-z][a-z0-9_]*)\s*}}/g;
export function findTemplateVariables(value:string){return [...value.matchAll(token)].map(match=>match[1]);}
export function assertAllowedTemplateVariables(key:SystemEmailTemplateKey,fields:string[]){const allowed=new Set(templateVariables[key]);const invalid=[...new Set(fields.flatMap(findTemplateVariables).filter(name=>!allowed.has(name)))];if(invalid.length)throw new Error(`Unsupported template variables: ${invalid.join(", ")}`);}
export function renderTemplateString(value:string,variables:Record<string,string>){return value.replace(token,(_,name:string)=>variables[name]??"");}

export function escapeEmailHtml(value:string){return value.replace(/[&<>'"]/g,character=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[character]!);}

export function assertSafeEmailHtml(value:string){
  if(/<\s*(script|form|iframe|object|embed|base)\b/i.test(value)||/\son[a-z]+\s*=/i.test(value)||/(javascript|data|vbscript)\s*:/i.test(value)||/<meta\b[^>]*http-equiv\s*=\s*["']?refresh/i.test(value))throw new Error("Email template HTML contains executable or unsafe markup.");
}

export function renderStoredEmailTemplate(key:SystemEmailTemplateKey,content:{subject:string;text:string;html:string},variables:Record<string,string>){
  assertAllowedTemplateVariables(key,[content.subject,content.text,content.html]);
  assertSafeEmailHtml(content.html);
  const htmlVariables=Object.fromEntries(Object.entries(variables).map(([name,value])=>[name,escapeEmailHtml(value)]));
  return {subject:renderTemplateString(content.subject,variables).replace(/[\r\n]+/g," ").trim(),text:renderTemplateString(content.text,variables),html:renderTemplateString(content.html,htmlVariables)};
}
