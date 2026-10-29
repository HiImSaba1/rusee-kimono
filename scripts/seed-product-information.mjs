import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const source = JSON.parse(await fs.readFile(path.join(process.cwd(), "src", "data", "product-information-default.json"), "utf8"));
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [result] = await connection.execute(
    "UPDATE products SET product_information = ?, updated_at = NOW() WHERE slug = 'signature-kimono' AND product_information IS NULL",
    [JSON.stringify(source)],
  );
  console.log(JSON.stringify({ ok: true, product: "signature-kimono", initialized: Number(result.affectedRows) }, null, 2));
} finally {
  await connection.end();
}
