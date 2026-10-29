import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const webpMaximumBytes = 500 * 1024;
const fallbackMaximumBytes = 600 * 1024;
const prefix = "/kimono_images_optimized/";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const directory = path.join(process.cwd(), "public", "kimono_images_optimized");
  const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
  if (!Array.isArray(manifest) || manifest.length !== 118) throw new Error(`Expected 118 manifest rows, found ${Array.isArray(manifest) ? manifest.length : 0}.`);
  const paths = new Set();
  let fallbacks = 0;
  for (const entry of manifest) {
    const details = await stat(path.join(directory, entry.output));
    const limit = entry.fallback ? fallbackMaximumBytes : webpMaximumBytes;
    if (details.size > limit) throw new Error(`${entry.output} exceeds its approved ${(limit / 1024).toFixed(0)} KB limit.`);
    if (entry.fallback) fallbacks += 1;
    paths.add(`${prefix}${String(entry.output).split("/").map(encodeURIComponent).join("/")}`);
  }
  if (fallbacks !== 13) throw new Error(`Expected 13 approved fallbacks, found ${fallbacks}.`);

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [rows] = await connection.execute("SELECT src FROM product_images ORDER BY id");
    const invalid = rows.filter(row => !paths.has(String(row.src)));
    if (invalid.length) throw new Error(`${invalid.length} database image path(s) point outside the optimized manifest.`);
    console.log(`PASS - 105 WebPs, 13 approved PNG fallbacks and ${rows.length} database media path(s) match the optimized manifest.`);
  } finally { await connection.end(); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
