# Ruseè Kimono — compact next-Codex handoff

Updated: 2026-08-21. This file is intentionally short. Do not reconstruct prior chat history.

## Read order

1. `AGENTS.md` completely.
2. This file completely.
3. Only Sprint 07–08 in `sprints.md`.
4. Only `Immediate next task` in `TODO.md`.
5. Only relevant deployment/payment boundaries in `ARCHITECTURE.md`.

Never inspect or print `.env`. Preserve the dirty worktree. The user runs every command; Codex only edits code and reviewed PowerShell actions in `scripts/rusee-shop.ps1`.

## Current verified state

- Sprints 01–07 and Sprints 08A–08N passed and are clean. Sprint 08O admin information content is implemented and awaits migration/verification. The ten-order admin demo seed/verification also passed.
- Sprint 08A report `artifacts/verification/sprint-08a-results.txt` confirms ESLint, TypeScript, 30 Vitest tests, production build and diff checks passed on 2026-08-20.
- Latest browser diagnostics: 29 applicable tests passed, 3 desktop mobile-only checks skipped intentionally, exit 0.
- The isolated `.next-playwright` output is excluded from ESLint.
- Playwright uses isolated port `3107` and `.next-playwright` through `dev:test`. The user-facing `Dev` action uses `dev:local`, port 3000 and the normal `.next` directory. Both development servers can run concurrently without sharing Next.js 16's dev lock.
- Papaki JetBackup/Plesk owns database/file backups and restore points. Plesk Scheduled Tasks/private cron are available.
- Greek is primary; English is secondary. Development contact notifications currently go to the developer mailbox configured in `.env`.
- Live payment work remains blocked by provider contract, official current documentation and credentials. Never mark an order paid from a browser return.

## Sprint 08A verified

- Admin menu reorganized into five groups without deleting routes:
  - Overview
  - Sales: Orders, Order workflow, Payments, Payment checks
  - Catalogue: Products, Add product, Images, Stock
  - Customers: Enquiries, Email, Privacy
  - System: Health
- `Sprint08AVerify` is available in the runner and passed.

Live local site on port 3000:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Dev
```

## Token-saving continuation protocol

1. Do not reconstruct or summarize the old conversation.
2. Read only the files in the `Read order` above.
3. Treat Sprints 08A–08M as verified; do not reread their reports unless a regression directly requires it.
4. Run Sprint 08O preparation first, then review only its diagnostics/results. Sprint 09 remains blocked without provider inputs.
5. Put any required command inside `scripts/rusee-shop.ps1` and give the user one PowerShell action to run.
6. Keep updates compact and never inspect `.env`.

## Immediate next task — prepare and verify Sprint 08O admin content

Sprint 08N passed on 2026-08-24. Run `Sprint08OPrepare` to generate/apply the content migration and initialize seven non-destructive draft records, then run `Sprint08OVerify`. Review `sprint-08o-admin-diagnostics.txt` and `sprint-08o-results.txt`. Public routes keep their reviewed code defaults until an owner/manager explicitly publishes complete paired Greek/English sections; the verification action does not publish or alter customer-facing content.

An idempotent local admin dataset is also implemented. `DemoSeed` resets only scoped `DEMO-*` records and creates ten complete operational scenarios; `DemoVerify` is read-only. Review `artifacts/verification/admin-demo-results.txt`. No real mail or payment is triggered. The walkthrough is `DEMO_ADMIN_GUIDE.md`.

Sprint 08E migration and verification passed. It creates fifteen independent fixed-colour design records and admin design-card/detail routes. New SKUs have zero stock. Never invent stock or deploy before the catalogue media and business data are approved.
