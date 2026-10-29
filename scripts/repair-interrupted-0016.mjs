import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [history] = await connection.execute("SELECT created_at FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 1");
  const migrationRecorded = history.length > 0 && Number(history[0].created_at) >= 1788519024423;
  if (migrationRecorded) {
    console.log("Sprint 08AG/08AH migration is already recorded; no repair required.");
  } else {
    await connection.query("SET FOREIGN_KEY_CHECKS=0");
    for (const table of ["admin_notification_states", "admin_notifications", "email_template_versions", "email_templates"]) {
      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    const [columns] = await connection.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='email_deliveries' AND COLUMN_NAME IN ('template_version_id','subject_snapshot','text_snapshot','html_snapshot')");
    for (const row of columns) await connection.query(`ALTER TABLE email_deliveries DROP COLUMN \`${row.COLUMN_NAME}\``);
    await connection.query("SET FOREIGN_KEY_CHECKS=1");
    console.log("Interrupted, unrecorded Sprint 08AG/08AH schema objects were safely reset for a clean migration retry.");
  }
} finally {
  try { await connection.query("SET FOREIGN_KEY_CHECKS=1"); } finally { await connection.end(); }
}
