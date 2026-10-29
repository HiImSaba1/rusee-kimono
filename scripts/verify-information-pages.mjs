import mysql from "mysql2/promise";
const url=process.env.DATABASE_URL;if(!url)throw new Error("DATABASE_URL is required.");
const expected=["shipping","payment-methods","returns","cookies","privacy-policy","terms","care-guide"];
const database=await mysql.createConnection(url);
try{const [rows]=await database.execute("SELECT slug,status,JSON_VALID(sections) AS valid_sections FROM store_information_pages ORDER BY slug");const scoped=rows.filter(row=>expected.includes(row.slug));if(scoped.length!==expected.length)throw new Error(`Expected ${expected.length} information pages, found ${scoped.length}.`);if(scoped.some(row=>!row.valid_sections||!["draft","published"].includes(row.status)))throw new Error("Information page status or section JSON is invalid.");console.log(`Verified ${scoped.length} fixed information-page records. No content was changed.`);}finally{await database.end();}
