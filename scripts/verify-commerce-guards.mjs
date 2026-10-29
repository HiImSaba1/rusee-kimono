import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [columns] = await connection.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='commerce_rate_limits' AND COLUMN_NAME IN ('scope','rate_limit_key','window_started_at','submission_count','blocked_count')");
  const registry = readFileSync("src/features/payments/registry.ts", "utf8");
  const result = { requiredColumns: columns.length, productionFakeGuard: registry.includes('process.env.NODE_ENV === "production"') && registry.includes('name === "fake"') };
  console.log(JSON.stringify(result, null, 2));
  if (result.requiredColumns !== 5 || !result.productionFakeGuard) throw new Error("Commerce launch guards are incomplete.");
} finally {
  await connection.end();
}
