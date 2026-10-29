# Ruseè Kimono — Papaki/Plesk upload handoff for Codex

This file is the deployment continuation brief for a future Codex task. It adapts the Papaki procedure that worked for `alanafc.gr` to this repository, while preserving the stricter commerce, payment, stock and privacy boundaries of Ruseè.

## Start here

Workspace:

```text
C:\Users\sab_j\Desktop\Projects\Santra_Kimono\kimono-shop
```

Before changing code or preparing an upload, read in this order:

1. `AGENTS.md`
2. `codex_agent_instructions.md`
3. this file
4. `DEPLOYMENT_PAPAKI.md`
5. the current position in `sprints.md` and `TODO.md`
6. only the deployment-related sections of `ARCHITECTURE.md`

The user runs every PowerShell, npm, database, build, migration and hosting command. Codex inspects the actual repository, implements code and scripts, gives one exact command sequence, and reviews the reported result. Never print or copy secret values into chat, documentation, scripts, archives or logs.

## Non-negotiable launch boundary

Ruseè is a database-backed e-shop, not an informational site. A successful build and health response do not authorize live checkout.

- Keep `ENABLE_FAKE_PAYMENTS="false"` in production.
- Do not mark orders paid from a browser return URL.
- Do not invent provider endpoints, signatures, VAT, courier, return-policy or legal rules.
- Public checkout remains blocked until a contracted live provider is implemented from current official documentation and the business has approved tax, shipping, product, fulfilment and legal facts.
- Papaki/Plesk and JetBackup own production backup and rollback.

## Phase 1 — Inspect before changing anything

The agent must inspect the current versions of:

```text
package.json
package-lock.json
next.config.ts
start.js
.env.production.example
scripts/prepare-papaki-upload.ps1
scripts/deploy-plesk.sh
scripts/production-preflight.mjs
```

Do not assume that hostnames, database names, mailbox addresses, Node versions or Plesk paths from Alana FC belong to Ruseè. Confirm the Ruseè values with the owner and Papaki panel. Do not inspect or display `.env` secret values.

## Phase 2 — Local owner-run quality gate

Use the project runner first:

```powershell
Set-Location -LiteralPath 'C:\Users\sab_j\Desktop\Projects\Santra_Kimono\kimono-shop'

powershell -ExecutionPolicy Bypass -File '.\scripts\rusee-shop.ps1' -Action Full
if ($LASTEXITCODE -ne 0) { throw 'Ruseè full verification failed. Do not package or upload.' }
```

Then verify the deployment contract and prepare the secret-free archive:

```powershell
powershell -ExecutionPolicy Bypass -File '.\scripts\rusee-shop.ps1' -Action Sprint08CVerify
if ($LASTEXITCODE -ne 0) { throw 'Papaki release verification failed. Do not package or upload.' }

powershell -ExecutionPolicy Bypass -File '.\scripts\rusee-shop.ps1' -Action Sprint08CPrepareRelease
if ($LASTEXITCODE -ne 0) { throw 'Papaki release packaging failed.' }
```

The ZIP is created under `artifacts\releases`. Before upload, confirm that it contains application source, `public`, migrations and production scripts, but excludes `.env`, `.env.production.local`, `node_modules`, `.next`, test results, reports, local logs and database exports.

## Phase 3 — Prepare Papaki/Plesk

In Papaki/Plesk:

1. Back up the current site files and database through JetBackup/Plesk.
2. Create the production database and a least-privilege database user.
3. Create the Node.js application with the domain's private application root.
4. Select Node.js 22 if it is available and keep that same major version for install, build and runtime.
5. Set `start.js` as the application startup file.
6. Upload and extract the new ZIP into the application root.
7. Keep environment configuration private and outside the public document root.

If Plesk runs npm through `nodenv` and lifecycle scripts report `nodenv: node: command not found`, select Node 22 in the Node.js application panel and make Node 22 active for the subscription before retrying. Do not prefix a command entered in Plesk's npm-command field with `npm`, `env` or a shell assignment; that field already invokes npm.

## Phase 4 — Production environment

Start from `.env.production.example`, but never fill real values inside a committed file. Configure them in the private Plesk environment or in the private environment-loading mechanism supported by the final startup path.

Required groups include:

- `DATABASE_URL` using the production database/user and `127.0.0.1:3306` when confirmed by Papaki;
- `APP_URL` with the final HTTPS origin;
- `ADMIN_SESSION_SECRET` with at least 32 random characters;
- `AUTOMATION_SECRET` as a different random secret with at least 32 characters;
- Ruseè SMTP host, port, TLS mode, mailbox username/password and approved recipients;
- production launch approvals;
- `ENABLE_FAKE_PAYMENTS="false"`;
- the contracted non-fake provider only after its implementation is complete.

Database passwords containing reserved URL characters must be URL-encoded inside `DATABASE_URL`. Never print the resulting URL.

## Phase 5 — Install, migrate, seed controlled content and build

### Importing the current local database snapshot

The owner currently has this local phpMyAdmin export:

```text
C:\Users\sab_j\Desktop\Projects\Santra_Kimono\kimono-shop\next_kimono.sql
```

Current inspection notes (2026-09-20):

- approximately 186 KB;
- MySQL 8.2/phpMyAdmin export using `utf8mb4` and UTC;
- 35 application/migration tables;
- includes `__drizzle_migrations` history;
- includes catalogue, inventory and information-page data;
- also includes admin password hashes, audit/notification records, customers, orders, addresses, payment/refund/return/shipment records and email-delivery snapshots;
- contains `DROP TABLE IF EXISTS` for every exported table.

This is therefore a sensitive, destructive full snapshot—not a harmless seed file. Import it only when all of the following are true:

1. the selected Papaki database is the new Ruseè production database;
2. it is empty, or an immediately restorable JetBackup/database export exists;
3. no real production orders or customer records have been accepted in it;
4. the owner has approved moving the local records into production;
5. development/test customers, orders, payments, messages, email recipients, sessions, rate limits and audit records have been reviewed and are acceptable to retain;
6. the SQL file is transferred through authenticated Papaki/phpMyAdmin access and is not placed under the public web root.

Never import this snapshot over an active production database. Its `DROP TABLE IF EXISTS` statements will remove the current tables before recreating them.

For a new empty database, use phpMyAdmin:

1. Select the exact new Ruseè production database in the left sidebar.
2. Confirm there are no production tables/records that must be retained.
3. Open **Import**.
4. Choose `next_kimono.sql` from the local path above.
5. Keep character set `utf-8`/`utf8mb4` and allow the SQL transaction to complete.
6. Confirm that all 35 tables exist, including `__drizzle_migrations`.
7. Remove any uploaded server-side copy of the SQL export after the import; keep the protected local copy and JetBackup.

After importing, do not run a destructive seed. Run the normal migration command so Drizzle applies only migrations newer than the imported `__drizzle_migrations` state:

```bash
npm run db:migrate
```

Then run the controlled information-page initializer only if its current implementation remains idempotent and the agent has inspected it:

```bash
npm run content:initialize:production
```

Before public launch, use the authenticated admin to delete/disable test sessions and review every imported customer/order/payment/refund/return/email record. Synchronize the production owner credentials through the project's reviewed bootstrap flow without printing the password. Do not assume a local password hash is the intended production credential.

If the production database already contains any real data, stop. Use a purpose-built, reviewed data migration instead of importing this full dump.

Run commands from the extracted application root using Node 22:

```bash
npm ci --legacy-peer-deps
npm run db:migrate
npm run content:initialize:production
npm run build
```

Stop on the first non-zero exit code. Do not continue merely because a later command looks successful.

Notes learned from the working Alana deployment:

- `npm ci` may fail if Plesk uses a different Node executable for package lifecycle scripts. Fix the active Node/PATH in Plesk rather than repeatedly reinstalling.
- A shared Papaki server may lack the GLIBC version required by Next.js native SWC. If this occurs, adapt and verify a WASM SWC fallback in the repository; do not copy generated `.next` output from Windows.
- Keep `experimental.cpus: 1` for the constrained shared server build unless current evidence supports changing it.
- Do not upload Windows `node_modules` or a local `.next` directory.
- If filenames containing Greek or other non-ASCII characters disappear after ZIP extraction, create reviewed ASCII-safe asset names in source and update references before preparing a new archive.

After a successful standalone build, ensure the runtime bundle contains static and public assets. The existing `scripts/deploy-plesk.sh` performs this copy:

```text
.next/static       -> .next/standalone/.next/static
public             -> .next/standalone/public
```

Prefer the reviewed deployment script when Plesk provides a real shell task with `APP_DIR` and environment variables. Otherwise perform the documented steps through the Node.js panel and confirm the standalone asset directories before restart.

## Phase 6 — Admin bootstrap

Bootstrap the first owner only through the reviewed production mechanism after migrations. Never place the password in a command, screenshot, log or this file. Remove temporary bootstrap variables after the owner exists and invalidate any temporary sessions as required by the implementation.

Do not run `db:seed` against production unless the current repository documentation explicitly identifies it as safe for the intended empty production database. `content:initialize:production` is the controlled information-page initializer currently included in the deployment script.

## Phase 7 — Start and verify

Restart the Node.js application from Plesk after the build. Then verify, in this order:

1. `https://DOMAIN/api/health/live` returns HTTP 200.
2. `https://DOMAIN/api/health/ready` returns HTTP 200 only when production dependencies are ready.
3. The homepage, shop, product page, legal pages and admin login render over HTTPS.
4. Static assets, fonts, favicon and product images return successfully.
5. Private/admin/order/payment routes remain non-indexable.
6. Admin authentication works without exposing credentials.
7. Database writes use the production database and no local-development fallback.
8. Security headers survive the Plesk reverse proxy.

Treat browser cache separately when checking favicons. Confirm the direct icon URL first, then use a hard reload or private window.

## Phase 8 — Private automation worker

Configure exactly one Plesk Scheduled Task every five minutes:

```bash
cd /absolute/private/path/to/kimono-shop && node scripts/run-automation-worker.mjs
```

The worker requires `APP_URL` and the separate `AUTOMATION_SECRET`. Never place the secret in the command, URL or log. Do not keep an older reservation-only cron enabled alongside this worker.

Verify recent successful execution through the protected admin health/automation surfaces. A configured cron without a recent successful run is not production evidence.

## Phase 9 — SMTP and DNS

Confirm the current Papaki SMTP hostname instead of reusing another project's hostname. Use port 465 with implicit TLS only when that is what the mailbox panel specifies. The SMTP username is normally the complete mailbox address.

Verify connection first, then send only one explicitly confirmed smoke message to an approved recipient. Confirm SPF, DKIM and DMARC before enabling customer transactional mail. Never send test mail during deterministic local verification.

## Phase 10 — SSL, domain and final acceptance

1. Assign a valid certificate to the final domain in Plesk.
2. Enable HTTPS redirection only after the certificate is active.
3. Update `APP_URL` to the canonical HTTPS origin and rebuild/restart if required.
4. Recheck live/readiness endpoints and canonical metadata.
5. Complete desktop/mobile, keyboard, reduced-motion and a real checkout test only after the live payment provider is approved and implemented.
6. Record the exact deployed archive, migration state, environment review, smoke-test results and JetBackup restore point.

## Rollback rule

If migration, build, startup, readiness or smoke verification fails:

- stop and retain the exact error;
- do not repeatedly mutate production;
- do not delete commerce records or migration history;
- restore files/database only through the approved Plesk/JetBackup procedure;
- confirm database and application versions are compatible before restarting.

## Suggested prompt for the deployment task

```text
Help me deploy the Ruseè Kimono project from C:\Users\sab_j\Desktop\Projects\Santra_Kimono\kimono-shop to Papaki/Plesk. Read AGENTS.md, codex_agent_instructions.md and CODEX_PAPAKI_UPLOAD_HANDOFF.md first, then inspect the current deployment files and package scripts. Preserve the commerce/payment/security boundaries and never inspect, print or copy secret values. I run every command; you implement code/scripts, give me one exact owner-run command sequence at a time, and review the reported output before continuing. Do not claim that checkout is launch-ready without a contracted live payment provider and the recorded business/legal approvals.
```
