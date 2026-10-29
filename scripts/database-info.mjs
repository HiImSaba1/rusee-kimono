import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [[server]] = await connection.query(
    "SELECT VERSION() AS version, @@version_comment AS engine, @@character_set_database AS charset_name, @@collation_database AS collation_name",
  );
  const [tables] = await connection.query("SHOW TABLES");
  console.log({ ...server, tableCount: tables.length, tables: tables.map((row) => Object.values(row)[0]) });
} finally {
  await connection.end();
}
