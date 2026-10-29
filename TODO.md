# Ruseè Kimono Delivery Plan

Execution order, sprint acceptance criteria, and the active verification state are tracked in `sprints.md`.

Status legend: `[ ]` pending, `[~]` in progress, `[x]` complete, `[!]` blocked.

## Phase 0 - Decisions and local readiness

- [x] Create the Next.js 16 project with TypeScript, App Router, `src`, Tailwind CSS, and ESLint.
- [x] Install the initial visual foundation: GSAP, Motion, Lenis, Lucide, and class utilities.
- [x] Create MySQL database `next_kimono` with `utf8mb4_unicode_ci`.
- [x] Create a database-scoped application user.
- [x] Add a structurally valid local `DATABASE_URL` for `localhost:3306/next_kimono`.
- [x] Audit `../prev_src_animation_project_with_admin` for reusable admin/design/animation patterns.
- [x] Record architecture and agent rules.
- [x] Rename generic `USERNAME`/`PASSWORD` bootstrap keys, create the first hashed admin, and remove the temporary plaintext values from the active environment.
- [x] Create `.env.example` with placeholders only and confirm `.env` is ignored by Git.
- [x] Confirm WAMP is running MySQL Community Server 8.2.0 with `utf8mb4_unicode_ci`.
- [ ] Confirm the intended production hosting can run a persistent Next.js Node.js process and connect to MySQL.

Exit criteria: environment conventions and production runtime assumptions are unambiguous.

## Phase 1 - Database foundation

- [x] Read the relevant bundled Next.js server/client-component, data, and route-handler guidance before implementation.
- [x] Install `mysql2`, `drizzle-orm`, `drizzle-kit`, and `zod`.
- [x] Add server-only, pooled MySQL connection handling appropriate to development hot reload and production.
- [x] Add environment validation without logging secrets.
- [x] Define catalogue tables: products, designs, colours, sizes, variants, images.
- [x] Define inventory and immutable inventory movements.
- [x] Define customers, orders, order items, order addresses, and status events.
- [x] Define payments, payment events, and refunds with provider-ID uniqueness.
- [x] Define admin users, sessions, roles, and audit events.
- [x] Generate and review the initial SQL migration, explicitly selecting InnoDB for WAMP compatibility.
- [x] Apply the migration to local `next_kimono` and verify 19 application tables plus migration history.
- [x] Add a safe seed for one kimono, 3 designs, 3 colours, 3 sizes, 27 variants, prices, stock, and editorial image references.
- [x] Add database unit/integration tests for price snapshots, stock reservations, and uniqueness constraints; Sprint 07 real-MySQL coverage passed.

Exit criteria: a repeatable migration builds the same empty schema locally and in production, and the seed produces a browsable initial catalogue.

## Phase 2 - Design system and application shell

- [x] Inventory the reference project's exact reusable components and adapt selected patterns without modifying the source reference.
- [x] Define light-theme colour, spacing, grid, typography, border, and motion tokens in Tailwind v4/CSS.
- [~] Use local Bricolage Grotesque plus distributable Cormorant Garamond as the Karena-like serif; replace it if licensed Karena font files are supplied.
- [ ] Build accessible foundational components: button, link, field, select, disclosure, dialog/drawer only as required.
- [x] Add `@gsap/react` and create a scoped GSAP/ScrollTrigger/SplitText utility; integrate copied ParallaxImage, SplitText, reveal, hover, preloader, and page-transition components.
- [x] Build a storefront-only Lenis provider.
- [x] Establish reduced-motion behavior and disable smooth scrolling on checkout/admin/payment routes.
- [x] Build responsive header, full-screen navigation, bag trigger, animated footer, newsletter, and route shell.
- [x] Adapt the reference preloader and photographer project's six-block page transition lifecycle, with reduced-motion and safety fallbacks.
- [x] Establish initial image art direction, aspect-ratio rules, and responsive `next/image` sizes using approved reference assets.

Exit criteria: the shell works at mobile/desktop widths, with keyboard navigation and reduced motion, before product-page complexity begins.

## Phase 3 - Editorial storefront

- [x] Build homepage hero and collection introduction.
- [x] Build material/craft story sections and an initial editorial gallery.
- [x] Build a database-driven shop/product presentation with server-rendered catalogue data.
- [x] Build variant selection for design, colour, and size with stock-aware availability.
- [~] Show price, stock state, care and shipping; bilingual size guidance and measuring instructions are implemented, while numerical garment measurements and final returns copy await approved production/legal details.
- [x] Add GSAP only to preloader/reveal/navigation/footer sequences and Motion only to product interaction feedback.
- [x] Add SEO metadata, canonical URLs, Product JSON-LD, sitemap, robots, and social images; Greek-first metadata and truthful catalogue-derived SEO passed Sprint 07 verification.
- [x] Verify empty/missing/inactive product states; editorial loading, empty, error and not-found surfaces passed Sprint 07 storefront verification.
- [~] Run accessibility, mobile, reduced-motion, and performance checks; automated Chromium/Firefox/WebKit, axe, keyboard, mobile-overflow, reduced-motion and local production performance budgets passed, while real assistive-technology, physical-device and Papaki field performance remain manual gates.

Exit criteria: a customer can understand the product and select one valid sellable SKU without any payment code.

## Phase 4 - Cart and checkout domain

- [x] Define a persistent browser cart model while keeping it explicitly non-authoritative.
- [x] Build the Motion cart drawer and `/cart` review page with quantity editing and removal.
- [x] Validate product status, variant, price and availability through a server-only MySQL endpoint whenever an item is added.
- [x] Use Zod at the checkout API boundary and native accessible form controls for the initial guest checkout.
- [x] Build guest contact, Greece shipping, consent, and order-review steps; billing currently mirrors shipping.
- [ ] Define VAT, shipping zones/rates, discount rules, and rounding with the business/accountant.
- [x] Implement transactional order creation with immutable item/address snapshots.
- [x] Implement transactional stock reservation, 30-minute expiry, idempotent release, and verified-payment stock confirmation.
- [x] Generate non-guessable UUID public order references and separate human-readable order numbers.
- [x] Add strict validation and safe customer-facing error recovery; rate limiting, restored-cart validation and idempotent checkout retries passed Sprint 08X verification on 2026-08-24.

Exit criteria: a validated pending order and stock reservation can be created without a payment provider.

## Phase 5 - Admin authentication and operations

- [x] Choose Node `scrypt` password hashing and opaque database-backed sessions for the confirmed Node runtime.
- [x] Bootstrap the first admin without retaining plaintext credentials in the active environment.
- [x] Implement opaque, expiring, rotatable, revocable server-side sessions.
- [x] Protect the current admin layout, reads, and actions at the server data-access boundary.
- [x] Adapt the reference admin navigation into the kimono design system.
- [x] Build overview metrics with low-stock, reservation, order, and verified-revenue cards.
- [x] Build audited product/variant/design/colour/size management, including option creation, variant creation, initial inventory, and immutable seed movements.
- [x] Build role-restricted transactional inventory adjustments backed by immutable movement and admin-audit records.
- [x] Build paginated order search and individual detail with item/address snapshots, reservation history, status events, and sanitized payment attempts.
- [x] Build payment/reconciliation views without exposing sensitive payloads.
- [x] Add immutable admin audit events for authentication, inventory, catalogue, order/refund, email, privacy, reconciliation and information mutations, plus a redacted owner/manager activity viewer.
- [x] Add logout, session expiry, failed-login handling, and database-backed basic brute-force protection.

Exit criteria: the store can be operated without phpMyAdmin for routine product, stock, order, and payment work.

## Phase 6 - Payment abstraction and sandbox provider

- [x] Define the server-only provider contract in `features/payments`.
- [x] Implement a signature-verifying internal fake/sandbox provider boundary; add its customer-facing simulator with event processing next.
- [x] Implement idempotent payment attempts and append-only verified event processing.
- [x] Implement webhook authentication and unique provider-event idempotency.
- [x] Implement safe fake-provider cancellation, failure, pending, and verified-success experiences.
- [x] Confirm paid status only from a verified webhook event; browser returns remain read-only.
- [x] Add duplicate/replay, out-of-order, malformed-signature, malformed-payload, and amount-mismatch integration tests.
- [x] Add reconciliation logic for amount/currency, capture/order-ledger, and failed-event mismatches.

Exit criteria: automated tests prove that duplicate callbacks cannot duplicate fulfilment, stock changes, or confirmation email.

## Phase 7 - Live payment providers

- [ ] Select the first launch provider based on signed merchant agreement, fees, settlement, wallets, and technical documentation.
- [ ] Implement Stripe Checkout/Payment Element if selected; enable Google Pay/Apple Pay through supported configuration.
- [ ] Implement PayPal if selected and commercially justified.
- [ ] Implement NBG Pay Hosted Checkout after sandbox/merchant credentials arrive.
- [ ] Implement Eurobank/Worldline Hosted Checkout after sandbox/merchant credentials arrive.
- [ ] Verify amount, currency, order reference, signature, and provider state for every provider.
- [ ] Document credential rotation, sandbox test cases, refunds, and operational reconciliation.
- [ ] Run provider-specific success, decline, cancellation, timeout, duplicate, and refund tests.

Exit criteria: at least one contracted provider passes its production-readiness checklist; other providers can be added without checkout-domain changes.

## Phase 8 - Customer communication and fulfilment

- [~] Select transactional email delivery and configure domain authentication: Papaki-compatible SMTP is implemented; production mailbox, SPF, DKIM and DMARC remain pending.
- [x] Build idempotent verified-payment confirmation email queue and delivery.
- [x] Build idempotent admin new-order notification queue and delivery.
- [x] Build idempotent shipping/fulfilment status communication tied transactionally to workflow transitions.
- [x] Add capped explicit retry behavior and delivery logging.
- [ ] Decide on manual versus courier-integrated labels/tracking for launch.
- [~] Document cancellation, refund, failed-payment, and stock-correction procedures; guarded fulfilment transitions and provider-pending refund requests are implemented, live execution remains provider-specific.

Exit criteria: every verified paid order produces one clear operational workflow and customer confirmation.

## Phase 9 - Production hardening and launch

- [~] Add Vitest with real-MySQL payment integration coverage and Playwright commerce/accessibility coverage; browser preparation and verification remain user-run.
- [~] Cover product selection, cart, pending order, payment event, admin order, and refund journeys; isolated browser contracts cover product/cart/checkout and anonymous admin protection, while verified payment events have real-MySQL coverage and authenticated admin/refund browser journeys remain pending.
- [~] Add structured redacted logging and error monitoring: JSON redaction, health diagnostics and optional cooldown-protected webhook alerts are implemented; the production monitoring destination remains pending.
- [x] Confirm recoverable backups: Papaki JetBackup covers MySQL and website files with selectable restore points; retain the custom isolated rehearsal only as an optional diagnostic tool.
- [~] Add security headers, HTTPS, cookie policy, and webhook production URLs: application security headers and production HSTS are implemented; final proxy, cookie-policy and live webhook verification remain pending.
- [x] Review personal-data minimization, retention, export, and erasure behavior; Sprint 06 verification passed and automatic retention remains disabled pending legal approval.
- [ ] Have Greek legal/accounting professionals confirm VAT, receipts/invoicing, terms, privacy, returns, shipping, and mandatory payment requirements.
- [~] Run cross-browser/mobile, keyboard, screen-reader smoke, and reduced-motion checks: Chromium desktop/mobile overflow, animation and focus styling are verified; Safari/Firefox, assistive-technology and emulated reduced-motion sessions remain pending.
- [ ] Run `npm run lint`, tests, and `npm run build` in the production environment.
- [ ] Run a low-value live payment and refund with the merchant.
- [~] Prepare rollback, maintenance, support, and reconciliation procedures: application maintenance routing and operator checklists are implemented; Papaki/Plesk and JetBackup exclusively own backup and rollback execution.

Exit criteria: launch approval is evidence-based and includes a tested rollback and database restore path.

## Immediate next task

- [x] Verify Sprint 08AX Admin commerce control room: consolidated order evidence, captured-payment fulfilment gate, valid return transitions, unmatched provider-event reconciliation and role-safe controls passed the owner-run focused diagnostics and complete gate on 2026-10-29. Live provider, SMTP, deployment and refund execution remain separate pending gates.

- [x] Reorganize the protected admin navigation into five operational groups without deleting routes; Sprint 08A verification passed on 2026-08-20.
- [x] Prepare Sprint 08B: the redacted Papaki/Plesk environment template, capability preflight, and operational runbooks passed verification on 2026-08-20.
- [x] Prepare Sprint 08C: Plesk standalone deployment/start scripts, environment-injected Scheduled Task commands, secret-excluding packaging and release-contract tests passed verification on 2026-08-20.
- [x] Verify Sprint 08D: the selected Raw-grid/Editorial-palette product direction, editorial information imagery, GSAP clip-path text/image reveals, design-owned colour, size-responsive imagery, exact SKU isolation and intercepted add-to-bag browser contract passed across Chromium, Firefox, WebKit and mobile reduced-motion on 2026-08-20. Additional sizes can be created safely in Admin → Catalogue → Add product, followed by one unique SKU and stock record per design/size.
- [x] Populate the local admin demonstration: the idempotent ten-order scenario seed and read-only verifier passed, covering payment, fulfilment, cancellation, failure, delivery, returns, refunds and email states.
- [x] Run Sprint 08E migration and verification for fifteen real design cards, dedicated bilingual design editors, one fixed colour per design, shared product-level care, and size-only sellable SKUs; the full verification gate passed on 2026-08-20.
- [x] Verify Sprint 08F catalogue media readiness: design-and-size image assignments, bilingual alt text, per-design admin management, safe provisional fallbacks, lead-image priority, assignment integrity checks, admin-loader regression coverage and cross-design isolation passed on 2026-08-21.
- [x] Implement and verify Sprint 08G checkout abuse protection and production launch guards before any contracted live-payment adapter work; the delegated gate passed on 2026-08-21.
- [x] Verify Sprint 08H production release readiness: redacted launch audit, explicit production-script allowlist, stale-verification packaging guard and approval/blocker separation passed on 2026-08-21.
- [x] Verify Sprint 08I authenticated admin operations: the local-only ephemeral owner, real login/session/logout, grouped Greek-first navigation and read-only DEMO order inspection passed across all browser profiles on 2026-08-21.
- [x] Verify Sprint 08J authenticated admin mutations: isolated paid orders passed fulfilment advancement, queued-only notification creation, capped partial-refund requests and immutable database/audit evidence across all browser profiles on 2026-08-21.
- [x] Verify Sprint 08K launch-quality hardening: public commerce/legal routes, keyboard operation, serious/critical accessibility findings, mobile overflow, reduced motion, route readiness and authenticated admin accessibility passed across all browser profiles on 2026-08-21.
- [x] Verify Sprint 08L operational maintenance: the explicit production flag, real 503 holding page, stable liveness probe and operational-route bypass passed on 2026-08-24. Papaki/Plesk remains the sole rollback and backup owner.
- [x] Verify Sprint 08M launch-approval visibility: Admin → System status separates technical health from seven external business/provider approvals, all safely defaulting to pending; the complete delegated gate passed on 2026-08-24.
- [x] Verify Sprint 08N customer information: the editorial information hub, shipping/courier, payment-method and care/fit pages, existing returns/cookies/legal routes, footer/menu placement, sitemap entries and cross-browser accessibility contracts passed on 2026-08-24.
- [x] Verify Sprint 08O admin-managed information: seven fixed MySQL-backed bilingual drafts, owner/manager editing, explicit publication, audit evidence and public code-copy fallback passed on 2026-08-24.
- [x] Verify Sprint 08P information review: authenticated draft previews, explicit GR/EN switching, publication-readiness guidance and safe contextual admin navigation passed on 2026-08-24.
- [x] Verify Sprint 08Q publication safety: explicit publish/update/withdraw confirmations, status-specific audit actions, success feedback and safe public fallback behavior passed on 2026-08-24.
- [x] Verify Sprint 08R admin activity: owner/manager-only redacted audit history, operational filters, server pagination and Greek-first action labels passed on 2026-08-24.
- [x] Verify Sprint 08S optional admin team: owner-only staff creation, role explanation, password reset, account activation/deactivation, session revocation and audit evidence passed on 2026-08-24. No staff account is required or created by verification.
- [x] Verify Sprint 08T daily action centre: Greek-first attention cards for enquiries, email, stock, refunds, reconciliation, draft information and external launch approvals passed on 2026-08-24.
- [x] Verify Sprint 08U pre-provider release candidate: consolidated database, catalogue, media, commerce-guard, information, launch-audit, storefront and owner-admin gates passed on 2026-08-24.
- [x] Verify Sprint 08V performance and operator acceptance: all ten isolated production-build desktop/mobile route budgets and the complete quality gate passed on 2026-08-24. Papaki and real-device measurements remain separate manual launch evidence.
- [x] Verify Sprint 08W bilingual visual acceptance: Greek/English desktop/mobile storefront and temporary-owner admin captures, including the revised responsive footer, passed on 2026-08-24.
- [x] Verify Sprint 08X checkout resilience: restored-cart validation, bilingual recovery, stable retry idempotency, isolated browser contracts and the complete gate passed on 2026-08-24.
- [x] Verify Sprint 08Y catalogue readiness: the read-only 15-design structural matrix, editor links and Overview attention count passed delegated verification on 2026-08-25.
- [x] Verify Sprint 08Z product-fact approvals: the six-category, pending-by-default client/sample approval ledger and owner/manager audit path passed delegated verification on 2026-08-25.
- [x] Verify Sprint 08AA courier-neutral shipment tracking: migration, guarded dispatch fields, queued tracking email context and customer status display passed delegated verification on 2026-08-25.
- [x] Verify Sprint 08AB return-request workflow: email-confirmed customer intake, idempotent MySQL record, protected admin triage and non-refund status transitions passed delegated verification on 2026-08-25.
- [x] Verify Sprint 08AC return communication: Overview visibility and idempotent studio/customer email queueing passed delegated verification on 2026-08-25.
- [x] Verify Sprint 08AD transactional localization: Greek-first customer emails and canonical UUID order-status links passed delegated verification on 2026-08-25.
- [x] Verify Sprint 08AE responsive typography: display headings/menu links use bounded clamps, tiny labels/metadata are enlarged, and bilingual desktop/mobile visual plus complete gates passed on 2026-08-26.
- [x] Verify the Ruseè homepage testimonial stack: keyboard controls, all-viewport pointer dragging, autoplay pause, GSAP clip/line reveals and reduced motion passed all browser profiles; the section-level non-publishable placeholders still require genuine approved replacements.
- [~] Verify Sprint 08AF admin/storefront readiness: readable login, editorial transition/menu, `/admin/health` responsibility lanes, four bilingual legal starter drafts and the unified 24-file optimized kimono image library are implemented; database media reassignment and the fresh owner-run gate remain pending.
- [ ] Implement Sprint 08AG MySQL-backed full-screen admin notifications with per-admin read/archive state; clearing a notification must not resolve its underlying operational condition.
- [ ] Implement Sprints 08AH–08AI versioned Greek-first/English-secondary transactional email templates, safe CRUD, sandboxed preview and controlled test delivery.
- [x] Implement Sprints 08AJ–08AL durable Plesk-run automation, verified-sale notification fan-out and the isolated release gate without marketing automation; Sprint 08AL passed the complete owner-run gate on 2026-09-07.
- [x] Verify Sprint 08AM controlled email-template test delivery: owner/manager-only explicit recipients, immutable sample snapshots, idempotent queueing and private-worker dispatch passed on 2026-09-07; no SMTP is called by the admin request.
- [x] Verify Sprint 08AN polished transactional email drafts and communication sign-off; the complete gate passed on 2026-09-07 without activating templates or sending SMTP.
- [x] Verify Sprint 08AO active database-template rendering, escaped variables, immutable delivery snapshots and safe code fallback; the complete gate passed on 2026-09-07 without SMTP.
- [x] Verify Sprint 08AP immutable email-template history and transactional future-only rollback; focused and complete gates passed on 2026-09-07.
- [x] Verify Sprint 08AQ queue-only Email Ledger dispatch/retry; focused and complete gates passed on 2026-09-07 and browser actions no longer own SMTP delivery.
- [x] Verify Sprint 08AR stale email-delivery recovery, attempt ceilings and sanitized transport failures; focused and complete gates passed on 2026-09-07 without SMTP or provider calls.
- [x] Verify Sprint 08AS database-authoritative delivery totals, safe filters, Greek-first recovery guidance and sanitized admin diagnostics; browser and complete gates passed on 2026-09-07.
- [x] Verify Sprint 08AT read-only reconciliation for missing payment-confirmation, shipment-update and return-status email records; focused and complete gates passed on 2026-09-07.
- [x] Verify Sprint 08AU explicitly confirmed, server-revalidated and idempotent repair of eligible missing transactional-email records; focused and complete gates passed on 2026-09-07.
- [x] Verify Sprint 08AV protected Plesk-worker health plus the five-section Greek-first admin guide with keyboard-operable accordions and complete operational answers; the focused browser and complete gates passed on 2026-09-07.
- [~] Verify Sprint 08AW route-level search privacy: admin, cart, checkout, order-status and payment routes must emit direct noindex/nofollow metadata while public catalogue discovery remains unchanged.
- [x] Persist validated, idempotent contact enquiries in MySQL with payload, honeypot, timing, and HMAC-fingerprint rate-limit controls; Sprint 02 migration and verification passed.
- [x] Queue an idempotent transactional studio notification for each persisted enquiry and add the protected Greek-first admin enquiry inbox; Sprint 03 passed.
- [x] Record Papaki JetBackup/Plesk as the primary scheduled backup and restore owner; keep the custom rehearsal as an optional function.
- [x] Add personal-data retention, export, and erasure operations before live-provider payment/refund work; Sprint 06 passed while automatic retention remains disabled pending policy approval.

Current locale sprint:

- [x] Make Greek the default storefront/admin locale with English secondary, locale-aware global metadata, typed admin navigation, and regression tests; Sprint 04 passed.
- [~] Add bilingual, admin-editable fabric, fit, measurements, construction, opacity, care, provenance, packaging, shipping, and returns guidance; provisional claims await final garment/sample confirmation and Sprint 05 verification.

## Editorial interaction sprint

- [x] Replace the admin link bar with the reference clip-path burger menu and current operational links.
- [x] Add design/colour-driven product imagery with a centre-out clip-path transition and deep-link selection.
- [x] Add the autoplaying, looping, draggable homepage design carousel with controls and product links.
- [x] Match the reference sticky bottom footer reveal and `bottom bottom` trigger behavior.
- [x] Adapt the reference About services composition to the Ruseè light palette and content.
- [x] Adapt the photographer contact composition to the Ruseè editorial contact page.
- [x] Add the 15-card responsive Shop design index with paired local hover imagery.
- [x] Add the bordered clip-inversion Bag control and notification badge.
- [x] Guard global GSAP entrances against empty target collections.
- [x] Audit visible branding for the exact `Ruseè` / `RUSEÈ` spelling.
- [x] Reduce `/shop` to the reference-led hero, 15-card index, CTA, and shared reveal footer.
- [x] Route every Shop card to `/shop/[slug]` with its selected colour preserved.
- [x] Add the three-image scrolling product gallery, sticky purchase panel, and animated manufacture/composition/care/provenance section.
- [x] Reserve vertical space around display and SplitText line boxes so accented brand letters are never clipped.
- [x] Reset Lenis and native scroll while the route curtain is fully covered to prevent the persistent footer flashing between pages.
- [x] Add a persistent accept/essential-only cookie banner and editorial `/cookies` and `/privacy-policy` routes.
- [x] Add live privacy and cookies links plus accent-safe title padding to the reveal footer.
- [x] Hard-hide the persistent footer for the full non-ready route state and synchronously reset scroll on pathname change.
- [x] Replace Shop card clip-path painting with a composited opacity/scale crossfade.
- [x] Add the CTA keyword underline interaction and inverted text-selection colours for light and dark surfaces.
- [x] Add editable editorial `/terms` and `/returns` policy templates and link them from the footer.
- [x] Keep the Lenis root stable across every route, tune wheel smoothing, and visually hide native scrollbars without disabling scroll.
- [x] Restrict the preloader to initial public storefront loads so checkout, payment, order and admin routes never replay it.
- [x] Add the persisted EN/GR locale cookie/provider/API foundation and translate the global header/menu controls.
- [x] Add the header language control before Bag and centre a larger count inside its 24px notification circle.
- [x] Simplify admin navigation labels for routine store operation and clarify hosted-provider checkout copy.
- [x] Extend Greek translation across every public, commerce, checkout, legal, payment and admin surface, including dynamic text, form attributes and status labels.
- [x] Apply Times New Roman to Greek display headings while preserving the sans-serif interface/body pairing.
