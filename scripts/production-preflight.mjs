const checks = [];

function add(name, ok, detail) {
  checks.push({ name, ok, detail });
}

function present(name) {
  return typeof process.env[name] === "string" && process.env[name].trim().length > 0;
}

const nodeMajor = Number(process.versions.node.split(".")[0]);
add("node_runtime", nodeMajor === 22, `Node ${process.versions.node}; this Papaki release requires Node.js 22 consistently`);

let databaseSafe = false;
try {
  const database = new URL(process.env.DATABASE_URL ?? "");
  databaseSafe =
    database.protocol === "mysql:" &&
    Boolean(database.hostname && database.username) &&
    decodeURIComponent(database.pathname.slice(1)) === "next_rusee";
} catch {}
add("database_configuration", databaseSafe, databaseSafe ? "MySQL URL targets the exact next_rusee database" : "DATABASE_URL must be a valid MySQL URL targeting next_rusee");

let appUrlSafe = false;
try {
  appUrlSafe = new URL(process.env.APP_URL ?? "").protocol === "https:";
} catch {}
add("canonical_https", appUrlSafe, appUrlSafe ? "APP_URL uses HTTPS" : "Production APP_URL must use HTTPS");

const smtpPort = Number(process.env.SMTP_PORT);
const smtpSafe = present("SMTP_HOST") && present("SMTP_USER") && present("SMTP_PASSWORD") && present("MAIL_FROM") && smtpPort === 465 && process.env.SMTP_SECURE === "true";
add("papaki_smtp", smtpSafe, smtpSafe ? "Authenticated SMTP 465 with implicit TLS is configured" : "SMTP host/user/password/from and secure port 465 are required");

add("admin_session", (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32, "Session secret must contain at least 32 characters");
const automationSecret = process.env.AUTOMATION_SECRET ?? "";
const automationSafe = automationSecret.length >= 32 && automationSecret !== process.env.ADMIN_SESSION_SECRET;
add("automation_secret", automationSafe, "Automation secret must contain at least 32 characters and differ from the admin session secret");
add("notification_recipients", present("ADMIN_ORDER_EMAIL") && present("CONTACT_STUDIO_EMAIL"), "Order and enquiry recipients must be configured");

const fakeDisabled = process.env.ENABLE_FAKE_PAYMENTS === "false";
const liveProvider = present("PAYMENTS_DEFAULT_PROVIDER") && process.env.PAYMENTS_DEFAULT_PROVIDER !== "fake";
add("fake_payment_routes", fakeDisabled, fakeDisabled ? "Fake-payment execution is disabled" : "ENABLE_FAKE_PAYMENTS must be false");
add("launch_payment_provider", liveProvider, liveProvider ? "A non-fake default provider is selected" : "BLOCKED until the contracted provider is implemented; do not launch checkout");

add("retention_safety", process.env.PRIVACY_RETENTION_ENABLED !== "true", "Automatic privacy retention remains disabled until legal approval");
add("monitoring_destination", present("ALERT_WEBHOOK_URL"), present("ALERT_WEBHOOK_URL") ? "Redacted monitoring destination configured" : "Optional monitoring destination is not configured");

console.log("Ruseè production capability preflight (no secret values are printed)");
for (const check of checks) console.log(`${check.ok ? "PASS" : "ATTENTION"} - ${check.name}: ${check.detail}`);

const required = checks.filter((check) => !["launch_payment_provider", "monitoring_destination"].includes(check.name));
if (required.some((check) => !check.ok)) process.exitCode = 1;
