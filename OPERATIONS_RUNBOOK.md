# Ruseè production operations — Papaki/Plesk

This runbook is deliberately redacted. JetBackup/Plesk owns selectable restore points for both website files and MySQL. Never paste credentials into tickets, logs, commands, or this repository.

## Deployment

1. Confirm Plesk exposes Node 20.9 or newer and a persistent Node application process.
2. Create a least-privilege MySQL database/user and configure the values from `.env.production.example` in Plesk environment settings.
3. Keep `ENABLE_FAKE_PAYMENTS=false`. A fake default provider means checkout is not launch-ready.
4. Use `scripts/deploy-cpanel.sh` from the private application directory, apply migrations once, then restart through Plesk.
5. Confirm `/api/health/live`, `/api/health/ready`, HTTPS redirects, security headers and `/admin/health` before directing traffic.

## Scheduled Tasks

Configure exactly one private application worker in Plesk Scheduled Tasks. For the verified standalone release layout, run every five minutes:

- `cd /var/www/vhosts/sabaweb.gr/rusee.gr && node --env-file=.env.production.local .next/standalone/scripts/run-automation-worker.mjs`

This one worker owns reservation release, email dispatch and operational notification synchronization. Do not run the older reservation-only task alongside it. After an alert destination is approved, the separate site monitor may run every five minutes without calling the automation endpoint:

- `cd /var/www/vhosts/sabaweb.gr/rusee.gr && node --env-file=.env.production.local .next/standalone/scripts/check-production-site.mjs`
- Privacy retention: keep disabled. Add a schedule only after legal approval and a reviewed dry run.

Plesk should email task failures to the operator. Do not expose a public cron endpoint or put secrets in the task command.
The `:production` commands consume Plesk-injected environment variables and do not require a readable `.env` file in the application directory.

## Rollback

Papaki/Plesk and JetBackup exclusively own release, website-file, and MySQL rollback. The application does not duplicate or automate those hosting controls.

1. Put checkout into maintenance mode or stop new traffic.
2. Preserve current logs and note the release identifier and failure time.
3. Ask Papaki/Plesk support or use the approved Plesk restore point to restore the previous application release.
4. Restore MySQL with JetBackup only when the incident requires data restoration; application rollback alone must not rewind valid orders.
5. Run migrations only forward unless a reviewed migration explicitly supports rollback.
6. Verify liveness, readiness, admin orders, inventory reservations and payment reconciliation before reopening checkout.

## Maintenance mode

- Set `MAINTENANCE_MODE=true` in the Plesk application environment and restart the Node application to pause new storefront, cart and checkout traffic.
- Admin, health/API callbacks, existing order-status routes and payment-return routes remain reachable so operations and in-flight provider events are not interrupted.
- After Papaki/Plesk completes the rollback or maintenance task, verify health, admin orders and reconciliation, set `MAINTENANCE_MODE=false`, and restart the application.
- This flag does not back up, restore, delete, migrate or rewind any data.

## Incident and support

- Payment disagreement: stop fulfilment, retain provider event evidence, use reconciliation, and never manually mark paid from a browser return.
- Email failure: enquiries/orders remain stored; review the admin email ledger and use its capped explicit retry.
- Database failure: stop writes, capture timestamps, check Plesk/MySQL state, then select the narrowest JetBackup restore point.
- Compromise suspicion: rotate affected mailbox, database, admin-session, automation and provider credentials; invalidate admin sessions; preserve redacted audit evidence.
- Customer support: identify records by public order/enquiry ID. Do not exchange passwords, raw authorization headers, or full payment payloads.

## Launch evidence checklist

- Node/persistent process, MySQL, HTTPS/proxy headers and health endpoints verified.
- Papaki SMTP 465/TLS tested with an approved low-risk recipient; SPF, DKIM and DMARC confirmed in Papaki/Plesk.
- Reservation and monitoring Scheduled Tasks observed completing successfully.
- JetBackup website/database restore point confirmed.
- Fake payments disabled and contracted provider verified server-side.
- VAT, shipping, returns, privacy, invoicing and product measurements approved by the relevant owner/professionals.
