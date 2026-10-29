import { createHash } from "node:crypto";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const requestedApply = process.argv.includes("--apply");
const enabled = process.env.PRIVACY_RETENTION_ENABLED === "true";
const retentionDays = Math.min(3650, Math.max(30, Number(process.env.PRIVACY_CONTACT_RETENTION_DAYS ?? 365)));
const database = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await database.execute(`SELECT id,public_id FROM contact_enquiries WHERE status='closed' AND anonymized_at IS NULL AND created_at < DATE_SUB(NOW(), INTERVAL ${retentionDays} DAY) ORDER BY id LIMIT 500`);
  const eligible = rows;
  if (!requestedApply || !enabled) {
    await database.execute("INSERT INTO privacy_retention_runs (mode,retention_days,eligible_count,anonymized_count,status,detail) VALUES ('dry_run',?,?,0,?,?)", [retentionDays, eligible.length, enabled ? "completed" : "disabled", JSON.stringify({ requestedApply, enabled })]);
    console.log(JSON.stringify({ enabled, requestedApply, applied: false, retentionDays, eligible: eligible.length, anonymized: 0 }, null, 2));
    process.exit(0);
  }
  await database.beginTransaction();
  try {
    for (const contact of eligible) {
      const anonymousEmail = `anonymous+${contact.public_id}@rusee.invalid`;
      const key = createHash("sha256").update(`anonymized:${contact.public_id}`).digest("hex");
      await database.execute("UPDATE email_deliveries SET reply_to=NULL,updated_at=NOW() WHERE contact_enquiry_id=?", [contact.id]);
      await database.execute("UPDATE contact_enquiries SET name='Anonymized visitor',email=?,order_number=NULL,message='[Personal message erased]',rate_limit_key=?,anonymized_at=NOW(),updated_at=NOW() WHERE id=?", [anonymousEmail, key, contact.id]);
    }
    await database.execute("INSERT INTO privacy_retention_runs (mode,retention_days,eligible_count,anonymized_count,status,detail) VALUES ('apply',?,?,?,'completed',?)", [retentionDays, eligible.length, eligible.length, JSON.stringify({ batchLimit: 500 })]);
    await database.commit();
  } catch (error) { await database.rollback(); throw error; }
  console.log(JSON.stringify({ enabled, requestedApply, applied: true, retentionDays, eligible: eligible.length, anonymized: eligible.length }, null, 2));
} finally { await database.end(); }
