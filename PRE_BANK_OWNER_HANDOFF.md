# Ruseè — owner pre-bank handoff

This checklist closes every launch responsibility that does not require the contracted payment provider. It does not authorize checkout, mark an order paid, send a refund, or replace legal/accounting advice.

## Owner and operator review

1. Sign in to `/admin` with the intended production owner account.
2. Open **System status** and complete only approvals supported by real evidence.
3. Open **Product readiness** and approve composition, measurements/fit, opacity, care, provenance and final media for every design after checking the final sample or supplier source.
4. Review every imported `DEMO-` order, `demo-` payment and `demo:` email record. Confirm staff can distinguish them from real commerce and that none remains queued or sending.
5. Preview and publish the seven complete bilingual information pages: shipping, payment methods, returns, cookies, privacy, terms and care guide.
6. Have the accountant approve VAT, receipt/invoice handling, rounding and shipping charges. Have the appropriate adviser approve the legal wording and return rules.
7. Confirm the courier, service areas, costs, delivery estimates, sender/return address and the daily fulfilment owner.
8. Queue one controlled email-template test to an approved recipient. Let the private worker deliver it and confirm receipt, SPF, DKIM and DMARC.
9. Confirm `/admin/automation` has no failed or stale work and `/admin/health` shows a recent worker completion.
10. Confirm the homepage, shop, a product, cart, legal pages and admin work on desktop and mobile. Do not attempt a real checkout before the provider exists.

## Plesk operator review

- Keep exactly one Scheduled Task every five minutes:
  `cd /var/www/vhosts/sabaweb.gr/rusee.gr && node --env-file=.env.production.local .next/standalone/scripts/run-automation-worker.mjs`
- Remove temporary `ADMIN_BOOTSTRAP_USERNAME` and `ADMIN_BOOTSTRAP_PASSWORD` values after the owner account is confirmed.
- Keep `ENABLE_FAKE_PAYMENTS=false`, `PAYMENTS_DEFAULT_PROVIDER=fake` and `LAUNCH_PAYMENT_PROVIDER_APPROVED=false` until the contracted integration passes.
- Set the seven non-payment `LAUNCH_*_APPROVED` flags to `true` only after the corresponding evidence above exists, then restart the Node application.
- Keep privacy retention disabled until the approved policy supplies an exact period.
- Confirm JetBackup has current website and database restore points.

## Final evidence command

Run from the private production root without printing the environment file:

```bash
node --env-file=.env.production.local .next/standalone/scripts/pre-bank-readiness-audit.mjs
```

The only acceptable final outcome before approaching the provider is:

```text
Outcome: PRE-BANK READY. All non-payment gates passed; the contracted live provider is the only recorded blocker.
```

## Bank/provider package still required

- Signed merchant agreement and selected hosted-checkout product.
- Current official sandbox/API documentation.
- Sandbox and live credentials supplied through private environment configuration.
- Registered return and signed-webhook URLs.
- Provider success, decline, cancellation, timeout, replay and mismatch evidence.
- One controlled low-value live payment and refund.

An order may become paid only from an authenticated, idempotent provider event or verified server-to-server status—not from the browser return URL.
