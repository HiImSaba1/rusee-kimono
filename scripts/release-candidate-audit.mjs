import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const expectedDesigns = [
  ["Artemis", "Άρτεμις", 1],
  ["Birds", "Πουλιά", 11],
  ["Circles Bluebelt", "Κύκλοι με Μπλε Ζώνη", 1],
  ["Circles Lightbelt", "Κύκλοι με Ανοιχτή Ζώνη", 2],
  ["Drops", "Σταγόνες", 12],
  ["Eyes", "Μάτια", 4],
  ["Figs", "Σύκα", 9],
  ["Lily Pond", "Λίμνη με Νούφαρα", 19],
  ["Liquid Geo", "Ρευστή Γεωμετρία", 11],
  ["Neon Shapes", "Νέον Σχήματα", 13],
  ["Nordic Flowers", "Σκανδιναβικά Λουλούδια", 9],
  ["Pomegranate", "Ρόδι", 3],
  ["Rhobus", "Ρόμβος", 3],
  ["Seabed", "Βυθός", 8],
  ["Stripes", "Ρίγες", 10],
];

const checks = [];
const review = [];
const add = (name, ok, detail) => checks.push({ name, ok, detail });

async function publicSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await publicSourceFiles(target));
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) files.push(target);
  }
  return files;
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
add("node_runtime", Number(process.versions.node.split(".")[0]) === 22, `Node ${process.versions.node}; Node.js 22 is required`);

const publicFiles = (await publicSourceFiles(path.join(process.cwd(), "src"))).filter((file) => !file.includes(`${path.sep}admin${path.sep}`));
const publicSource = (await Promise.all(publicFiles.map((file) => readFile(file, "utf8")))).join("\n");
const publicDemoPattern = /Temporary layout sample|not for publication|Μαρία Π\.|Ελένη Κ\.|Δάφνη Μ\.|Ιωάννα Σ\.|Νεφέλη Α\.|Άννα Ρ\./i;
add("public_demo_copy", !publicDemoPattern.test(publicSource), "No invented testimonial names or public demo notices remain in storefront source");
add("static_price_claims", !/From €\d+|Από €\d+/.test(publicSource), "No hard-coded starting-price claim remains in storefront source");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [products] = await connection.execute(`SELECT id,title,subtitle,description,status FROM products ORDER BY id`);
  const activeProducts = products.filter((product) => product.status === "active");
  add("active_product", activeProducts.length === 1, `${activeProducts.length} active product record(s); expected exactly 1`);
  const productCopyComplete = activeProducts.every((product) => [product.title, product.subtitle, product.description].every((value) => typeof value === "string" && value.trim().length >= 3));
  add("product_copy", productCopyComplete, "Active product title, subtitle and description are populated");

  const [designs] = await connection.execute(`SELECT id,name,name_el,description_en,description_el,details_en,details_el,fixed_colour_id,active FROM designs ORDER BY product_id,sort_order,id`);
  const activeDesigns = designs.filter((design) => Boolean(design.active));
  add("design_count", activeDesigns.length === expectedDesigns.length, `${activeDesigns.length} active designs; expected ${expectedDesigns.length}`);
  const identityIssues = expectedDesigns.flatMap(([name, nameEl], index) => {
    const actual = activeDesigns[index];
    return actual?.name === name && actual?.name_el === nameEl ? [] : [`${index + 1}: expected ${name} / ${nameEl}`];
  });
  add("design_identities", identityIssues.length === 0, identityIssues.length ? identityIssues.join("; ") : "All bilingual design names match the approved image collections");
  const incompleteProfiles = activeDesigns.filter((design) => !design.fixed_colour_id || [design.description_en, design.description_el, design.details_en, design.details_el].some((value) => typeof value !== "string" || value.trim().length < 10));
  add("design_profiles", incompleteProfiles.length === 0, `${incompleteProfiles.length} active design profile(s) are incomplete`);

  const [[variantSummary]] = await connection.execute(`SELECT
    COUNT(*) active_variants,
    COUNT(DISTINCT sku) distinct_skus,
    SUM(price_minor<=0) invalid_prices,
    SUM(currency<>'EUR') non_eur,
    SUM(i.id IS NULL) missing_inventory,
    SUM(CASE WHEN i.id IS NOT NULL AND (i.on_hand<0 OR i.reserved<0 OR i.reserved>i.on_hand) THEN 1 ELSE 0 END) invalid_inventory
    FROM product_variants v LEFT JOIN inventory i ON i.variant_id=v.id WHERE v.active=true`);
  add("variant_skus", Number(variantSummary.active_variants) > 0 && Number(variantSummary.active_variants) === Number(variantSummary.distinct_skus), `${variantSummary.active_variants} active variants and ${variantSummary.distinct_skus} distinct SKUs`);
  add("variant_prices", Number(variantSummary.invalid_prices) === 0 && Number(variantSummary.non_eur) === 0, `${variantSummary.invalid_prices} invalid prices and ${variantSummary.non_eur} non-EUR variants`);
  add("variant_inventory", Number(variantSummary.missing_inventory) === 0 && Number(variantSummary.invalid_inventory) === 0, `${variantSummary.missing_inventory} missing and ${variantSummary.invalid_inventory} invalid inventory rows`);

  const [mediaRows] = await connection.execute(`SELECT d.name,
    COUNT(DISTINCT pi.src) image_count,
    SUM(pi.src NOT LIKE '/kimono_images_optimized/%') non_optimized,
    SUM(COALESCE(pi.alt_en,'')='' OR COALESCE(pi.alt_el,'')='') missing_alt
    FROM designs d LEFT JOIN product_images pi ON pi.design_id=d.id
    WHERE d.active=true GROUP BY d.id,d.name,d.sort_order ORDER BY d.sort_order,d.id`);
  const mediaIssues = expectedDesigns.flatMap(([name, , expectedImages], index) => {
    const row = mediaRows[index];
    if (!row || row.name !== name) return [`${name}: media row missing or misordered`];
    const issues = [];
    if (Number(row.image_count) < expectedImages) issues.push(`${name}: ${row.image_count}/${expectedImages} distinct images`);
    if (Number(row.non_optimized) > 0) issues.push(`${name}: ${row.non_optimized} non-optimized paths`);
    if (Number(row.missing_alt) > 0) issues.push(`${name}: ${row.missing_alt} missing bilingual alt records`);
    return issues;
  });
  add("catalogue_media", mediaIssues.length === 0, mediaIssues.length ? mediaIssues.join("; ") : "Every design has its complete optimized gallery and bilingual alternative text");

  const [[demo]] = await connection.execute(`SELECT
    (SELECT COUNT(*) FROM orders WHERE order_number LIKE 'DEMO-%') demo_orders,
    (SELECT COUNT(*) FROM payments WHERE provider_payment_id LIKE 'demo-%') demo_payments,
    (SELECT COUNT(*) FROM email_deliveries WHERE idempotency_key LIKE 'demo:%') demo_emails`);
  const demoCount = Number(demo.demo_orders) + Number(demo.demo_payments) + Number(demo.demo_emails);
  if (demoCount > 0) review.push(`Imported operational snapshot contains ${demo.demo_orders} demo orders, ${demo.demo_payments} demo payments and ${demo.demo_emails} demo email records. Preserve history; review and isolate it before launch.`);

  const [[published]] = await connection.execute(`SELECT
    COUNT(*) published_pages,
    COALESCE(SUM(CONCAT_WS(' ',title_el,title_en,intro_el,intro_en,sections) REGEXP 'ADD_YOUR|placeholder|replace before launch'),0) placeholder_pages
    FROM store_information_pages WHERE status='published'`);
  add("published_information", Number(published.placeholder_pages) === 0, `${published.published_pages} published information pages; ${published.placeholder_pages} contain placeholder markers`);
} finally {
  await connection.end();
}

console.log("Ruseè release-candidate audit (read-only; no credentials or customer data are printed)");
for (const check of checks) console.log(`${check.ok ? "PASS" : "FAIL"} - ${check.name}: ${check.detail}`);
for (const item of review) console.log(`REVIEW REQUIRED - imported_demo_history: ${item}`);
console.log("Outcome: this audit verifies catalogue structure and public release content only. It does not approve payments, legal copy, SMTP, deployment or launch.");
if (checks.some((check) => !check.ok)) process.exitCode = 1;
