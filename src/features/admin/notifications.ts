import "server-only";
import { databasePool } from "@/lib/db/connection";
import type { AdminSession } from "@/features/admin-auth/session";

export type AdminNotification = { id:number; kind:string; severity:"critical"|"action"|"information"; entity_id:string; href:string; created_at:Date; read_at:Date|null };

const sources = [
  `INSERT IGNORE INTO admin_notifications (deduplication_key,kind,severity,audience,entity_type,entity_id,href)
   SELECT CONCAT('payment:',p.id,':',p.status),'payment_attention','critical','owner_manager','payment',CAST(p.id AS CHAR),'/admin/reconciliation' FROM payments p WHERE p.status='failed'`,
  `INSERT IGNORE INTO admin_notifications (deduplication_key,kind,severity,audience,entity_type,entity_id,href)
   SELECT CONCAT('email:',e.id,':failed'),'email_failed','critical','owner_manager','email_delivery',CAST(e.id AS CHAR),'/admin/email' FROM email_deliveries e WHERE e.status='failed'`,
  `INSERT IGNORE INTO admin_notifications (deduplication_key,kind,severity,audience,entity_type,entity_id,href)
   SELECT CONCAT('stock:',i.variant_id,':low'),'low_stock','action','catalogue','product_variant',CAST(i.variant_id AS CHAR),'/admin/inventory' FROM inventory i WHERE (i.on_hand-i.reserved)<=3`,
  `INSERT IGNORE INTO admin_notifications (deduplication_key,kind,severity,audience,entity_type,entity_id,href)
   SELECT CONCAT('return:',r.id,':pending'),'return_pending','action','commerce','return_request',CAST(r.id AS CHAR),'/admin/returns' FROM return_requests r WHERE r.status='pending'`,
  `INSERT IGNORE INTO admin_notifications (deduplication_key,kind,severity,audience,entity_type,entity_id,href)
   SELECT CONCAT('enquiry:',c.id,':new'),'enquiry_new','action','all','contact_enquiry',CAST(c.id AS CHAR),CONCAT('/admin/enquiries/',c.public_id) FROM contact_enquiries c WHERE c.status='new'`,
];

export async function listAdminNotifications(admin:AdminSession) {
  const connection=await databasePool.getConnection();
  try { await connection.beginTransaction(); for(const sql of sources) await connection.execute(sql); await connection.commit(); }
  catch(error){await connection.rollback();throw error;} finally {connection.release();}
  const audiences=admin.role==="owner"||admin.role==="manager"?["all","commerce","catalogue","owner_manager"]:admin.role==="fulfilment"?["all","commerce","catalogue"]:["all"];
  const placeholders=audiences.map(()=>"?").join(",");
  const [rows]=await databasePool.execute(`SELECT n.id,n.kind,n.severity,n.entity_id,n.href,n.created_at,s.read_at FROM admin_notifications n LEFT JOIN admin_notification_states s ON s.notification_id=n.id AND s.admin_user_id=? WHERE n.audience IN (${placeholders}) AND s.archived_at IS NULL ORDER BY FIELD(n.severity,'critical','action','information'),n.created_at DESC LIMIT 100`,[admin.id,...audiences]);
  return rows as AdminNotification[];
}
