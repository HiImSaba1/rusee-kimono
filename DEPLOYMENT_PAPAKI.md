# Papaki Linux/Plesk deployment

The production environment follows the same Papaki server pattern as the approved reference project: database access through `127.0.0.1:3306`, authenticated SMTP through the server hostname shown by the Ruseè mailbox's own Plesk manual configurator on port `465` with implicit TLS, and Plesk-managed environment variables and Scheduled Tasks. Ruseè keeps its own database, user, mailbox and secrets; no credentials are shared between projects. Do not copy another hosted project's SMTP hostname.

## Hosting capability required

This storefront is a server-rendered Next.js application, not a static export or PHP application. The selected Papaki package must provide a supported Node.js application runtime (commonly exposed in cPanel as **Setup Node.js App** / Passenger) or a VPS on which a persistent Node process can run. Confirm this exact capability and the available Node version with Papaki before purchasing or provisioning the final package.

The application also requires:

- a MySQL/MariaDB database and database user;
- HTTPS for the storefront and payment webhooks;
- environment-variable configuration outside the public web root;
- outbound TLS connections to the payment provider and SMTP server;
- a way to run database migrations during deployment;
- a Scheduled Task for the private transactional automation worker.

## Build and application commands

Use Node.js 22 consistently for install, build and runtime. Run these from the
application directory on the Linux server, stopping after each command until
its result has been reviewed:

```bash
npm ci --legacy-peer-deps
npm run production:preflight
npm run db:migrate
npm run build
npm run start
```

For a repeatable Plesk build, set `APP_DIR` in the private deployment context and run `bash scripts/deploy-plesk.sh`. Configure root `start.js` as the Plesk application startup file, matching the proven live Papaki project. The adapter loads an optional private `.env.production.local` before starting the standalone bundle; Plesk-supplied values take precedence. Never commit or include that private file in a release archive. The build uses one worker to respect the shared server's process limit and produces Next.js standalone output. The older cPanel files remain compatibility aliases only.

Create the upload archive locally through the reviewed `Sprint08CPrepareRelease` runner action. It includes application source, migrations and required configuration only; environment files, secrets, dependencies, build caches, tests and verification artifacts are excluded.

In cPanel/Passenger, configure the application start command according to the Node application interface provided by the hosting package. Do not serve the source directory as a PHP/public site and do not expose `.env`.

Configure one Scheduled Task through Plesk/Papaki, every five minutes:

```bash
cd /absolute/path/to/kimono-shop && node scripts/run-automation-worker.mjs
```

Replace the path with the absolute application path supplied by Plesk. This single worker drains transactional email, synchronizes operational notifications and releases expired stock reservations. Do not keep the older reservation-only cron enabled alongside it.

## Production environment

Use the cPanel-created database name, database username, host and password. cPanel commonly prefixes database/user names, so do not copy local WAMP values into production.

Required application values:

```dotenv
DATABASE_URL="mysql://USER:URL_ENCODED_PASSWORD@DATABASE_HOST:3306/DATABASE_NAME"
ADMIN_SESSION_SECRET="AT_LEAST_32_RANDOM_CHARACTERS"
APP_URL="https://your-domain.gr"
AUTOMATION_SECRET="A_SEPARATE_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS"
PAYMENTS_DEFAULT_PROVIDER="fake"
ENABLE_FAKE_PAYMENTS="false"
```

The fake provider must remain disabled in production and must be replaced by the contracted live provider before launch.

## Papaki SMTP

Confirm the current Ruseè mailbox hostname in Papaki instead of copying the
working reference project's hostname. Use port 465 with implicit SSL/TLS only
when the Ruseè mailbox panel specifies it. Use the Ruseè mailbox and password,
never the reference project's credentials.

```dotenv
SMTP_HOST="RUSEE_SMTP_HOST"
SMTP_PORT="465"
SMTP_SECURE="true"
SMTP_USER="info@rusee.gr"
SMTP_PASSWORD="MAILBOX_PASSWORD"
MAIL_FROM="Ruseè <info@rusee.gr>"
ADMIN_ORDER_EMAIL="studio@your-domain.gr"
```

Use the full mailbox address as the SMTP username. Confirm SPF, DKIM and DMARC for the sending domain before enabling customer mail.

## Deployment order

1. Create the production database and least-privilege database user.
2. Configure environment variables outside version control.
3. Install exact dependencies with `npm ci`.
4. Apply migrations with `npm run db:migrate`.
5. Build and start the application.
6. Configure HTTPS and the canonical `APP_URL`.
7. Configure the private automation worker Scheduled Task.
8. Verify SMTP using a low-risk test recipient.
9. Configure the live provider webhook URL and secret.
10. Run checkout, verified payment, email, admin, reconciliation and backup/restore smoke tests.

## Health monitoring

- `GET /api/health/live` returns `200` when the Next.js process can answer requests.
- `GET /api/health/ready` returns `200` only when required production dependencies and configuration are ready; otherwise it returns `503`.
- `/admin/health` provides authenticated diagnostic detail without exposing secrets publicly.

Configure any cPanel/Papaki uptime monitor to use the liveness endpoint. Use readiness during deployments to decide when the new application instance may receive traffic.

For a manual or scheduled operational check that distinguishes a working storefront from the intentionally blocked payment-readiness state, run:

```bash
npm run monitor:site:production:private
```

This checks HTTPS liveness and the public homepage. It reports `/api/health/ready` as informational, so an intentionally unavailable live payment provider does not falsely report that the Node application is down. The command prints only HTTP status summaries and a timestamp; it never prints response bodies or environment values. It exits non-zero when liveness or the homepage fails, which makes it suitable for Plesk Scheduled Task failure notifications.

For optional outbound alerts, configure an HTTPS webhook and cooldown:

```dotenv
ALERT_WEBHOOK_URL="https://monitoring-provider.example/hooks/..."
MONITOR_ALERT_COOLDOWN_MINUTES="30"
```

Then add a cPanel cron entry, typically every five minutes:

```bash
cd /absolute/path/to/kimono-shop && npm run monitor:health:production
```

The command exits non-zero when readiness fails. Its webhook payload contains only application name, coarse status, origin and timestamp. Successful alert timestamps are recorded in the audit table to suppress repeats during the cooldown.

All responses include a Content Security Policy, clickjacking protection, MIME-sniffing protection, a restrictive permissions policy and a strict referrer policy. Production HTTPS responses additionally include HSTS. Confirm these headers after the reverse proxy/CDN is configured, because the hosting layer may append or override headers.

Never commit `.env`, mailbox passwords, database credentials, provider secrets or session secrets.
