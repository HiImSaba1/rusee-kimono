import mysql from "mysql2/promise";

const sourceUrl = process.env.DATABASE_URL;
const rehearsalName = process.env.DB_REHEARSAL_NAME;
const rehearsalConnectionUrl = process.env.DB_REHEARSAL_URL;
if (!sourceUrl || !rehearsalName || !/^next_kimono_restore_[0-9_]+$/.test(rehearsalName)) throw new Error("Safe source and rehearsal database settings are required.");
const source = await mysql.createConnection(sourceUrl);
const rehearsal = await mysql.createConnection(rehearsalConnectionUrl || (() => {
  const fallback = new URL(sourceUrl);
  fallback.pathname = `/${rehearsalName}`;
  return fallback.toString();
})());

async function counts(connection) {
  const [tables] = await connection.query("SELECT TABLE_NAME AS table_name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
  const output = {};
  for (const { table_name: table } of tables) {
    if (!/^[a-zA-Z0-9_]+$/.test(table)) throw new Error("Unsafe table name returned by MySQL.");
    const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
    output[table] = Number(rows[0].count);
  }
  return output;
}

try {
  const sourceCounts = await counts(source);
  const rehearsalCounts = await counts(rehearsal);
  const exact = JSON.stringify(sourceCounts) === JSON.stringify(rehearsalCounts);
  console.log(JSON.stringify({ exact, source: sourceCounts, rehearsal: rehearsalCounts }, null, 2));
  if (!exact) process.exitCode = 1;
} finally {
  await Promise.all([source.end(), rehearsal.end()]);
}
