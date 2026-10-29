import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [columns] = await connection.execute("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='product_images' AND COLUMN_NAME IN ('size_id','alt_el','alt_en')");
  const [invalid] = await connection.execute(`SELECT i.id FROM product_images i
    LEFT JOIN designs d ON d.id=i.design_id
    LEFT JOIN sizes s ON s.id=i.size_id
    WHERE (i.design_id IS NOT NULL AND d.id IS NULL)
       OR (i.size_id IS NOT NULL AND s.id IS NULL)
       OR (i.design_id IS NOT NULL AND d.product_id<>i.product_id)
       OR (i.size_id IS NOT NULL AND i.design_id IS NULL)`);
  const [incompleteAlt] = await connection.execute("SELECT id FROM product_images WHERE design_id IS NOT NULL AND (NULLIF(TRIM(alt_el),'') IS NULL OR NULLIF(TRIM(alt_en),'') IS NULL)");
  const result = { requiredColumns: columns.length, invalidAssignments: invalid.length, incompleteBilingualAlt: incompleteAlt.length };
  console.log(JSON.stringify(result, null, 2));
  if (result.requiredColumns !== 3 || result.invalidAssignments !== 0) throw new Error("Catalogue media schema or assignment integrity is invalid.");
  if (result.incompleteBilingualAlt > 0) console.log("Existing media without bilingual alt remains usable through its legacy alt; complete it from Admin before launch.");
} finally {
  await connection.end();
}
