# Ruseè Kimono — Codex continuation handoff

Use this file as the first context block in a new Codex task. It summarizes the project state so the next agent does not need the full chat history.

## Start here

Workspace:

```text
C:\Users\sab_j\Desktop\Projects\Santra_Kimono\kimono-shop
```

Before editing, read these local files in this order:

1. `AGENTS.md` — mandatory project and Next.js rules.
2. This file — current handoff and recent implementation details.
3. `TODO.md` — completed phases and next unblocked work.
4. `sprints.md` — active sprint, dependencies, acceptance criteria, and verification status.
5. `ARCHITECTURE.md` — commerce, payment, database and animation boundaries.
6. `DEPLOYMENT_PAPAKI.md` only for deployment/hosting work.

Do not reread the old Codex conversation unless a detail is genuinely missing. Do not modify the reference projects.

## Product brief

Ruseè is a light-theme, editorial kimono e-shop built with Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, MySQL, GSAP, Motion and Lenis.

Visual direction:

- Off-white paper background and ink-black type.
- Elegant editorial serif headings; Cormorant Garamond is the current Karena-like English font.
- Bricolage Grotesque is the interface/body font.
- Greek display headings use Times New Roman; Greek interface/body text keeps the sans-serif stack.
- Brand spelling is always `Ruseè` or `RUSEÈ`, including the accented final letter.
- Adapt animation patterns from `../prev_src_animation_project_with_admin` and `../prev_src_photographer_project`; never edit those folders.

The initial catalogue is one kimono product family with designs, colours and sizes. The storefront currently presents 15 editorial studies, mapped onto the available seeded catalogue designs.

The current provisional product imagery is the 24-file library under `public/images/optimized`, addressed as `/images/optimized/rusee_kimono_image_1.webp` through `_24.webp`. Do not restore legacy `/webp` or `/images/editorial` placeholders. The optimizer preserves originals, caps outputs at 500 KB and writes a source manifest; database media paths are reassigned only through the owner-run preparation script.

## Current stack and commands

Key versions:

```text
Next.js 16.2.12
React 19.2.4
Tailwind CSS 4
GSAP 3.15
Motion 12
Lenis 1.3
Drizzle ORM + mysql2
Vitest 4
```

The user runs commands; Codex writes code and maintains the PowerShell runner. Quality gate after material changes:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action Full
```

Install the pinned project-local RTK command-output tool when needed:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/rusee-shop.ps1 -Action InstallRtk
```

The last completed run passed ESLint, all 7 tests and the production build.

Useful database commands:

```powershell
npm run db:info
npm run db:migrate
npm run db:seed
npm run admin:bootstrap
```

Do not ask the user to run these directly in normal continuation work. Add explicit reviewed actions to `scripts/rusee-shop.ps1` and provide the corresponding single PowerShell command.

Local MySQL is provided by WAMP. Database name: `next_kimono`. Secrets are in `.env`; never print, copy or commit them.

## Repository safety

- The worktree is intentionally dirty and most project files are currently untracked or modified. Treat every existing change as user-owned.
- Do not reset, clean, delete or overwrite unrelated work.
- `.env` contains local credentials and is ignored. Never include its values in chat, docs, logs or commits.
- Existing `.codex-*.log` files are smoke-test artifacts; do not treat them as source files.
- Use `apply_patch` for hand edits.
- For Next.js behavior, inspect the relevant guide under `node_modules/next/dist/docs/` because this version has breaking changes.

## Implemented application surfaces

Public routes:

```text
/
/shop
/shop/[slug]
/about
/faq
/contact
/cart
/checkout
/order/[publicId]
/payment/fake/[providerPaymentId]
/privacy-policy
/cookies
/terms
/returns
```

Admin routes:

```text
/admin
/admin/overview
/admin/orders
/admin/orders/[publicId]
/admin/payments
/admin/products
/admin/products/new
/admin/media
/admin/inventory
/admin/order-operations
/admin/reconciliation
/admin/email
/admin/health
```

Admin navigation uses a reference-inspired animated burger menu and simplified labels such as Dashboard, Order manager, Payment checks, Email manager and System status.

## Storefront and animation state

- Shared header includes Menu, persistent EN/GR language control, Bag button and centered 24px count badge.
- `/shop` contains the editorial hero, a responsive 15-card grid, CTA and shared reveal footer.
- Grid columns: 3 large, 2 tablet, 1 mobile.
- Product-card alternate imagery uses a CSS opacity/small-scale crossfade. Do not restore the expensive per-card clip-path hover.
- Product cards link to `/shop/[slug]?colour=...`.
- Product detail has three vertically flowing/parallax images and a sticky purchase panel with colour, size, stock, price and Add to Bag.
- Product detail includes animated Manufacturer, Composition, Care and Provenance blocks.
- Homepage includes an autoplaying, draggable design carousel.
- CTA keywords trigger the image burst and receive a CSS underline on hover/focus.
- Footer is a sticky bottom reveal layer with large accent-safe `RUSEÈ` type and legal links.
- Display and SplitText line boxes reserve vertical padding so `è` accents are not clipped.
- Text selection is inverted on light pages and reversed appropriately in the dark footer.
- Native scrollbar chrome is hidden while scrolling remains functional.
- Lenis is mounted at the provider root and handles smooth scrolling.
- Preloader runs only on an initial public storefront entry. It is disabled on checkout, payment, order and admin routes.
- Page transitions hide `[data-site-footer]` whenever `data-route-ready="false"`, reset Lenis/native scroll while covered, and reveal the footer only when ready. This fixes the previous footer flash during navigation.
- Protected admin links use a separate, faster six-panel GSAP transition inside `[data-admin-shell]`. Keep it isolated from the public provider and never intercept forms, downloads, external/new-tab links, explicit bypass links or reduced-motion navigation.
- `PageEntrance` guards empty GSAP target arrays; do not remove those guards.
- Respect `prefers-reduced-motion` and keep checkout/admin interactions immediate.

## Localization state

English and Greek are enabled through:

```text
src/i18n/config.ts
src/i18n/dictionaries.ts
src/i18n/LocaleProvider.tsx
src/i18n/GreekTranslationLayer.tsx
src/app/api/locale/route.ts
```

The selected locale is stored in an HTTP-only SameSite cookie named `rusee_locale`. The root layout reads it and sets `<html lang>`.

Current implementation combines a typed header dictionary with `GreekTranslationLayer`, which translates rendered text nodes, form attributes, dynamic cart/status output and newly mounted client content using a MutationObserver. This covers public pages, commerce, legal pages, payment screens and admin pages.

Important caveat: the DOM translation layer is pragmatic, but typed/server-side dictionaries are the preferred long-term direction. When touching a page substantially, migrate its copy into typed locale data instead of expanding fragile substring replacements indefinitely. Do not translate identifiers such as SKU, provider IDs, email addresses or the Ruseè brand.

Greek heading CSS:

```css
html[lang="el"] .font-display {
  font-family: "Times New Roman", Times, serif;
}
```

The root `<body>` has `suppressHydrationWarning`. This intentionally suppresses mismatches from browser extensions that inject attributes such as `cz-shortcut-listen="true"` before hydration. It was not added to hide application rendering bugs.

## Commerce and database rules

- MySQL is authoritative for catalogue, stock, customers, orders, payments and admin sessions. phpMyAdmin is only an operator UI.
- Store money as integer minor units.
- Browser cart and totals are never authoritative; revalidate variants, price and stock server-side.
- Order creation snapshots immutable item/address details and creates transactional stock reservations.
- Public order references are UUIDs; customer-facing order numbers are separate.
- Admin sessions are opaque, database-backed, expiring and role checked.
- Preserve order/payment history through status transitions and audit events.
- All database schema changes require repeatable Drizzle migrations.

## Payment state and non-negotiable security

Payment architecture is ready for hosted providers, but only the signed fake/sandbox adapter is implemented locally.

Checkout flow:

1. Validate and create a pending order server-side.
2. Reserve stock transactionally.
3. Request a payment session through the provider abstraction.
4. Redirect with `window.location.assign(payment.redirectUrl)` to the hosted provider page.
5. Mark paid only after an authenticated, idempotent webhook/server verification.

Never:

- store card data or CVV;
- trust a browser return URL as payment confirmation;
- expose provider secrets to client code;
- mark a refund complete from an admin form alone;
- bypass amount, currency, order-reference or signature verification.

Pending live integrations require merchant agreements, official sandbox credentials and technical documentation:

- NBG Pay Hosted Checkout;
- Eurobank/Worldline Hosted Checkout;
- optionally Stripe wallets and/or PayPal if commercially selected.

Do not invent bank endpoints or signatures. Implement a provider only from current official bank/provider documentation and credentials supplied by the merchant.

## Deployment assumptions

Target hosting is Papaki Linux/cPanel. It must support a persistent Node.js application (Setup Node.js App/Passenger) or a VPS; this is not a PHP/static-export application.

Production requires:

- Node runtime compatible with Next.js 16;
- MySQL/MariaDB and least-privilege credentials;
- HTTPS and stable webhook URLs;
- environment variables outside the public root;
- outbound TLS for payment and SMTP;
- migration execution and cron support.

Build output is standalone. See `DEPLOYMENT_PAPAKI.md` and `scripts/cpanel-start.cjs`.

Production fake payments must be disabled. Papaki-compatible SMTP and transactional email queueing exist, but production mailbox credentials plus SPF/DKIM/DMARC remain pending.

## Current next work

Sprints 01–07 and 08A–08AE passed. Customer return intake, admin triage, return communications, Greek-first transactional order emails, responsive typography and the draggable testimonial stack are verified. Return review never completes a refund or invents a legal return window. Optional staff management is available but no staff account is required. Regular and visual Playwright use port 3107 and `.next-playwright`; performance verification uses port 3108 and `.next-performance`, so localhost:3000 may remain running. `ADMIN_LAST_20_SPRINTS_HANDOFF.md` provides the compact admin-focused Sprint 08L–08AE continuation brief.

Papaki JetBackup/Plesk owns scheduled MySQL/file backups and selectable restores; the custom rehearsal is optional. Sprint 06 privacy search/export, guarded anonymization, request/run history and the disabled-by-default Plesk retention worker passed verification; automatic retention still awaits legal-policy approval. During development, `CONTACT_STUDIO_EMAIL` points to the developer mailbox; switch it to the client mailbox only for approved launch configuration.

The admin menu is grouped into Overview, Sales, Catalogue, Customers and System. Seven fixed bilingual customer-information records now have protected editors and read-only GR/EN draft previews. Public routes consume only complete explicitly published records and otherwise retain reviewed code fallbacks. Sprint 08AF is the current user-run gate for the enlarged login fields/password mask, 65%-overlay editorial login image, scoped clip-path entrance, denser admin menu and isolated protected-admin page transition plus the admin action-safety policy. Sprints 08AG–08AL are recorded for MySQL notifications, versioned email-template CRUD, the private Plesk automation worker and verified-sale notification integration. Sprint 09 live payment work remains blocked until a provider is contracted and official current documentation and credentials exist.

The recorded delivery order is:

1. Persist contact enquiries in MySQL.
2. Queue an idempotent transactional studio notification for each enquiry.
3. Add backup/restore tooling and rehearse restoration.
4. Add personal-data retention/export/erasure operations.
5. Continue production hardening before live-provider work.

Current continuation: Sprints 08AJ–08AV passed their owner-run gates on 2026-09-07. Sprint 08AW adds route-level noindex/nofollow privacy metadata to admin, cart, checkout, order-status and payment route families while leaving public catalogue discovery unchanged. Run and inspect `scripts/sprint-08aw.ps1 -Action Verify` before marking it complete. The browser must never execute cron or expose its URL, Bearer secret or payload; production readiness still needs operator-confirmed Plesk scheduling and a real recent completion. The durable queue supports only transactional email dispatch, notification synchronization and reservation release. Plesk invokes the private `/api/automations/run` endpoint through `scripts/run-automation-worker.mjs`; never put the Bearer secret in a URL, repository file or log. Only the authenticated provider-event transaction may originate a verified-sale notification; browser returns and general paid-order scans may not.

Other important pending work:

- Confirm the Papaki plan supports the required persistent Node runtime.
- Add database integration tests for price snapshots, stock reservations and uniqueness constraints.
- Finalize VAT, shipping zones/rates, discounts and rounding with the business/accountant.
- Add SEO metadata, canonical URLs, Product JSON-LD, sitemap, robots and social images.
- Add broader browser/accessibility/performance testing.
- Complete live payment provider integration only after onboarding.
- Have Greek legal/accounting professionals approve privacy, cookies, terms, returns, VAT, invoices and shipping copy before launch.

## Definition of done for the next agent

For every change:

- Preserve the editorial light-theme design and exact Ruseè spelling.
- Keep Server Components by default and Client Components only at interaction boundaries.
- Keep one animation owner per property: CSS for simple states, Motion for component/layout interaction, GSAP for orchestrated editorial sequences.
- Scope and clean up all GSAP timelines, triggers and listeners.
- Verify mobile, keyboard, reduced-motion and empty/error behavior relevant to the task.
- Run lint, tests and production build.
- Update `TODO.md` and `ARCHITECTURE.md` when behavior or boundaries materially change.

## Suggested first prompt in a new Codex task

```text
Continue the Ruseè Kimono project in C:\Users\sab_j\Desktop\Projects\Santra_Kimono\kimono-shop. Read AGENTS.md and codex_agent_instructions.md first, then the current execution position in sprints.md, the Immediate next task section of TODO.md, and only relevant ARCHITECTURE.md sections. Preserve all existing work and never inspect or print .env secrets. The user runs every command; Codex only writes code and PowerShell runner actions. Sprint 08X passed. Inspect artifacts/verification/sprint-08y-catalogue-readiness-diagnostics.txt and sprint-08y-results.txt first. If Sprint08YVerify has not passed, address only its failure and give the same runner command. Structural product readiness must remain separate from client approval of garment facts. Do not invent VAT, courier, legal or provider rules; wait for approved facts or official provider documentation. Papaki/Plesk and JetBackup exclusively own backup and rollback.
```
