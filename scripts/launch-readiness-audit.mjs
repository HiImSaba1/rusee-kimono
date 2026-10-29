import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const automated = [];
const decisions = [
  ["live_payment_provider", "BLOCKED", "Contracted provider, official documentation and credentials are required."],
  ["vat_and_invoicing", "APPROVAL REQUIRED", "Confirm VAT, receipt/invoice and rounding rules with the accountant."],
  ["shipping_and_returns", "APPROVAL REQUIRED", "Confirm delivery zones, charges, return window and return costs with the client/legal adviser."],
  ["legal_copy", "APPROVAL REQUIRED", "Approve terms, privacy, cookies and returns copy with the appropriate Greek professionals."],
  ["final_catalogue", "APPROVAL REQUIRED", "Approve final photography, measurements, composition, care and launch stock."],
];

try {
  const [tables] = await connection.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('commerce_rate_limits','privacy_requests','product_images','orders','payments')");
  automated.push(["database_contract", tables.length === 5, `${tables.length}/5 launch tables available`]);
  const [[catalogue]] = await connection.query(`SELECT
    (SELECT COUNT(*) FROM designs WHERE active=true) active_designs,
    (SELECT COUNT(*) FROM product_variants WHERE active=true) active_variants,
    (SELECT COUNT(*) FROM product_variants v LEFT JOIN inventory i ON i.variant_id=v.id WHERE v.active=true AND i.id IS NULL) missing_inventory,
    (SELECT COUNT(*) FROM (SELECT v.design_id,v.size_id FROM product_variants v LEFT JOIN product_images pi ON pi.design_id=v.design_id AND pi.size_id=v.size_id WHERE v.active=true GROUP BY v.design_id,v.size_id HAVING COUNT(pi.id)<3) media_gaps) media_gaps`);
  automated.push(["catalogue_integrity", Number(catalogue.active_designs) === 15 && Number(catalogue.active_variants) > 0 && Number(catalogue.missing_inventory) === 0, `${catalogue.active_designs} designs, ${catalogue.active_variants} variants, ${catalogue.missing_inventory} missing inventory rows`]);
  automated.push(["final_size_media", Number(catalogue.media_gaps) === 0, `${catalogue.media_gaps} active design/size galleries still use provisional media`, "approval"]);
  const template = readFileSync(".env.production.example", "utf8");
  automated.push(["fake_payment_default", template.includes('ENABLE_FAKE_PAYMENTS="false"'), "Production template disables fake execution"]);
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  automated.push(["reservation_scheduler", pkg.scripts?.["db:release-reservations:production"] === "node scripts/release-expired-reservations.mjs", "Production reservation-release command exists"]);
  const packager = readFileSync("scripts/prepare-papaki-upload.ps1", "utf8");
  automated.push(["release_allowlist", packager.includes("$ProductionScripts") && !packager.includes('"scripts", "src"'), "Production scripts use an explicit allowlist"]);

  console.log("Ruseè launch-readiness audit (redacted; no secret values)");
  for (const [name, ok, detail, classification] of automated) console.log(`${ok ? "PASS" : classification === "approval" ? "APPROVAL REQUIRED" : "FAIL"} - ${name}: ${detail}`);
  for (const [name, status, detail] of decisions) console.log(`${status} - ${name}: ${detail}`);
  console.log("Outcome: code may proceed to production-like staging only when all automated checks pass. This is not live-launch approval.");
  if (automated.some(([, ok, , classification]) => !ok && classification !== "approval")) process.exitCode = 1;
} finally {
  await connection.end();
}
