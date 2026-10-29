# Ruseè Kimono Sprint Execution Plan

This file is the operational sprint ledger for completing the e-shop. `TODO.md` remains the detailed product backlog, while this file defines execution order, dependencies, verification gates, and the active sprint.

## Status legend

- `[ ]` Pending
- `[~]` In progress or implemented but awaiting verification
- `[x]` Complete and verified
- `[!]` Blocked by an external decision, credential, provider, or production dependency

## Working agreement

- Codex implements application code, migrations, tests, documentation, and command scripts.
- The user runs all PowerShell, npm, Node.js, Git, database, build, test, migration, deployment, and development-server commands.
- Commands must be exposed through a reviewed PowerShell script under `scripts/`; do not require the user to assemble multi-command sequences manually.
- Use the project-local RTK CLI at `.tools/rtk/rtk.exe` where it supports compact command output. RTK means the `rtk-ai` command-output tool, not Redux Toolkit.
- Never inspect, print, copy, log, or commit `.env` values.
- Preserve the dirty worktree and all user-owned work.
- A sprint stays `[~]` until the user runs its verification action and reports a passing result.
- Update this file and `TODO.md` after every verified sprint.

## [x] Sprint 01 — Command runner and RTK foundation

Goal: establish the user-run command workflow before further product implementation.

Scope:

- Add an idempotent Windows RTK installer under `scripts/install-rtk.ps1`.
- Install RTK locally under ignored `.tools/rtk/` when the user requests it.
- Add `scripts/rusee-shop.ps1` as the single project command runner.
- Provide explicit actions for status, dependency installation, development, checks, tests, build, full verification, and database information.
- Use RTK for compact Git status output when installed, with a safe Git fallback.
- Keep database-changing, seed, email, deployment, and production actions outside ordinary checks.
- Save full-verification output under ignored `artifacts/verification/`.

Acceptance criteria:

- The RTK installer is safe to rerun and reports the installed version.
- `Status` does not mutate the repository.
- `Check`, `Test`, and `Build` fail clearly when dependencies are absent.
- `Full` runs status, ESLint, TypeScript, Vitest, production build, diff check, and final status.
- No command prints environment values.
- The user runs the Sprint 01 verification command and reports a pass.

Verified: 2026-08-19. The user reported a passing status, ESLint, TypeScript, Vitest, production build, and diff-check run.

## [x] Sprint 02 — Contact-enquiry persistence

Goal: replace the public `mailto:` form with a validated, database-backed contact workflow.

Scope:

- Add a repeatable Drizzle migration for `contact_enquiries`.
- Store a public UUID, normalized name/email, controlled subject, optional order number, message, submission locale, workflow status, and UTC timestamps.
- Add feature-owned Zod validation and a server-side persistence service.
- Add a Next.js 16 route handler or server action after reading the relevant bundled guide.
- Replace the `mailto:` submission with pending, success, validation, retry, and server-error states while retaining the email link as fallback.
- Add payload limits and proportionate honeypot, timing, and rate-limit abuse controls.
- Add validation, normalization, persistence, and abuse-control tests.

Acceptance criteria:

- Valid enquiries persist once in MySQL.
- Invalid or oversized requests do not persist.
- Server responses do not expose SQL, environment, or internal error details.
- English and Greek submissions retain their locale.
- The user applies the migration and runs the sprint verification action successfully.

Verified: 2026-08-19. The user reported the generated migration, focused contact tests, full Vitest suite, lint, TypeScript, production build, and diff checks passed.

## [x] Sprint 03 — Idempotent notification and admin enquiry inbox

Goal: notify the studio exactly once and make enquiries operable from the admin.

Scope:

- Queue the studio notification in the same transaction as enquiry creation.
- Generalize email delivery ownership so enquiry messages do not pretend to belong to orders.
- Add an idempotent `contact_enquiry_notification` template.
- Use the visitor email as `Reply-To`, never as the authenticated SMTP sender.
- Retain capped retry and delivery history without logging message bodies unnecessarily.
- Add a protected Greek-first admin enquiry list, filters, detail view, and read/replied/closed transitions.
- Audit admin status changes.

Acceptance criteria:

- Retried submissions or queue processing cannot create duplicate studio notifications.
- Enquiries remain persisted if SMTP is unavailable.
- Admin transitions are authorized, validated, and audited.
- Greek and English admin copy is complete for the new surface.

Verified: 2026-08-19. The user reported the migration, queue/workflow tests, complete quality gate, and local Sprint 03 result passed. The temporary development recipient is now the developer mailbox configured through `CONTACT_STUDIO_EMAIL`; the client mailbox is reserved for launch configuration.

## [x] Sprint 04 — Greek-first localization correction

Goal: make Greek the primary language and English secondary across storefront and admin.

Scope:

- Change the default locale from `en` to `el` while preserving the `rusee_locale` selector and cookie.
- Implement Sprint 02–03 copy with typed EL/EN dictionaries.
- Begin migrating frequently used admin screens away from DOM substring replacement.
- Localize dates, money, statuses, form errors, empty states, and success messages.
- Preserve SKUs, provider IDs, email addresses, and the exact `Ruseè` brand spelling.

Acceptance criteria:

- A new visitor receives Greek by default.
- The language selector reliably persists Greek or English.
- Unknown locale values safely fall back to Greek.
- Tests cover accepted locales, fallback behavior, and protected identifiers.

Verified: 2026-08-19. The user reported the locale-focused tests and complete quality gate passed.

## [x] Sprint 05 — Product clarity, backup, and isolated restore rehearsal

Goal: give customers complete, bilingual, editable garment information and prove MySQL plus required media can be restored before enabling live payments.

Scope:

- Add structured Greek/English information for fabric, feel, fit, measurements, construction, opacity/layering, washing/care, provenance, packaging, shipping, and returns.
- Keep unconfirmed composition, measurements, manufacturing, and care claims explicitly provisional until validated against the final production sample and sewn label.
- Add admin editing for every information section and initialize defaults only when the database field is empty.
- Replace the small static product-facts row with an editorial GSAP information grid that honors reduced motion and never delays purchasing.
- Create timestamped MySQL backups and archive required uploaded media.
- Produce SHA-256 checksums and a machine-readable manifest.
- Restore into a uniquely named temporary rehearsal database.
- Compare schema/table inventory and exact row counts.
- Use short-lived client configuration files without printing credentials and remove them in `finally` blocks.
- Drop the rehearsal database unless the user explicitly retains it.
- Document backup retention, off-site storage, responsibility, and recovery steps.

Acceptance criteria:

- Greek and English customers can understand what is known, what remains provisional, how the piece fits, and how it should be cared for.
- Admins can replace every provisional statement without a code deployment, with the update captured by the existing catalogue audit trail.
- No fibre percentage, certification, manufacturing origin, exact measurement, or tested wash treatment is presented as confirmed without business evidence.
- The source database is never overwritten.
- Exact row-count comparison passes after isolated restore.
- Temporary credential material is removed on success and failure.
- The generated manifest identifies and verifies every backup artifact.

Verified: 2026-08-19. The user reported the product-information migration, focused/full quality gates and visual sprint passed. Papaki JetBackup provides selectable MySQL and website-file restore points, so application backup tooling is retained only as an optional diagnostic rehearsal; Plesk/Papaki owns scheduled backups.

## [x] Sprint 06 — Personal-data retention, export, and erasure

Goal: provide controlled privacy operations without destroying required commerce history.

Scope:

- Define retention rules by record type with legal/accounting review points.
- Add admin-only customer and enquiry export.
- Add guarded erasure or anonymization for data no longer required.
- Preserve legally required order, payment, invoice, reconciliation, and audit evidence.
- Add dry-run output, explicit confirmation, authorization, and audit events.
- Use a private Plesk Scheduled Task to run the disabled-by-default Node retention worker. Do not expose a public cron URL.
- Keep order/payment/accounting records under legal review rather than anonymizing them under an assumed retention period.

Acceptance criteria:

- Exports are complete, access-controlled, and do not leak unrelated customers.
- Erasure is scoped, previewable, auditable, and safe to retry.
- Required financial history remains internally consistent.
- Final retention periods are not presented as legally approved until reviewed by Greek professionals.

Verified: 2026-08-19. The user reported that migration repair, retention dry-run, focused/full tests, lint, TypeScript and production build passed. Automatic retention remains disabled pending approved Greek legal/accounting policy.

## [x] Sprint 07 — Core e-shop completeness

Goal: close the remaining storefront, commerce, SEO, testing, and accessibility gaps.

Scope:

- Add real-MySQL tests for price snapshots, stock reservations, and uniqueness constraints.
- Finalize VAT, shipping zones/rates, discounts, and rounding with the business/accountant.
- Complete the size guide, returns copy, and empty/missing/inactive product states.
- Complete accessible foundational controls required by real workflows.
- Add locale-aware metadata, canonical URLs, sitemap, robots, social images, and truthful Product JSON-LD.
- Cover product selection, cart, pending order, payment event, admin order, and refund journeys.
- Run Safari/Firefox, keyboard, screen-reader, mobile, performance, and reduced-motion checks.

Progress:

- Real-MySQL price snapshot, stock reservation, rollback and uniqueness coverage passed on 2026-08-19.
- Bilingual size guidance, invalid-combination prevention, accessible selection controls, and shop loading/empty/error/not-found states passed verification on 2026-08-19.
- Greek-first locale-aware metadata, canonical URLs, active-design sitemap entries, production-aware robots rules, social metadata and catalogue-derived Product JSON-LD passed verification on 2026-08-19.
- Isolated Playwright journeys and serious axe checks now target Chromium, Firefox, WebKit and a reduced-motion mobile viewport; browser tooling installation and verification await the user-run actions.
- VAT, shipping, discounts and rounding remain pending approved business/accountant rules.
- Final Sprint 07 verification passed cleanly on 2026-08-20. Cross-browser Playwright completed with 29 applicable checks passing and 3 intentional desktop skips; lint, TypeScript, Vitest, production build and diff checks also passed. Playwright uses an isolated port and `.next-playwright` build directory so localhost:3000 can remain live.

Acceptance criteria:

- A customer can discover, configure, buy, and track an order in Greek or English.
- Routine store operations do not require phpMyAdmin.
- Structured data contains only factual product and business information.
- Scoped unit, integration, browser, accessibility, lint, type, and build gates pass.

## [ ] Sprint 08 — Hosting and production hardening

Goal: establish evidence that the Papaki production environment can safely run the shop.

Scope:

- Consolidate the admin menu into five operational groups without deleting routes: Overview; Sales; Catalogue; Customers; System. Move duplicate destinations into contextual sub-navigation/actions (Add Product under Products, Order Manager under Orders, Payment Checks under Payments, and Media under Catalogue).

- Confirm persistent Node.js support compatible with Next.js 16 and MySQL connectivity.
- Confirm cron, outbound SMTP/TLS, HTTPS, stable webhook URLs, and environment handling.
- Finalize SPF, DKIM, DMARC, proxy headers, secure cookies, HSTS, and health checks.
- Select a redacted monitoring destination and operational alert path.
- Prepare rollback, maintenance, reconciliation, incident, and support runbooks.
- Run the complete verification runner in the production-like environment.

Progress:

- Sprint 08A groups the existing admin routes into five readable operational areas and assigns the live local development action to port 3000 while Playwright remains isolated on port 3107. Verification passed cleanly on 2026-08-20: ESLint, TypeScript, 30 Vitest tests, production build and diff checks all completed successfully.
- Sprint 08B passed verification on 2026-08-20: ESLint, TypeScript, tests, production build and diff checks completed successfully.
- Sprint 08C passed verification on 2026-08-20. It adds a Plesk-specific standalone deployment/start path, production Scheduled Task commands that consume Plesk-injected variables instead of a local `.env`, a secret-excluding release packager, and automated release-contract coverage.
- Sprint 08D passed delegated verification. The chosen Raw image composition uses the Editorial paper/ink palette without yellow or hard grid borders; product information uses temporary catalogue imagery and reduced-motion-safe GSAP clip/text reveals. Colour is design-owned and hidden as a shopper option; size changes rotate the provisional gallery. SKU uniqueness, exact option resolution and add-to-bag variant submission passed automated coverage.
- Sprint 08E passed migration and full delegated verification on 2026-08-20. The former fifteen-card visual illusion is now fifteen independent fixed-colour design records. Admin Products presents visual design cards linking to bilingual design editors; shared washing/composition stays on the parent product. Newly created design/size SKUs start with zero stock.
- Size imagery was upgraded from reordering the same gallery to stable, distinct three-image WebP sets per design/size, with rectangular GSAP clip-path wipes and reduced-motion fallback. Sprint 08D's browser contract passed Chromium, Firefox, WebKit and mobile reduced-motion on 2026-08-20.
- Sprint 08F passed delegated verification on 2026-08-21: persisted design/size media assignments, bilingual alt text and media management live in each design editor; the storefront resolves exact-size then design-level images before safe provisional fallbacks. Server-side scope validation prevents cross-product/design/size assignments. Eight browser contracts, including the compact admin loader and mobile reduced motion, passed alongside the complete quality gate.
- Sprint 08G passed delegated verification on 2026-08-21: HMAC-fingerprinted checkout/payment abuse controls, idempotent retry preservation, localized safe recovery, redacted operational evidence and production fake-payment launch guards are in place.
- Sprint 08H passed delegated verification on 2026-08-21. It produces a redacted database/release readiness audit, separates automated failures from external approvals, packages only an explicit production-script allowlist, and refuses to package source changed after the successful 08H gate.
- Sprint 08I passed delegated verification on 2026-08-21. A production-refusing local fixture creates a short-lived owner through the real scrypt path; Playwright verified login, refresh continuity, Greek-first grouped navigation, read-only DEMO order detail, logout and revoked access across all browser profiles, then removed the fixture.
- Sprint 08J passed delegated verification on 2026-08-21. Four production-refusing, profile-isolated paid orders exercised the real admin fulfilment and partial-refund forms across Chromium, Firefox, WebKit and reduced-motion mobile. The runner proved the transition event, pending refund, queued-unsent fulfilment message, paired admin audits and UI refund cap before guaranteed fixture cleanup. Fulfilment mutations no longer drain the shared SMTP queue synchronously; established email operations own dispatch.
- Sprint 08K passed delegated verification on 2026-08-21. All launch public, commerce and legal routes plus a live catalogue product passed the serious/critical WCAG and bounded route-readiness audit; keyboard navigation, mobile overflow, reduced motion and authenticated admin accessibility passed across all browser profiles.
- Sprint 08L passed delegated verification on 2026-08-24. Its explicit maintenance gate returns a real non-cacheable 503 for new storefront/cart/checkout traffic while preserving admin, health/API callbacks and existing order/payment routes. Papaki/Plesk and JetBackup remain the exclusive owners of backups and rollback.
- Sprint 08M passed delegated verification on 2026-08-24. Admin System status separates technical health from seven explicit external approvals for hosting, email DNS, tax/shipping, legal copy, product data, fulfilment and contracted payments. All flags are non-secret and default to pending; they trigger no operational action.
- Sprint 08N passed delegated verification on 2026-08-24. The editorial customer-information hub plus Greek-first Shipping & Courier, Payment Methods and Care & Fit pages, existing Returns/Cookies/Privacy/Terms connections, metadata, sitemap and cross-browser accessibility contracts are clean.
- Sprint 08O passed delegated migration and verification on 2026-08-24. Seven fixed MySQL-backed information-page records begin as drafts; owner/manager editors validate paired Greek/English sections and record a metadata-only audit event. Public routes retain reviewed code defaults until a complete bilingual record is explicitly published.
- Sprint 08P passed delegated verification on 2026-08-24. Authenticated operators can preview the stored draft in Greek or English, see structural publication readiness, return directly to editing and reach the live route only when the record is published.
- Sprint 08Q passed delegated verification on 2026-08-24. Publishing, live-copy updates and withdrawal are separate explicit intents with confirmation, complete bilingual validation, status-specific metadata-only audits and visible success feedback.
- Sprint 08R passed delegated verification on 2026-08-24. The protected System activity log exposes paginated, category-filtered operational evidence to owners/managers while deliberately omitting raw metadata, stored payloads and customer content.
- Sprint 08S passed delegated verification on 2026-08-24. Optional staff management is available if later needed; the shop may operate with only its owner account, and verification creates no persistent staff. Routine UI cannot create or alter owners, and audit events never contain password material.
- Sprint 08T passed delegated verification on 2026-08-24. The Greek-first Overview separates daily operational counts from external launch approvals and links each aggregate directly to its owning admin workflow without selecting sensitive payloads.
- Sprint 08U passed delegated verification on 2026-08-24. It consolidates the proven local database, catalogue, media, commerce guard, information, launch audit, storefront, accessibility and owner-admin contracts into one pre-provider release-candidate artifact.
- Sprint 08V passed delegated verification on 2026-08-24. Ten desktop/mobile route budgets and the complete quality gate passed without claiming Papaki or real-device approval.
- Sprint 08W passed delegated verification on 2026-08-24. It produced the bilingual desktop/mobile visual acceptance pack and confirmed the revised footer layout without mutating store operations.
- Sprint 08X passed delegated verification on 2026-08-24. It revalidates restored carts and proves recoverable checkout retries retain one idempotent order identity.
- Sprint 08Y passed delegated verification on 2026-08-25. It exposes a safe 15-design structural readiness matrix without treating client approval as database-derived fact.

Acceptance criteria:

- Runtime and hosting capabilities are confirmed rather than assumed.
- Backup/restore and rollback procedures are rehearsed.
- Health and monitoring output contains no secrets or unnecessary personal data.
- Production fake payments are disabled.

### [x] Sprint 08P — Admin information review and preview

Goal: let an authenticated operator review exactly the stored bilingual information draft before publication without exposing it publicly.

Scope:

- Add Greek-first preview actions to the fixed information-page index.
- Render stored Greek and English drafts behind admin authentication, including incomplete drafts.
- Show structural readiness and explicit external-approval warnings.
- Keep preview read-only and keep draft public fallback behavior unchanged.
- Verify route protection, locale switching, keyboard-operable navigation and no content mutation.

Acceptance criteria:

- Draft copy never becomes public through the preview route.
- Greek and English previews use the same paired stored sections.
- Incomplete content is visibly blocked from being described as publication-ready.
- The delegated browser and complete quality gates pass.

Verified: 2026-08-24. The user reported the authenticated preview, GR/EN switching, readiness guidance, browser contract and complete gate passed.

### [x] Sprint 08Q — Safe publication and withdrawal

Goal: prevent accidental publication or withdrawal of customer-facing information while preserving an operator-readable audit trail.

Scope:

- Separate draft save, publish/update-live and withdrawal intents.
- Require explicit confirmation for any change to public visibility.
- Reject incomplete bilingual publication and silent published-to-draft changes.
- Record status-specific, metadata-only audit events.
- Show clear post-action feedback and retain public code fallback after withdrawal.

Acceptance criteria:

- No generic status dropdown can accidentally publish content.
- Publish and withdrawal operations require explicit server-validated confirmation.
- Audit metadata contains status and section count, never the full customer-facing copy.
- Browser, focused unit, lint, TypeScript, build and diff gates pass without mutating page content during verification.

Verified: 2026-08-24. The user reported the explicit publication controls, focused tests, browser contract and complete gate passed.

### [x] Sprint 08R — Redacted admin activity log

Goal: make the existing immutable audit trail usable by the store operator without exposing sensitive metadata.

Scope:

- Add an owner/manager-only System activity route.
- Query audit rows with server-side pagination and fixed operational filters.
- Present Greek-first, bilingual action descriptions.
- Render actor, timestamp, entity and reference only; never render raw metadata or payloads.
- Cover authentication, invalid filters, empty categories and cross-browser table access.

Acceptance criteria:

- Viewer/fulfilment roles cannot access the audit history.
- Pagination is bounded and database-backed.
- No raw metadata, provider payload, customer message or secret-shaped field appears in the page.
- Browser, focused unit and complete quality gates pass.

Verified: 2026-08-24. The user reported the redacted audit history, filtering, pagination, browser contract and complete quality gate passed.

### [x] Sprint 08S — Admin team and access management

Goal: manage routine staff access without phpMyAdmin or shared owner credentials.

Scope:

- Add an owner-only System team route.
- Create manager, fulfilment and viewer accounts using the established scrypt password path.
- Reset staff passwords and revoke all existing sessions atomically.
- Activate/deactivate non-owner accounts with confirmation and audit evidence.
- Prevent self-lockout and keep owner creation/state changes bootstrap-only.
- Never select or render password hashes or session tokens.

Acceptance criteria:

- Only owners can access or mutate team membership.
- Routine UI cannot create, reset or deactivate an owner.
- Password and account-state operations are audited without password material.
- Deactivation and password reset revoke existing sessions.
- Browser, focused security and complete quality gates pass without creating staff during verification.

Verified: 2026-08-24. Four browser profiles, ESLint, TypeScript, 57 Vitest tests, production build and diff checks passed. Staff remains optional and no persistent staff account was created.

### [x] Sprint 08T — Daily operations action centre

Goal: let the owner see what needs attention without opening every specialist admin screen.

Scope:

- Aggregate new enquiries, failed/queued email, low stock, pending refunds, reconciliation findings and draft information pages.
- Show external launch approvals separately from routine shop work.
- Link every card to its owning admin workflow.
- Preserve recent-order and verified-revenue visibility.
- Query counts only; never select customer messages, audit metadata or provider payloads.

Acceptance criteria:

- Zero states remain calm and readable.
- Operational work and external blockers are visually and semantically distinct.
- Every attention card has a keyboard-operable destination.
- Browser, focused unit and complete quality gates pass.

Verified: 2026-08-24. The user reported the daily action centre, browser profiles, focused tests and complete gate passed.

### [x] Sprint 08U — Pre-provider release-candidate audit

Goal: establish one current, consolidated local baseline before business-approved VAT/courier/legal rules or contracted payment work begins.

Scope:

- Re-verify the ten-order demo, fifteen-design catalogue, media assignments, commerce guards and fixed information records.
- Produce the redacted launch-readiness decision ledger.
- Run the non-provider customer journey, information, launch-quality and critical owner-admin browser contracts across all profiles.
- Run real-MySQL commerce/payment integration tests and the complete lint/type/test/build/diff gate.
- Create only a local ephemeral owner fixture and remove it automatically.

Acceptance criteria:

- No verification step sends email, publishes content, creates persistent staff, starts payments or deploys.
- Automated failures remain distinct from external approval blockers.
- One diagnostics file and one full result represent the current source state.
- After a pass, further commerce implementation waits for approved facts or official provider documentation.

Verified: 2026-08-24. The user reported that the consolidated database, catalogue, media, commerce guard, information, launch audit, cross-browser owner/storefront and full quality gates passed.

### [x] Sprint 08V — Performance and operator acceptance

Goal: add repeatable local production-build performance evidence before production-host and real-device acceptance.

Scope:

- Build into isolated `.next-performance` and serve only on port 3108.
- Audit `/`, `/shop`, one live product, `/checkout` and `/admin` in desktop Chromium and a reduced-motion mobile profile.
- Record route TTFB, DOM/load timing, FCP, LCP, CLS, total transfer, JavaScript, image and largest-resource evidence.
- Enforce explicit regression budgets and save route-specific diagnostics.
- Run the complete lint, TypeScript, Vitest, production-build and diff gate afterward.
- Keep localhost:3000, Playwright port 3107, SMTP, payments, database records, deployment, backup and rollback untouched.

Acceptance criteria:

- Every audited route emits readable `PERFORMANCE_EVIDENCE` for both profiles.
- Layout shift, LCP, transfer and resource budgets fail with the owning route and metric.
- Results explicitly state that local evidence does not replace Papaki production or physical-device checks.
- One owner-run action produces performance diagnostics and the complete verification result.

Verified: 2026-08-24. The user reported all ten local production performance checks plus ESLint, TypeScript, Vitest, production build and diff checks passed.

### [x] Sprint 08W — Bilingual visual acceptance pack

Goal: make the current customer and owner interfaces reviewable as a compact Greek/English desktop/mobile evidence set.

Scope:

- Capture Home, Shop, one real product, Information and Checkout in Greek and English.
- Capture the authenticated Admin Overview in both languages using only the established temporary local owner.
- Produce full-page desktop and reduced-motion mobile PNGs under `artifacts/visual-acceptance`.
- Require hydration, route readiness, hidden preloader and bounded document width before every capture.
- Remove the temporary owner automatically and run the complete quality gate.
- Do not create orders, send email, start payments, publish content, deploy, back up or restore anything.

Acceptance criteria:

- All 24 named captures are produced from the current source state.
- Every captured route passes locale, readiness, preloader and horizontal-overflow assertions.
- Diagnostics enumerate every output path for quick human review.
- Automated success is described as capture completeness, not visual approval or real-device evidence.

Verified: 2026-08-24. The user reported the bilingual desktop/mobile visual captures and complete gate passed, including the accepted responsive footer revision.

### [x] Sprint 08X — Checkout resilience and customer recovery

Goal: keep a returning customer's bag and checkout recoverable across stock changes and temporary service/provider failures.

Scope:

- Expose cart restoration readiness so checkout never treats an unhydrated bag as empty.
- Revalidate restored variant identity, quantity, price and availability against the server before rendering the form.
- Return a safe 503 response when cart validation cannot reach MySQL.
- Provide typed Greek/English checking, conflict, unavailable and retry states.
- Preserve form entries and the bag after order or hosted-payment initialization failure.
- Reuse one public order/idempotency identity across retries so payment-start failure cannot create a duplicate order.
- Intercept every browser order/payment request during verification.

Acceptance criteria:

- Unhydrated, unavailable and stale-stock states never expose a misleading checkout form.
- Retry preserves entered fields, cart items and the original order public ID.
- Customer-facing failures contain no database/provider internals.
- Browser contracts pass across all profiles without creating orders, email or payments, followed by the complete quality gate.

Verified: 2026-08-24. The user reported restored-cart validation, bilingual recovery, stable idempotency across payment-start retry, all browser profiles and the complete gate passed.

### [x] Sprint 08Y — Catalogue launch-readiness matrix

Goal: turn the remaining 15-design product preparation into a bounded, actionable Greek-first admin checklist.

Scope:

- Aggregate bilingual design copy, variant/SKU, inventory, price and size-media structure without selecting order/customer data.
- Present one readiness card per design with direct product and media editor links.
- Separate structural completeness from client approval of fabric, measurements, opacity, care and other garment facts.
- Add the incomplete-design count to Daily Operations.
- Keep the surface read-only and create no product, variant, media, stock or publication mutation.
- Verify owner access with the temporary local fixture and automatic cleanup.

Acceptance criteria:

- Exactly the current 15 design records appear with bounded issue codes.
- SKU, inventory, price and exact-size bilingual media gaps are reported without exposing sensitive data.
- Structural completion is never described as business/client approval.
- Browser, focused analyzer, real-MySQL integrity and complete quality gates pass.

Verified: 2026-08-25. The user reported the safe 15-design matrix, authenticated browser contracts and complete quality gate passed.

### [x] Sprint 08Z — Product facts and client-approval ledger

Goal: record explicit client or production-sample approval separately from automated catalogue completeness.

Scope:

- Add six fixed categories per design: composition, measurements/fit, opacity, care, provenance and final imagery.
- Keep missing rows pending by default and never infer approval from product copy or media.
- Restrict approve/return-to-pending actions to owner/manager roles.
- Record actor/time plus metadata-only audit evidence without storing confidential evidence or garment copy.
- Present structural issues and external approvals together without conflating them.
- Verify the ledger read-only; automated tests must not approve any product fact.

Acceptance criteria:

- All 15 designs expose exactly six bounded approval categories.
- Approval requires an authenticated explicit action and is reversible to pending.
- Audit metadata contains category/status only; no client communication or evidence payload is stored.
- Migration, browser, focused unit, real-MySQL integrity and complete quality gates pass.

Verified: 2026-08-25. The user reported the migration, approval-ledger browser contracts and complete quality gate passed.

### [x] Sprint 08AA — Courier-neutral shipment tracking

Goal: give fulfilment a safe dispatch workflow before any courier API is commercially selected.

Scope:

- Store one carrier/tracking record for each shipped order.
- Require carrier and tracking code when processing advances to shipped; allow only an optional HTTPS tracking link.
- Keep paid-order and sequential fulfilment transition guards authoritative.
- Queue shipment context in the established fulfilment email without synchronous SMTP delivery.
- Show tracking in operations and on the UUID-protected customer order status.
- Keep courier pricing, SLA promises, labels and provider APIs outside this sprint.

Acceptance criteria:

- Unpaid, out-of-sequence, duplicate and unsafe-URL attempts fail transactionally.
- Shipment, order transition, status event, audit event and queued email commit together.
- Verification uses isolated orders, sends no email and cleans fixtures automatically.
- Migration, focused unit/browser, real-MySQL integrity and complete quality gates pass.

Verified: 2026-08-25. The user reported shipment migration, isolated browser evidence and the complete gate passed.

### [x] Sprint 08AB — Customer return-request intake and triage

Goal: record and review customer return requests without conflating approval with a completed refund.

Scope:

- Verify the order email against the UUID-protected paid order before accepting a request.
- Allow only shipped/delivered/returned fulfilment stages and one idempotent request per order.
- Store a bounded reason and note in MySQL.
- Add a protected Greek-first admin queue with explicit reviewed transitions and internal notes.
- Keep refunds, payment state and legal eligibility separate.

Acceptance criteria:

- Invalid email, ineligible order state and duplicate submission cannot create additional requests.
- Closed requests cannot reopen and every admin transition is audited.
- No review action marks money refunded or promises eligibility.
- Migration, focused tests and complete quality gates pass.

Verified: 2026-08-25. The user reported the return-request migration, focused workflow checks and complete gate passed.

### [x] Sprint 08AC — Return communication and operational visibility

Goal: surface actionable return requests and queue idempotent studio/customer updates without claiming a refund.

Verified: 2026-08-25. The user reported the email-template migration, Overview visibility, queue/rendering checks and complete gate passed.

### [x] Sprint 08AD — Greek-first transactional email

Goal: make customer order communication Greek-first and English-secondary with secure UUID order-status links.

Verified: 2026-08-25. ESLint, TypeScript, Vitest, production build and diff checks passed. Customer email rendering keeps identifiers unchanged, escapes dynamic HTML and omits non-HTTPS production status links.

### [x] Sprint 08AE — Responsive editorial typography

Goal: retain the Awwwards-style hierarchy while making oversized titles/menu links calmer and small operational copy easier to read.

Scope:

- Cap display heading levels with responsive clamps across public and protected routes.
- Reduce public menu, text-image statement and footer-wordmark extremes.
- Increase eyebrows, labels and formerly sub-10px metadata.
- Preserve wrapping, accent space, reduced motion and existing GSAP ownership.
- Add horizontal mouse, touch and pen dragging to the testimonial stack at every viewport without blocking vertical page scrolling.
- Capture Greek/English desktop/mobile visual evidence before the complete gate.

Acceptance criteria:

- Titles do not dominate or overflow laptop/mobile viewports.
- Labels and metadata remain legible without breaking dense admin layouts.
- Bilingual visual captures, lint, TypeScript, tests, build and diff checks pass.

Verified: 2026-08-26. Testimonial interaction passed Chromium, Firefox, WebKit and reduced-motion mobile; bilingual desktop/mobile visual acceptance, ESLint, TypeScript, Vitest, production build and diff checks passed.

### [~] Sprint 08AF — Login readability and admin action safety

Goal: make sign-in typography immediately readable and establish truthful destructive-action language before adding notification and template controls.

Scope:

- Enlarge login labels, entered username text and password masking responsively.
- Preserve native username/current-password autofill, visible focus and mobile layout.
- Replace the desktop black panel with a full-cover editorial image, 65% dark overlay and reduced-motion-safe GSAP clip-path entrance.
- Give Greek/English admin menu group headings a compact dedicated scale and safe wrapping so global display typography cannot clip them.
- Give each admin menu link row an ink-to-paper hover and keyboard-focus transition without sharing GSAP-owned properties.
- Add a fast six-panel editorial wipe for protected admin navigation, with bilingual route labels and strict isolation from forms, downloads, external links and the public transition provider.
- Expand Admin → System status launch approvals into explicit `Wait for Sandra` and `On me / Implementation` responsibilities, with direct links to the legal editors.
- Provide Greek/English starter drafts for Terms, Privacy, Returns and Cookies, using visible `ADD_YOUR_…` markers only for client, provider or professional facts still required.
- Replace provisional stock photography across public/admin presentation, SEO metadata, cart fallbacks, fixtures and catalogue fallbacks with the 24-file `/images/optimized` kimono library; retain deterministic size-specific imagery.
- Define View, Edit, Retry, Resolve, Archive and Trash semantics for future admin controls.
- Keep immutable commerce, delivery, inventory and audit history free of permanent-delete controls.

Acceptance criteria:

- Username text is at least 18px, password masking at least 24px and labels at least 12px in every browser profile.
- The desktop image reveals without a flash and retains readable foreground contrast.
- Mobile remains a direct, uncluttered login form.
- Internal admin links preserve query strings; reduced-motion navigation remains immediate and operational controls are never intercepted.
- The four legal routes remain drafts until every placeholder is replaced, both languages are reviewed and an authorized admin explicitly publishes them.
- All 24 optimized images remain at or below 500 KB, legacy database media paths have an explicit owner-run reassignment step, and reference-only source trees are excluded from active-project lint.
- Browser contract, lint, TypeScript, tests, production build and diff checks pass.

### [~] Sprint 08AG — MySQL-backed admin notification centre

Goal: provide a clear full-screen attention centre without hiding or deleting underlying operational conditions.

Scope: notification bell/count, critical/action/information groups, direct links, per-admin read/archive state, transactional deduplication and role-aware visibility for verified sales, payment failures/mismatches, failed email, low stock, returns and enquiries.

Implementation prepared: normalized notification/state tables, deterministic operational synchronization, role-filtered sanitized summaries, a keyboard-dismissible full-screen bilingual centre, direct operational links, and per-admin read/archive actions. Owner-run migration and verification remain pending.

### [~] Sprint 08AH — Versioned email-template foundation

Goal: move transactional copy into safe Greek-first, English-secondary MySQL templates while retaining code fallbacks and immutable delivery history.

Scope: fixed system keys, custom templates, allowlisted placeholders, immutable versions, active/draft/archive state and rendered delivery snapshots.

Implementation prepared: normalized template/version tables, six idempotently initialized system drafts, per-template placeholder allowlists, code-renderer fallback, and immutable delivery snapshots reused on retry. Migration and complete PowerShell verification remain owner-run through `scripts/sprint-08ah.ps1`.

### [~] Sprint 08AI — Email-template CRUD, preview and test delivery

Goal: give owner/manager roles a polished editor for safe template creation, duplication, editing, publication, preview, test delivery and archival.

Scope: responsive Ruseè email shell, sandboxed preview, sample-only variables, explicit test recipient and protection for required/historically used templates.

Implementation prepared: owner/manager template workspace, immutable bilingual version editing, sandboxed GR/EN preview, duplication, explicit activation, custom-template archival, protected system templates and audit evidence. The storefront transition now keeps one persistent shell while replacing only the committed route snapshot behind the closed curtain. Owner-run full verification remains pending; explicit queued test-recipient delivery remains the final 08AI increment before completion.

### [~] Sprint 08AJ — Durable automation queue and Plesk worker

Goal: process immediate and scheduled transactional work reliably from a private Plesk Scheduled Task.

Scope: idempotent jobs, atomic claiming, bounded retry/backoff, stale-lock recovery, cancellation, sanitized errors and a Greek-first automation dashboard. Marketing and abandoned-cart automation remain disabled pending consent and business approval.

Implementation prepared: `automation_jobs` migration model, five-minute idempotent routine scheduling, conditional single-worker claims, capped exponential retry, fifteen-minute stale-lock recovery, audited owner/manager retry and cancellation, secret-redacted errors, Greek-first `/admin/automation`, and a constant-time Bearer-protected Plesk endpoint. Owner-run migration and verification remain pending through `scripts/sprint-08aj.ps1`.

### [~] Sprint 08AK — Verified sale/payment notification integration

Goal: fan one authenticated captured-payment event into exactly one customer confirmation, one admin sale email and one in-admin notification.

Scope: duplicate/replay safety, internal failed/mismatched-payment attention and no sale notification from pending browser returns.

Implementation prepared: the authenticated capture transaction now creates one customer confirmation, one configured admin-sale email, one in-admin verified-sale notification and one durable immediate dispatch job, all protected by stable unique keys. Unknown, mismatched, expired-reservation and verified-failed events create owner/manager attention without sale fan-out. The previous paid-order scan was removed so only the verified provider-event boundary can originate a sale notification. Focused MySQL replay evidence and the complete gate remain owner-run through `scripts/sprint-08ak.ps1`.

### [x] Sprint 08AL — Automation and communication release gate

Goal: verify template versioning, notifications, concurrent workers, retries, accessibility and Papaki operation before live-provider work.

Scope: isolated MySQL/browser tests, no real SMTP during automation, operator documentation and the complete quality gate.

Implementation prepared: prefix-isolated real-MySQL tests prove concurrent claims, one-time execution, stale-lock recovery, delayed retry and secret redaction; the verified-sale integration test proves semantic replay safety and no pending-payment fan-out; all browser profiles inspect the Greek-first automation dashboard for serious accessibility issues, overflow and sensitive output. The Plesk runbook now uses one five-minute private worker instead of an overlapping reservation-only cron. `scripts/sprint-08al.ps1` records diagnostics and complete-gate results without sending SMTP or invoking a live payment provider.

Verified: 2026-09-07. The user reported the isolated automation, verified-sale fan-out, browser accessibility and complete quality gates passed.

### [~] Sprint 08AM — Controlled email-template test delivery

Goal: complete the email-template workflow with an explicit, auditable test delivery that cannot accidentally target a customer or send directly from an admin request.

Scope:

- Restrict the action to owner/manager roles and fixed system-template versions.
- Require a separately entered test recipient, language, confirmation and UUID request identity.
- Render only allowlisted placeholders against clearly synthetic sample values.
- Persist immutable subject, HTML and plain-text snapshots without attaching an order or enquiry.
- Queue one idempotent email delivery and one durable private-worker job in the same transaction.
- Record metadata-only audit evidence without copying the recipient, rendered content or secrets.
- Verify the MySQL contract, responsive admin controls, serious/critical accessibility findings and complete quality gate.

Acceptance criteria:

- Repeating one request cannot duplicate its delivery, automation job or audit event.
- Archived, custom, missing or mismatched template versions cannot be queued through this system-template action.
- The browser request never calls SMTP and never mutates customer, order or payment state.
- Test output contains sample values only and leaves no unresolved or unsupported placeholders.
- Focused integration/browser tests and the complete quality gate pass through `scripts/sprint-08am.ps1`.

Verified: 2026-09-07. The controlled queue, immutable snapshots, four-browser accessibility contract and complete quality gate passed.

### [x] Sprint 08AN — Transactional email design and communication sign-off

Goal: replace minimal seed content with polished, responsive Ruseè transactional drafts before live sales.

Scope: six Greek-first/English-secondary editorial email drafts, plain-text parity, allowlisted placeholders, safe links, mobile-width tables and an idempotent draft initializer. Existing active versions are never replaced automatically; preparation creates immutable drafts for explicit administrator review and activation.

Acceptance criteria: all six drafts use only their fixed placeholder allowlists, contain no executable or secret-shaped content, remain responsive at 640px, and pass the admin browser plus complete quality gates. Preparation must not activate a template, contact SMTP or send a message.

Verified: 2026-09-07. Six editorial drafts, allowlisted-variable checks, admin acceptance and the complete gate passed without activation or delivery.

### [x] Sprint 08AO — Active template runtime integration

Goal: make an explicitly active immutable database template authoritative for queued transactional delivery while retaining the reviewed code fallback.

Scope: active-version lookup by fixed system key, allowlisted server rendering, HTML-escaped dynamic values, unsafe-markup rejection, snapshot persistence before SMTP, retry immutability and fallback when an active version is absent or invalid. Admin activation remains explicit; tests do not send SMTP or call a payment provider.

Acceptance criteria: customer-controlled values cannot inject email HTML, subject line breaks are removed, one active version is recorded on the delivery snapshot, retries retain their first snapshot, production links require HTTPS, and focused plus complete gates pass through `scripts/sprint-08ao.ps1`.

Verified: 2026-09-07. Active rendering, HTML safety, immutable snapshots, fallback behavior and the complete quality gate passed without SMTP or provider calls.

### [x] Sprint 08AP — Email-template history and safe rollback

Goal: let owners/managers inspect immutable versions and deliberately restore an earlier approved template without rewriting queued communication.

Scope: Greek-first protected history, author/timestamp and active-state visibility, sandboxed previews, transactional version ownership validation, idempotent activation, metadata-only auditing and explicit future-only impact language.

Acceptance criteria: missing, archived and cross-template versions cannot activate; selecting the current version is a no-op; a rollback creates one audit event without copying bodies or recipients; existing delivery snapshots remain unchanged; focused MySQL/browser and complete gates pass through `scripts/sprint-08ap.ps1`.

Verified: 2026-09-07. Immutable history, transactional activation, rollback safeguards, browser accessibility and the complete gate passed.

### [x] Sprint 08AQ — Queue-only email operations

Goal: make the private automation worker the only owner of SMTP delivery.

Scope: replace direct admin-triggered delivery and retry with transactional `email_dispatch` jobs, bounded manual-request deduplication, failed-delivery row locking, five-attempt enforcement, immutable snapshot preservation, metadata-only auditing and Greek-first operational wording.

Acceptance criteria: browser actions never call SMTP; repeated manual dispatch within one minute creates one job; retry creates one job only for an eligible failed delivery and does not increment attempts before worker execution; concurrent requests cannot duplicate delivery; focused MySQL/browser and complete gates pass through `scripts/sprint-08aq.ps1`.

Verified: 2026-09-07. Queue-only dispatch/retry, idempotency, audit evidence, browser accessibility and the complete gate passed without SMTP or provider calls.

### [x] Sprint 08AR — Email-delivery crash recovery and failure hygiene

Goal: prevent interrupted SMTP claims from leaving transactional messages permanently stuck in `sending`.

Scope: fifteen-minute stale-lease recovery, bounded requeue, permanent failure at five attempts, fresh-lease protection, shared secret-redaction policy and recovery at the start of each worker delivery cycle.

Acceptance criteria: stale leases with attempts remaining return to `queued` without incrementing attempts; exhausted leases become `failed`; fresh leases are untouched; stored transport errors contain no credentials or connection strings; focused MySQL and complete gates pass through `scripts/sprint-08ar.ps1` without opening SMTP.

Verified: 2026-09-07. Isolated stale-lease recovery, attempt ceilings, credential redaction and the complete quality gate passed without SMTP or provider calls.

### [x] Sprint 08AS — Email-delivery observability

Goal: let the owner understand transactional email health without reading raw database records or exposing transport secrets.

Scope: all-time status totals, explicit queued/sending/sent/failed filters, Greek-first status labels, worker-recovery guidance, safe result rendering and responsive keyboard-accessible ledger navigation. Retry and dispatch remain queue-only operations owned by the private Plesk worker.

Acceptance criteria: totals are database-authoritative; invalid filters safely fall back to all messages; selected filters expose `aria-current`; historic error text is sanitized again before rendering; no browser action contacts SMTP; focused recovery/browser accessibility and the complete gate pass through `scripts/sprint-08as.ps1`.

Verified: 2026-09-07. Delivery totals, filters, recovery guidance, safe diagnostics, browser accessibility and the complete gate passed without SMTP or provider calls.

### [x] Sprint 08AT — Transactional-email reconciliation

Goal: identify commerce events that should have a transactional email record but do not, even when the existing delivery queue itself appears healthy.

Scope: read-only MySQL reconciliation for paid-order confirmations, shipment updates and reviewed return statuses; Greek-first admin visibility with direct order links and event timestamps; no automatic repair, SMTP call or status mutation.

Acceptance criteria: covered events are absent from the report; missing payment, shipment and current return-status messages are each detected; the report cannot create or send email; focused isolated MySQL/browser accessibility and the complete gate pass through `scripts/sprint-08at.ps1`.

Verified: 2026-09-07. Missing payment, shipment and return communication detection, browser accessibility and the complete quality gate passed without SMTP or provider calls.

### [x] Sprint 08AU — Guarded transactional-email repair

Goal: let an authorized owner or manager correct one reconciled communication gap without bypassing the private worker or weakening commerce authority.

Scope: explicit per-gap confirmation, transactional source-state revalidation, standard idempotency keys, one queued delivery, one durable `email_dispatch` job, metadata-only audit evidence and automatic disappearance from the reconciliation report. Payment repair requires a verified paid state; shipment repair requires a shipment; return repair requires a reviewed current return state.

Acceptance criteria: ineligible states are rejected; repeated repair cannot duplicate a delivery, job or audit event; no recipient or message body enters audit metadata; the browser action never calls SMTP; focused isolated MySQL/browser accessibility and the complete gate pass through `scripts/sprint-08au.ps1`.

Verified: 2026-09-07. Eligible repair revalidation, idempotency, metadata-only auditing, browser accessibility and the complete gate passed without SMTP or provider calls.

### [x] Sprint 08AV — Plesk worker freshness and backlog health

Goal: show whether the private automation worker is operating recently enough to process durable email and operational jobs.

Scope: protected read-only last-completion timestamp, oldest due job, due/failed/stale-lock counts and deterministic healthy/delayed/attention/stale/never-run states. Add a complete Greek-first `/admin/guide` organized into the same five cards as the main menu, with normal-case answers inside keyboard-operable question accordions. The health UI links to the queue but cannot execute cron, expose its URL or reveal its Bearer secret.

Acceptance criteria: an empty history never claims cron is configured; recent completion is healthy; an ageing due job is delayed; failures and stale locks take attention priority; the guide mirrors all menu groups, renders questions uppercase and answers normal case, and operates by keyboard; focused isolated MySQL/browser accessibility and the complete gate pass through `scripts/sprint-08av.ps1` without running cron, SMTP or a provider.

Verified: 2026-09-07. Worker freshness, backlog priority, secret-safe output, the five-section Greek-first guide, keyboard interaction, browser accessibility and the complete gate passed without running cron, SMTP or a provider.

### [~] Sprint 08AW — Transactional route indexing privacy

Goal: prevent search engines and link previews from indexing private operational and customer-transaction routes even when a direct URL is discovered.

Scope: shared route-level noindex/nofollow/noarchive/nosnippet/noimageindex metadata for all admin, cart, checkout, order-status and payment routes. Keep the existing production-aware public robots and sitemap behavior unchanged.

Acceptance criteria: every sensitive route family has a layout or page metadata boundary; representative admin/cart/checkout pages render noindex and nofollow in a browser; public storefront paths are not classified as private; focused unit/browser checks and the complete gate pass through `scripts/sprint-08aw.ps1` without database mutation, deployment or external requests.

### [x] Sprint 08AX — Admin commerce control room

Verified: 2026-10-29. The owner-run focused diagnostics and complete Sprint 01 gate passed through `scripts/sprint-08ax.ps1`. The saved evidence is `artifacts/verification/sprint-08ax-admin-commerce-diagnostics.txt` and `artifacts/verification/sprint-08ax-results.txt`. No provider, SMTP, deployment or refund execution was invoked.

Goal: give the owner one clean, evidence-led view of every order while preserving provider authority and preventing unsafe fulfilment.

Scope:

- Add operational order views for attention, verified-ready, processing, shipped and active returns.
- Show one explicit fulfilment-safety state derived from the order ledger and an exact captured amount/currency match.
- Recheck the matching capture inside the locked fulfilment transaction instead of trusting the visible order flag alone.
- Consolidate invoice details, immutable order lines, payment attempts, sanitized provider events, shipments, return requests, refunds and transactional email on order detail.
- Remove direct delivered-to-returned advancement from fulfilment; only a received return request can mark physical return receipt.
- Restrict return controls to valid state transitions and hide mutation controls from viewer roles.
- Surface failed and unmatched provider events in reconciliation without exposing raw payloads or credentials.
- Include return/provider-event actions in the redacted audit categories and correct the role handbook.
- Retain refund execution, live provider synchronization and webhook implementation behind Sprint 09.

Acceptance criteria:

- A pending, failed or ledger-only paid order cannot enter fulfilment.
- Exactly one captured payment with the same total and currency is required by both UI evidence and server action.
- Invoice VAT, tax-office and activity fields are visible to authorized staff without changing their stored snapshot.
- Invalid return transitions are absent from the UI and rejected by the existing server state machine.
- An unmatched or failed provider event is visible in reconciliation and can receive a metadata-only investigation note.
- No action can manually mark an order paid, execute a provider refund, expose a secret or treat a browser return as payment evidence.
- Focused unit tests and the complete owner-run quality gate pass through `scripts/sprint-08ax.ps1`.

## [!] Sprint 09 — Contracted live payment provider

Blocked by: merchant/provider selection, signed agreement, official current technical documentation, sandbox credentials, production credentials, HTTPS callbacks, and completed earlier hardening sprints.

Goal: launch at least one authenticated hosted-payment integration.

Scope:

- Implement only the commercially selected provider from official documentation.
- Verify signature, provider state, amount, currency, and order reference server-side.
- Keep browser returns informational and webhook/provider verification authoritative.
- Test success, decline, cancellation, timeout, duplicate, replay, mismatch, reconciliation, and refund flows.
- Document credential rotation and operational procedures.
- Perform a controlled low-value live payment and refund with the merchant.

Acceptance criteria:

- Duplicate or replayed events cannot duplicate fulfilment, stock changes, emails, or refunds.
- No card data, CVV, provider secret, or raw authorization header is stored or logged.
- The provider-specific production-readiness checklist and live reconciliation pass.

## Current execution position

Sprints 01–07, 08A–08AF and 08AJ–08AV are verified. Sprint 08AW adds direct search-index privacy boundaries to private and transactional route families and awaits its owner-run gate. The ten-order local admin demonstration also passed. Optional staff support is available but is not required. Upload/deployment, Papaki/Plesk rollback and production preflight remain separate operator-controlled steps. Sprint 09 live payments remains blocked on a contracted provider, official documentation and credentials.
