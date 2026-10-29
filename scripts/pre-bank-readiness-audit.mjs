import mysql from "mysql2/promise";

const checks = [];
const bankWait = [];

function add(name, ok, detail, owner = "technical") {
  checks.push({ name, ok, detail, owner });
}

function present(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}

function approved(name) {
  return process.env[name]?.trim().toLowerCase() === "true";
}

function number(value) {
  return Number(value ?? 0);
}

const requiredNonBankApprovals = [
  "LAUNCH_HOSTING_APPROVED",
  "LAUNCH_EMAIL_DNS_APPROVED",
  "LAUNCH_TAX_SHIPPING_APPROVED",
  "LAUNCH_LEGAL_APPROVED",
  "LAUNCH_PRODUCT_DATA_APPROVED",
  "LAUNCH_FULFILMENT_APPROVED",
  "LAUNCH_IMPORTED_HISTORY_REVIEWED",
];

const nodeMajor = Number(process.versions.node.split(".")[0]);
add("node_runtime", nodeMajor === 22, `Node ${process.versions.node}; Node.js 22 is required`);

let appOrigin;
try {
  appOrigin = new URL(process.env.APP_URL ?? "");
  add("canonical_https", appOrigin.protocol === "https:", appOrigin.protocol === "https:" ? "Canonical production origin uses HTTPS" : "APP_URL must use HTTPS");
} catch {
  add("canonical_https", false, "APP_URL must be a valid HTTPS origin");
}

add("fake_payments_disabled", process.env.ENABLE_FAKE_PAYMENTS === "false", "ENABLE_FAKE_PAYMENTS must remain false");
add("admin_session_secret", (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32, "Admin session secret contains at least 32 characters");
const automationSecret = process.env.AUTOMATION_SECRET ?? "";
add("automation_secret", automationSecret.length >= 32 && automationSecret !== process.env.ADMIN_SESSION_SECRET, "Automation secret is distinct and contains at least 32 characters");
add("bootstrap_credentials_removed", !present("ADMIN_BOOTSTRAP_USERNAME") && !present("ADMIN_BOOTSTRAP_PASSWORD"), "Temporary owner bootstrap variables are absent");
add("smtp_configuration", present("SMTP_HOST") && Number(process.env.SMTP_PORT) === 465 && process.env.SMTP_SECURE === "true" && present("SMTP_USER") && present("SMTP_PASSWORD") && present("MAIL_FROM"), "Authenticated SMTP 465 with implicit TLS is configured", "owner/domain");
add("notification_recipients", present("ADMIN_ORDER_EMAIL") && present("CONTACT_STUDIO_EMAIL"), "Approved order and enquiry recipients are configured", "owner");
add("privacy_retention_safe", process.env.PRIVACY_RETENTION_ENABLED !== "true", "Automatic privacy retention remains disabled until legal approval");

for (const key of requiredNonBankApprovals) {
  add(`approval_${key.toLowerCase()}`, approved(key), `${key} must be explicitly approved before the bank handoff`, "owner/professional");
}

const provider = process.env.PAYMENTS_DEFAULT_PROVIDER ?? "fake";
const paymentApproved = approved("LAUNCH_PAYMENT_PROVIDER_APPROVED");
const waitingForBank = provider === "fake" && !paymentApproved && process.env.ENABLE_FAKE_PAYMENTS === "false";
bankWait.push({
  name: "contracted_payment_provider",
  ok: waitingForBank,
  detail: waitingForBank
    ? "Expected final blocker: contracted provider, official documentation, credentials, webhook and controlled payment/refund evidence"
    : "Payment state is not the expected pre-bank configuration; keep the fake adapter disabled and do not approve payments early",
});

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  const [[database]] = await connection.query("SELECT DATABASE() AS database_name");
  add("production_database", database?.database_name === "next_rusee", database?.database_name === "next_rusee" ? "Connected to the exact next_rusee database" : "The selected database is not next_rusee");

  const [[admins]] = await connection.query(`SELECT
    COALESCE(SUM(active=1),0) AS active_admins,
    COALESCE(SUM(active=1 AND role='owner'),0) AS active_owners,
    COALESCE(SUM(active=1 AND role IN ('owner','manager')),0) AS operational_admins,
    COALESCE(SUM(active=1 AND last_login_at IS NOT NULL),0) AS admins_with_login
    FROM admin_users`);
  add("admin_owner", number(admins.active_owners) >= 1 && number(admins.operational_admins) >= 1, `${admins.active_admins} active admin(s), ${admins.active_owners} owner(s), ${admins.admins_with_login} with recorded login`, "owner");

  const [[catalogue]] = await connection.query(`SELECT
    (SELECT COUNT(*) FROM designs WHERE active=1) AS active_designs,
    (SELECT COUNT(*) FROM product_variants WHERE active=1) AS active_variants,
    (SELECT COUNT(*) FROM product_variants v LEFT JOIN inventory i ON i.variant_id=v.id WHERE v.active=1 AND (i.id IS NULL OR i.on_hand<0 OR i.reserved<0 OR i.reserved>i.on_hand OR v.price_minor<=0)) AS invalid_variants,
    (SELECT COUNT(*) FROM design_fact_approvals dfa INNER JOIN designs d ON d.id=dfa.design_id WHERE d.active=1) AS fact_approval_records,
    (SELECT COUNT(*) FROM design_fact_approvals dfa INNER JOIN designs d ON d.id=dfa.design_id WHERE d.active=1 AND dfa.status<>'approved') AS pending_fact_approvals,
    (SELECT COUNT(*) FROM designs d WHERE d.active=1 AND NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.design_id=d.id AND COALESCE(pi.alt_el,'')<>'' AND COALESCE(pi.alt_en,'')<>'')) AS designs_missing_media`);
  add("catalogue_structure", number(catalogue.active_designs) === 15 && number(catalogue.active_variants) > 0 && number(catalogue.invalid_variants) === 0 && number(catalogue.designs_missing_media) === 0, `${catalogue.active_designs} designs, ${catalogue.active_variants} variants, ${catalogue.invalid_variants} invalid variants, ${catalogue.designs_missing_media} designs missing bilingual media`, "owner/production");
  add("catalogue_fact_approvals", number(catalogue.fact_approval_records) === number(catalogue.active_designs) * 6 && number(catalogue.pending_fact_approvals) === 0, `${catalogue.fact_approval_records}/${number(catalogue.active_designs) * 6} required product-fact records exist; ${catalogue.pending_fact_approvals} remain pending`, "owner/production");

  const [[information]] = await connection.query(`SELECT
    COUNT(*) AS fixed_pages,
    COALESCE(SUM(status='published'),0) AS published_pages,
    COALESCE(SUM(CONCAT_WS(' ',title_el,title_en,intro_el,intro_en,sections) REGEXP 'ADD_YOUR|placeholder|replace before launch'),0) AS placeholder_pages
    FROM store_information_pages
    WHERE slug IN ('shipping','payment-methods','returns','cookies','privacy-policy','terms','care-guide')`);
  add("published_information", number(information.fixed_pages) === 7 && number(information.published_pages) === 7 && number(information.placeholder_pages) === 0, `${information.published_pages}/7 fixed bilingual information pages are published; ${information.placeholder_pages} contain placeholder markers`, "owner/legal");

  const [[demo]] = await connection.query(`SELECT
    (SELECT COUNT(*) FROM orders WHERE order_number LIKE 'DEMO-%') AS demo_orders,
    (SELECT COUNT(*) FROM payments WHERE provider_payment_id LIKE 'demo-%') AS demo_payments,
    (SELECT COUNT(*) FROM email_deliveries WHERE idempotency_key LIKE 'demo:%') AS demo_emails,
    (SELECT COUNT(*) FROM email_deliveries WHERE idempotency_key LIKE 'demo:%' AND status IN ('queued','sending')) AS actionable_demo_emails`);
  add("imported_demo_isolation", number(demo.actionable_demo_emails) === 0 && approved("LAUNCH_IMPORTED_HISTORY_REVIEWED"), `${demo.demo_orders} demo orders, ${demo.demo_payments} demo payments and ${demo.demo_emails} demo emails are identifiable; ${demo.actionable_demo_emails} remain actionable`, "owner");

  const [[commerce]] = await connection.query(`SELECT
    COALESCE(SUM(o.order_number NOT LIKE 'DEMO-%' AND o.fulfilment_status IN ('processing','shipped','delivered') AND NOT EXISTS (
      SELECT 1 FROM payments p WHERE p.order_id=o.id AND p.status='captured' AND p.amount_minor=o.total_minor AND p.currency=o.currency
    )),0) AS unsafe_fulfilment,
    COALESCE(SUM(o.order_number NOT LIKE 'DEMO-%' AND o.payment_status='paid' AND NOT EXISTS (
      SELECT 1 FROM payments p WHERE p.order_id=o.id AND p.status='captured' AND p.amount_minor=o.total_minor AND p.currency=o.currency
    )),0) AS paid_without_evidence
    FROM orders o`);
  add("commerce_integrity", number(commerce.unsafe_fulfilment) === 0 && number(commerce.paid_without_evidence) === 0, `${commerce.unsafe_fulfilment} unsafe fulfilment record(s); ${commerce.paid_without_evidence} paid order(s) without matching captured evidence`);

  const [[templates]] = await connection.query(`SELECT
    COALESCE(SUM(system=1),0) AS system_templates,
    COALESCE(SUM(system=1 AND (status<>'active' OR active_version_id IS NULL)),0) AS inactive_system_templates
    FROM email_templates`);
  add("transactional_templates", number(templates.system_templates) === 6 && number(templates.inactive_system_templates) === 0, `${templates.system_templates} system templates; ${templates.inactive_system_templates} are inactive or lack an active version`, "owner");

  const [[email]] = await connection.query(`SELECT
    COALESCE(SUM(status='failed' AND idempotency_key NOT LIKE 'demo:%'),0) AS failed_non_demo,
    COALESCE(SUM(status IN ('queued','sending') AND created_at<DATE_SUB(NOW(),INTERVAL 15 MINUTE) AND idempotency_key NOT LIKE 'demo:%'),0) AS stale_non_demo,
    COALESCE(SUM(status='sent' AND idempotency_key LIKE 'template-test:%'),0) AS sent_template_tests
    FROM email_deliveries`);
  add("email_queue", number(email.failed_non_demo) === 0 && number(email.stale_non_demo) === 0, `${email.failed_non_demo} failed and ${email.stale_non_demo} stale non-demo deliveries`);
  add("smtp_delivery_evidence", number(email.sent_template_tests) >= 1, `${email.sent_template_tests} controlled template test delivery/deliveries are recorded as sent`, "owner/domain");

  const [[automation]] = await connection.query(`SELECT
    MAX(CASE WHEN status='completed' THEN completed_at END) AS last_completed_at,
    TIMESTAMPDIFF(MINUTE,MAX(CASE WHEN status='completed' THEN completed_at END),NOW()) AS last_completed_age_minutes,
    COALESCE(SUM(status IN ('queued','retry_wait') AND run_at<=NOW()),0) AS due_jobs,
    COALESCE(SUM(status='failed'),0) AS failed_jobs,
    COALESCE(SUM(status='processing' AND locked_at<DATE_SUB(NOW(),INTERVAL 10 MINUTE)),0) AS stale_locks
    FROM automation_jobs`);
  const workerFresh = automation.last_completed_at && number(automation.last_completed_age_minutes) <= 15;
  add("automation_worker", Boolean(workerFresh) && number(automation.due_jobs) === 0 && number(automation.failed_jobs) === 0 && number(automation.stale_locks) === 0, `last completion age ${automation.last_completed_age_minutes ?? "never"} minute(s); ${automation.due_jobs} due, ${automation.failed_jobs} failed, ${automation.stale_locks} stale`, "operator");

  const [[privacy]] = await connection.query("SELECT COALESCE(SUM(status='pending'),0) AS pending_requests FROM privacy_requests");
  add("privacy_queue", number(privacy.pending_requests) === 0, `${privacy.pending_requests} privacy request(s) remain pending`, "owner");
} finally {
  await connection.end();
}

if (appOrigin?.protocol === "https:") {
  try {
    const [home, live] = await Promise.all([
      fetch(new URL("/", appOrigin), { redirect: "follow", signal: AbortSignal.timeout(20_000) }),
      fetch(new URL("/api/health/live", appOrigin), { redirect: "error", signal: AbortSignal.timeout(20_000) }),
    ]);
    add("live_storefront", home.ok && live.ok, `Homepage HTTP ${home.status}; liveness HTTP ${live.status}`, "operator");
  } catch {
    add("live_storefront", false, "Homepage or liveness request failed", "operator");
  }
}

console.log("Ruseè pre-bank readiness audit (read-only; no secrets or customer records are printed)");
for (const check of checks) console.log(`${check.ok ? "PASS" : "ACTION REQUIRED"} - ${check.name}: ${check.detail} [owner: ${check.owner}]`);
for (const item of bankWait) console.log(`${item.ok ? "WAITING FOR BANK" : "ACTION REQUIRED"} - ${item.name}: ${item.detail}`);

const blocking = checks.filter((check) => !check.ok);
const bankStateValid = bankWait.every((item) => item.ok);
if (blocking.length === 0 && bankStateValid) {
  console.log("Outcome: PRE-BANK READY. All non-payment gates passed; the contracted live provider is the only recorded blocker.");
} else {
  console.log(`Outcome: NOT PRE-BANK READY. ${blocking.length} non-payment gate(s) still require evidence or approval.`);
  process.exitCode = 1;
}
