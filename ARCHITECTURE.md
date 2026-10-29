# Ruseè Kimono Architecture

## 1. System goal

Ruseè Kimono is a custom Next.js e-shop with an editorial storefront and a protected operations panel. Version one sells a single kimono product family in multiple designs, colours, and sizes, while keeping the data model ready for additional products.

The system separates four concerns:

1. Storefront presentation and editorial animation.
2. Commerce rules for catalogue, variants, cart, orders, and stock.
3. Payment-provider adapters for Stripe, PayPal, NBG Pay, and Eurobank/Worldline.
4. Admin operations backed by MySQL.

## 2. Runtime topology

```text
Browser
  -> Next.js App Router
       -> Storefront Server Components
       -> Route Handlers / Server Actions
       -> Admin authorization boundary
       -> Commerce services
       -> Payment provider adapters
       -> MySQL (next_kimono)

Payment provider
  -> signed webhook Route Handler
       -> payment event deduplication
       -> transaction + order state transition
       -> inventory confirmation/release

phpMyAdmin
  -> direct operator access to MySQL (never in the application request path)
```

Local development uses WampServer's MySQL and phpMyAdmin. Production should use a persistent managed MySQL/MariaDB database with backups and TLS where supported. The production web host must support the Next.js Node.js runtime; PHP hosting alone is insufficient.

## 3. Technology decisions

### Installed foundation

- Next.js 16 App Router, React 19, TypeScript.
- Tailwind CSS v4.
- GSAP for scoped editorial timelines and ScrollTrigger sequences.
- Motion for UI state, layout, and cart interactions.
- Lenis for optional storefront smooth scrolling.
- `clsx` and `tailwind-merge` for class composition.
- `class-variance-authority` only where a component has meaningful variants.
- Lucide for utility icons; brand marks remain custom assets.

### Add when its phase begins

- `mysql2`: MySQL connection driver.
- `drizzle-orm` and `drizzle-kit`: typed queries and repeatable SQL migrations without Prisma.
- `zod`: validation at environment, form, API, and provider boundaries.
- `react-hook-form` plus `@hookform/resolvers`: complex checkout/admin forms.
- `@gsap/react`: scoped React integration and cleanup.
- `sonner`: restrained storefront/admin notifications.
- `bcryptjs` or `argon2`: admin password hashing, selected after production runtime compatibility is known.
- A standards-based session library or opaque database-backed sessions. Do not reproduce the reference project's deterministic cookie token.
- Provider SDKs only when that provider is implemented (`stripe`, PayPal SDK). NBG/Worldline should use their contracted API specification, not an unofficial package.
- `vitest` and Testing Library for units/components; Playwright for commerce journeys.

### Deferred decisions

- Image storage: local public assets during design, then S3-compatible storage or Cloudinary for admin uploads.
- Email provider: choose after deployment and domain-mail requirements are known.
- Courier/ERP/fiscal integrations: separate adapters after the launch checkout is stable.
- Radix: install individual free primitives only if a complex accessible interaction justifies them. It is not a baseline dependency.

## 4. Source layout

```text
src/
  app/
    (store)/                 public editorial/store routes
    checkout/                deliberately low-animation checkout
    payment/                 return, cancel, and status pages
    admin/                   protected operations UI
    api/
      payments/[provider]/   create/verify/webhook endpoints
      health/                non-secret readiness checks
  components/
    editorial/               campaign and story modules
    commerce/                product, variant, cart, money UI
    admin/                   admin-only presentation
    ui/                      small accessible primitives
  features/
    catalogue/
    cart/
    checkout/
    orders/
    inventory/
    payments/
    admin-auth/
  lib/
    animation/
    db/
      schema/
      migrations/
      connection.ts
    env/
    security/
    validation/
  providers/                 client-only UI providers
  styles/
  types/
```

Feature modules own their validation, queries, services, and domain types. Pages should compose feature APIs rather than contain raw SQL or payment logic.

## 5. Data model

All tables use InnoDB and `utf8mb4_unicode_ci`. Identifiers should be UUID/ULID strings or database-generated numeric IDs consistently within a table. All timestamps are stored in UTC. Money uses integer minor units and ISO currency codes.

### Catalogue

- `products`: product family, slug, title, editorial copy, status, tax class.
- `products.product_information`: structured bilingual customer guidance for fabric, feel, fit, measurements, construction, opacity, care, provenance, packaging, shipping, and returns. Unverified launch placeholders must say that confirmation is pending rather than inventing garment facts.
- `designs`: named visual design/print attached to a product.
- `colours`: controlled colour names and display values.
- `sizes`: size code, label, and sort order.
- `product_variants`: sellable SKU joining product, design, colour, and size; unique SKU; price; active state.
- `product_images`: ordered media with alt text and optional design/colour association.

The initial product can have one parent product while each sellable design/colour/size combination has a unique variant SKU.

### Inventory

- `inventory`: one row per variant with on-hand and reserved quantities.
- `inventory_movements`: immutable adjustments with reason, quantity delta, actor/order reference, and timestamp.

Available stock is derived from `on_hand - reserved`. Reservation and release happen inside database transactions. Admin stock edits create movements rather than silently overwriting history.

### Customers and orders

- `customers`: optional account/contact identity. Guest checkout remains supported.
- `contact_enquiries`: idempotent public contact submissions with normalized identity, controlled subject, optional order reference, locale, workflow status, and an HMAC-derived rate-limit key. Raw client IP addresses are not retained.
- `contact_enquiry_rate_limits`: compact rolling-window counters keyed by the HMAC fingerprint; this is abuse-control state, not a customer record.
- `addresses`: normalized billing/shipping snapshots or reusable addresses as policy permits.
- `orders`: public order number, customer contact, currency, monetary totals, status, payment status, fulfilment status, and timestamps.
- `order_items`: immutable snapshot of SKU, product/design/colour/size labels, unit price, quantity, tax, and total at purchase time.
- `order_addresses`: immutable checkout snapshots so later customer edits do not alter historical orders.
- `order_status_events`: append-only audit trail of state transitions.

### Payments

- `payments`: order, provider, provider payment/session ID, amount, currency, status, timestamps, and sanitized failure information.
- `payment_events`: provider event ID, verified event type, processing status, received time, payload hash, and restricted sanitized payload where retention is justified.
- `refunds`: payment, provider refund ID, amount, reason, status, and timestamps.

Unique constraints are required for provider payment IDs and provider event IDs. An order can have multiple payment attempts but only valid captured/settled amounts can move it to paid.

### Administration

- `admin_users`: email/username, password hash, role, active state, last login.
- `admin_sessions`: random opaque token hash, user, expiry, rotation/revocation metadata.
- `admin_audit_events`: actor, action, entity, entity ID, safe metadata, timestamp.

Contact enquiries follow the sequential operational states `new -> read -> replied -> closed`. Authorized admin transitions create an audit event. The email ledger may reference either an order or a contact enquiry; contact notifications use an idempotency key derived from the enquiry database ID and store the visitor address only as `reply_to`.

## 6. Order and payment lifecycle

### Order states

```text
draft -> pending_payment -> paid -> processing -> shipped -> completed
                      \-> payment_failed
pending_payment/paid  -> cancelled (subject to business rules)
paid                  -> partially_refunded -> refunded
```

Payment status and fulfilment status remain separate. A payment provider redirect does not change either status by itself.

### Checkout sequence

1. Validate selected variant and quantity on the server.
2. Read authoritative price and availability from MySQL.
3. Create an order and immutable order items inside a transaction.
4. Reserve stock with an expiry policy.
5. Ask the selected payment adapter to create a hosted payment session.
6. Redirect the customer to the provider.
7. Receive the provider's browser return for user experience only.
8. Authenticate the webhook or query the provider server-to-server.
9. Insert the provider event using a unique idempotency key.
10. In one database transaction, update payment/order state and confirm or release stock.
11. Send confirmation only after verified payment.

The implemented guest-checkout boundary accepts only variant IDs and quantities from the browser. It locks catalogue and inventory rows, recalculates every monetary value in MySQL, snapshots the selected SKU and delivery address, and reserves stock in one transaction. Repeating the same public UUID returns the existing order instead of creating a duplicate. Reservations expire after 30 minutes; the transactional release service cancels only still-pending orders, decrements reserved stock, and records release movements and status events. Run `npm run db:release-reservations` from a production scheduler, in addition to the opportunistic checkout cleanup. Greece-only delivery, free shipping, billing-equals-shipping, and an estimated inclusive 24% VAT split are temporary business assumptions and must be confirmed before launch.

### Payment adapter contract

Each provider implements equivalent server-only operations:

- `createCheckout(order)`
- `verifyReturn(input)` where supported, never sufficient alone for paid status
- `verifyWebhook(request)`
- `getPaymentStatus(providerPaymentId)`
- `refund(payment, amount)` when enabled

Provider secrets never enter Client Components. Logs use internal order IDs and sanitized provider references.

The initial `fake` adapter produces deterministic local checkout references and accepts events only when their raw body has a valid HMAC signature. Its verified output is normalized and sanitized, then passed to a provider-neutral transaction processor. Unique provider event IDs make replays harmless. Amount/currency mismatches are persisted as failed events; late or backward state changes are persisted as ignored. A verified capture consumes reserved and on-hand stock once and moves the order to paid. A verified failure/cancellation releases reserved stock once. The browser simulator can request a fake outcome only when `ENABLE_FAKE_PAYMENTS=true`, but it cannot directly update payment or order state. The same processor will later serve Stripe, PayPal, NBG, and Worldline adapters.

All expiry decisions are compared inside MySQL using the database session clock rather than comparing parsed database dates with the browser/server operating-system clock. The MySQL client also parses timestamps as UTC. This avoids WAMP/Windows timezone drift affecting reservations or sessions.

## 7. Storefront experience

Greek (`el`) is the default locale for new or invalid-locale sessions; English (`en`) is the secondary selectable locale. The HTTP-only `rusee_locale` cookie remains authoritative for server rendering, document language, and locale-aware metadata. New and substantially edited surfaces use typed locale copy rather than relying on DOM substring replacement.

### Brand direction

- Editorial fashion composition inspired by the reference site's pacing, not copied layout or assets.
- Warm paper/ink neutrals with one disciplined seasonal accent.
- Local Bricolage Grotesque is paired with distributable Cormorant Garamond, a high-contrast Karena-like editorial serif. Licensed Karena files can replace the serif source later without changing component APIs.
- Large art-directed imagery, asymmetric grids, quiet whitespace, tactile crop/reveal transitions, and detailed material storytelling.

### Animation ownership

- CSS: hover/focus, colour, underline, and small disclosure transitions.
- Motion: cart drawer, variant selection feedback, accordions, shared-layout transitions.
- GSAP: hero reveals, editorial scroll sequences, image masks, and optional page curtains.
- Lenis: storefront/editorial routes only. Disable it for checkout, payment status, and admin.

Adapt the reference project's scoped GSAP setup, exact image-stack preloader rhythm, timing constants, SplitText masking, cleanup, ScrollTrigger refresh, hover lettering, photographer six-block page transition, and shared parallax media with cubic-bezier hover zoom, with reduced-motion and timeout fallbacks.

Protected admin navigation owns a separate compact six-panel transition scoped by `[data-admin-shell]`. The public provider must ignore that shell. The admin controller may intercept only unmodified same-origin `/admin` anchor navigation; forms, downloads, new tabs, external links, hash-only changes and explicit bypass links remain native. Query strings are preserved, reduced-motion navigation is immediate, and a recovery timeout prevents a failed route from leaving the interface covered.

### Performance/accessibility budgets

- Server-render core catalogue content and minimize client component islands.
- Use responsive `next/image` sizes and modern formats.
- Lazy-load below-fold editorial animation.
- Avoid layout shift from fonts and media.
- Maintain WCAG-aware contrast, keyboard navigation, focus visibility, semantic labels, and reduced-motion parity.
- Checkout must remain usable without smooth scroll or animation JavaScript.

## 8. Admin panel

Adapt the reference panel's editorial navigation and server-action-oriented forms, but use MySQL services and robust authentication.

Initial routes:

- `/admin`: sign in.
- `/admin/overview`: sales, pending orders, low stock, payment issues.
- `/admin/products`: parent product and editorial fields.
- `/admin/variants`: design/colour/size/SKU/price/availability.
- `/admin/inventory`: stock and movement history.
- `/admin/orders`: search, status, fulfilment, customer/order details.
- `/admin/payments`: attempts, verified events, refunds, reconciliation flags.
- `/admin/content`: homepage/editorial content after core launch.
- `/admin/settings`: shipping and safe non-secret store settings.
- `/admin/system`: database/provider readiness without exposing secrets.

All mutations require authentication, authorization, validation, audit recording, and cache revalidation. Admin views must paginate and query MySQL rather than loading all records into memory.

Inventory adjustments are restricted to owner/manager roles. Each adjustment locks the inventory row, rejects reductions below reserved stock, updates on-hand quantity, and appends both an inventory movement and admin audit event in one transaction. Admin order detail reads immutable snapshots and sanitized payment records; provider payloads and secrets are never rendered.

Catalogue edits follow the same owner/manager boundary and transactionally record safe before/after audit metadata. Stable slugs, option codes, and SKUs are intentionally read-only in the initial editor. Payment reconciliation is read-only and derives operational flags from payment, order, and event metadata; it never renders stored webhook payloads.

Catalogue creation is also owner/manager-only. Creating a sellable variant inserts the variant, inventory row, initial seed movement, and admin audit record in one transaction. Reconciliation reviews require an investigation note and append an audit record; acknowledging a discrepancy never mutates payment or order state.

Catalogue media management accepts only local `/images/...` references, requires descriptive alt text, and permits design/colour scoping. Owner/manager/fulfilment roles may advance paid orders through the explicit fulfilment sequence with a required note. Owner/manager roles may create amount-capped refund requests, but these remain `pending` until a provider adapter executes and verifies the refund; an admin form cannot directly claim that funds were returned.

Verified captures enqueue customer and optional studio notifications in the same database transaction as payment/order confirmation. `email_deliveries.idempotency_key` makes provider replays harmless. SMTP dispatch claims queued rows, records attempts and provider message IDs, and leaves failures for an explicit capped admin retry. The transport uses standard authenticated SMTP so it can run against Papaki's Linux-hosted mail service without a proprietary mail SDK; see `DEPLOYMENT_PAPAKI.md`.

Email-template test delivery is an owner/manager-only queue operation. It requires an explicitly entered recipient and confirmation, renders one selected immutable system-template version with synthetic sample values, and stores the resulting snapshots without an order or enquiry relationship. The server action creates the delivery and its durable `email_dispatch` job transactionally; SMTP remains exclusively owned by the private worker. The audit record stores only template/version, locale and request identity—not the recipient or rendered content.

For ordinary transactional delivery, an explicitly active system-template version is resolved by its fixed key. Placeholder names are revalidated, dynamic values are HTML-escaped separately from plain text, and executable markup is rejected. Subject, text, HTML and the chosen version are snapshotted before transport so retries cannot pick up later edits. Missing or invalid active templates fall back to the reviewed code renderer; activation never occurs automatically.

Template history is immutable and visible only to owner/manager roles. Activation locks the parent template, rejects archived or foreign versions, and changes only the active-version pointer in the same transaction as a metadata-only audit event. Selecting the already-active version is a no-op. Rollback affects future unsnapshotted deliveries only; queued or attempted deliveries retain their original snapshots.

SMTP delivery has one owner: the private automation worker. Email Ledger actions never open a transport. Manual dispatch creates one bucketed durable `email_dispatch` job, while retry locks an eligible failed delivery, resets it to queued without incrementing attempts, and creates an idempotent worker job in the same transaction. The worker alone claims the message, increments its attempt count and records transport results.

An email claim uses `status='sending'` and `updated_at` as its delivery lease. Before processing, the worker requeues leases older than fifteen minutes only when attempts remain and marks exhausted leases failed. Fresh leases are never touched. Transport failures use the same credential and connection-string redaction policy as automation failures, keeping operational diagnostics useful without persisting secrets.

The protected Email Ledger is the operational view of that lifecycle. Its totals come from grouped MySQL state rather than browser-derived counts, while the selected status only scopes the latest ledger rows. The page sanitizes stored failure text again at render time so historic records cannot expose credential-shaped data. Filters are read-only; dispatch and retry controls create durable automation jobs and never own SMTP delivery.

Email reconciliation is a separate read-only completeness check. It reports paid orders without a payment-confirmation delivery, shipments without a fulfilment-update delivery, and reviewed return states without the exact idempotent return-status delivery. It does not infer that an email was received, create replacement communication, mutate commerce state or call SMTP; it only exposes missing durable records for investigation.

Repair remains a separate, explicit owner/manager action. The administrator must confirm one reported gap; the server then locks and revalidates the authoritative paid, shipment or reviewed-return state before inserting the standard idempotent delivery key. A successful insert creates one durable worker job and one metadata-only audit event in the same transaction. Races and repeated requests become no-ops, while SMTP delivery remains exclusively worker-owned.

The protected health page derives worker freshness from durable job timestamps and backlog state. Timestamp ages are calculated by MySQL, which owns those timestamps, avoiding Node/MySQL timezone interpretation differences between WAMP and Plesk. It distinguishes recent completion, ageing due work, failed jobs, stale locks and a worker that has never completed a job. This is diagnostic evidence only: the browser cannot execute cron and the interface never renders the private worker URL, authorization secret or job payload. Production readiness still requires an operator-confirmed Plesk schedule and a real recent completion timestamp.

The protected admin guide follows the same five-group information architecture as the main navigation. It is static reviewed application copy rather than database-controlled policy, uses a small Client Component only for accessible accordion state, presents Greek first with English summaries, and links back to authoritative operational screens. Questions use uppercase interface styling; answers explicitly reset to normal case. The guide explains safeguards but never replaces provider documentation, legal/accounting approval or technical incident review.

Search indexing has a second, route-level privacy boundary in addition to `robots.txt`. Layout metadata marks all admin, cart, order-status and payment descendants as noindex/nofollow/noarchive/nosnippet/noimageindex, while checkout declares the same boundary on its server page. This protects direct URLs discovered outside the sitemap; it is not an authentication mechanism and does not replace high-entropy public order identifiers or admin authorization.

The verified-capture transaction also creates exactly one `verified_sale` admin notification and one immediate durable `email_dispatch` automation job. Their unique keys are derived from the internal order ID, so duplicate provider events and replays cannot fan out a second sale. The browser return route never invokes this fan-out. Unknown references, amount/currency mismatches, expired reservations and verified failures create idempotent owner/manager attention records instead; they never create sale communication. A missing internal email recipient must remain visible in production readiness and must never roll back an otherwise valid captured payment.

Fulfilment transitions enqueue a status-specific customer message in the same transaction as the order update, status event and audit record. The admin mutation does not synchronously drain the shared SMTP queue; the established email manager or scheduled dispatcher owns delivery, so SMTP availability cannot make a committed transition appear to fail. Public `/api/health/live` and `/api/health/ready` responses expose only coarse state; authenticated `/admin/health` shows database, SMTP, payment-mode and canonical-HTTPS diagnostics. A production instance is deliberately not ready while fake payments, incomplete SMTP or a non-HTTPS canonical URL remain configured.

Durable background work is recorded in `automation_jobs`. Plesk calls `POST /api/automations/run` with a separate Bearer secret of at least 32 characters; the public response never exposes configuration or payloads. Every job has an idempotency key, due time, bounded attempt count and conditional `processing` claim. Concurrent workers therefore cannot own the same row. Failed work returns through exponential backoff, abandoned locks are recovered after fifteen minutes, exhausted work remains visible for owner/manager review, and manual retry/cancellation is audited. The initial allowlist contains only transactional email dispatch, operational notification synchronization and expired stock-reservation release. Marketing and abandoned-cart jobs are intentionally unsupported.

The route-level `PageEntrance` reuses the reference GSAP SplitText implementation for masked line entrances and applies restrained staggered opacity/rise motion to operational tables, forms and cards. Elements already using the explicit SplitText component are excluded to avoid double splitting, and reduced-motion preference disables entrance transforms. Production output is standalone for cPanel/Passenger compatibility, with application-wide response security headers and JSON logging that redacts secret-shaped keys.

The cPanel health monitor polls only the coarse readiness endpoint and can send a minimal webhook alert. Alert cooldown state is written as a system audit event so cron invocations do not repeatedly notify during the same incident. No dependency detail, credential or customer data leaves the application through this monitor.

Authenticated System status deliberately separates technical health from launch authorization. Seven non-secret, false-by-default Plesk flags record evidence supplied by the responsible hosting, domain, accounting, legal, production, courier and payment-provider owners. These declarations never appear in public health responses and cannot deploy, send messages, execute payments or override a technical readiness failure.

Customer-information content uses seven fixed slugs in `store_information_pages`; arbitrary admin-created routes are not supported. Owners/managers may save plain-text paired Greek/English sections and explicitly choose draft or published status. Updates are transactional and metadata-audited without copying full legal/customer-facing text into the audit ledger. Public routes use a published, structurally valid bilingual record only; missing tables, drafts, malformed JSON and empty publications fall back to the reviewed code copy, so a migration or incomplete edit cannot blank a legal/service page. Publication changes wording only and cannot configure a courier, payment provider, VAT calculation or launch approval.

Authenticated information previews read the same stored record without requiring publication and expose an explicit Greek/English switch. They report structural completeness separately from legal, accounting, courier and provider approval. Preview routes are read-only, remain inside the protected admin layout, and do not alter the public fallback or publication state.

Terms, privacy, returns and cookies include bilingual code-owned starter drafts. `ADD_YOUR_…` markers deliberately identify missing merchant, legal, courier, payment or retention facts. Empty admin drafts may start from those sections, but they never become database content or public authority until an owner/manager saves, reviews both languages and explicitly publishes them. Launch approval remains a separate Plesk declaration after professional/client review.

Information publication has no generic status selector. Draft saving, publication/live updates and withdrawal are distinct server-validated intents; public-state changes require explicit confirmation. The locked database row determines the prior state, preventing a stale or forged form from silently downgrading published content. Audit actions distinguish draft saves, first publication, published-copy updates and withdrawal while storing only status and section count.

The protected System activity log is restricted to owner/manager roles and queries `admin_audit_events` with bounded server-side pagination and fixed action-prefix filters. It selects only event identity, action, entity reference, timestamp and administrator name. Raw metadata, provider payloads, customer messages and secret-shaped fields are never selected for or rendered by this screen.

Routine admin-team management is owner-only. The panel can create manager, fulfilment and viewer accounts, reset their passwords, and activate/deactivate them; owner creation, owner password reset and owner state changes remain bootstrap-level operations. Password resets and deactivation delete all target sessions in the same transaction. Team reads never select password hashes or session tokens, and audit metadata records only username, role, state and revocation outcome.

The admin Overview is a Greek-first daily action centre. It aggregates bounded counts for enquiries, email state, low stock, pending refunds, payment reconciliation, information drafts and false-by-default launch approvals, then links to the owning workflow. Operational work is kept separate from external approvals. Aggregate queries never select message bodies, provider payloads, audit metadata or credentials.

The pre-provider release-candidate gate is a consolidated local verification workflow, not deployment or launch approval. It reuses read-only database verifiers, redacted readiness output, intercepted customer journeys and authenticated owner screens; only the established local ephemeral admin is created and automatically removed. A passing gate does not resolve VAT, courier, legal, product-data, DNS, hosting or payment-provider approvals.

The local performance gate builds into `.next-performance` and serves only on port 3108. It records bounded desktop/mobile navigation, paint, layout-shift and transferred-resource evidence for representative public and operational routes. These measurements are regression controls only: they do not claim Papaki network/runtime performance, real-device Core Web Vitals, assistive-technology approval or field-user experience.

The visual-acceptance gate captures fixed Greek/English desktop/mobile views only after locale hydration, route readiness, preloader dismissal and overflow checks. Admin evidence uses the production-refusing ephemeral local owner and automatic cleanup. PNG capture completeness is automated evidence, while aesthetic approval, content approval and physical-device review remain human responsibilities.

Checkout waits for client cart restoration and then revalidates each saved variant against the server before exposing delivery fields. Canonical product, price and availability data replace stale browser snapshots; unavailable validation produces a safe retry state without deleting the bag. One client-generated public UUID remains stable across recoverable order/payment-start retries, allowing the server's existing idempotency boundary to return the same pending order instead of creating duplicates. The bag is cleared only after a hosted-payment redirect URL is successfully obtained.

Catalogue readiness is a read-only structural report over designs, variants, inventory and size-scoped bilingual media. It emits bounded issue codes and direct editor links, never customer/order data or stored secrets. A structurally complete design is not described as client-approved: sample-derived composition, measurements, opacity, care and other garment claims remain external evidence until explicitly supplied.

Product-fact approval is stored separately in `design_fact_approvals`, with one unique pending/approved state for each design and fixed category. Missing rows resolve to pending. Only owners/managers may explicitly approve or return a category to pending; the transaction records the actor/time and a metadata-only audit event. Approval never changes product copy, media, price, stock or publication state and never stores client correspondence or evidence payloads.

Courier-neutral dispatch uses one `shipments` row per order. Advancing processing to shipped requires a carrier name and tracking code, accepts only an optional HTTPS tracking URL, and creates the shipment inside the same transaction as the order transition, status event, redacted audit event and queued fulfilment email. It does not call a courier API, buy labels, calculate delivery charges or claim delivery times. Customer tracking is exposed only through the high-entropy public order UUID.

Customer return intake is attached to the high-entropy public order UUID but also requires a matching order email. Only paid orders at shipped/delivered/returned stages can create the single idempotent request. Admin review follows bounded transitions with required internal notes and metadata-only auditing. Approval or receipt never changes payment state, creates a refund, promises legal eligibility or substitutes for the separately verified provider refund workflow.

Return communication uses dedicated idempotent email-delivery keys. A new request queues a studio notification only when an operational recipient is configured; each valid review state queues one customer update. These messages explicitly avoid claiming a refund. SMTP dispatch remains asynchronous and cannot roll back a committed request or review transition.

Customer transactional emails present Greek first and English second while retaining identifiers verbatim. Order links use the validated `APP_URL` origin and the order public UUID; a production email never emits a non-HTTPS status link. Rendering escapes all dynamic HTML and never includes internal numeric IDs, credentials or provider payloads.

The shared editorial typography scale caps display `h1`/`h2`/`h3` sizes with responsive clamps, with narrower dedicated scales for public navigation, text-image statements and the footer wordmark. Eyebrows and previously sub-10px metadata use a readable responsive minimum. Existing split/reveal timelines continue to animate the same elements and respect reduced motion.

The homepage testimonial stack adapts the reference interaction without adding its carousel dependency. React owns selection/autoplay while GSAP owns portrait clip-path, quote-line and metadata entrances plus the card's pointer-drag transform. Horizontal mouse, touch and pen gestures work at every viewport while `touch-action: pan-y` preserves vertical page scrolling; controls remain keyboard operable. Interaction pauses on hover/focus/drag and reduced motion disables autoplay and entrance transforms. Testimonial records live in `src/data/testimonials.ts`; current records are covered by a section-level placeholder disclosure and must be replaced with explicitly approved genuine quotes before publication.

The product configurator owns design, colour and size selection as one client boundary so the selected inventory variant and centre-out image transition cannot drift apart. Homepage carousel links carry stable design/colour slugs into server-resolved shop search parameters. The admin navigation reuses the reference menu panel animation while retaining role-protected server layouts. The public footer remains outside the raised application content as a sticky bottom layer revealed by the reference clip-path timeline.

The Shop begins with a reference-led editorial hero followed by a 15-card design index using paired assets from `public/webp`. The styled-on-body secondary image reveals from right to left with a clip-path transition. Cards resolve stable design and colour slugs into `/shop/[slug]`; the index route contains no purchase configurator. The grid is three columns on large displays, two on tablet and one on mobile.

Each product route renders three vertically flowing images beside a sticky purchase panel. Below that composition, scroll-triggered Reveal blocks present manufacturer, composition, care, and provenance data. Display headings and SplitText masks reserve accent-safe vertical space globally so the `è` in `Ruseè` remains visible. Route-level GSAP orchestration never passes empty target arrays to GSAP, preventing target-not-found warnings on pages without eligible entrance elements.

The purchase panel exposes semantic fieldsets, pressed states, keyboard-visible focus, an announced cart result, and disables size combinations that do not exist for the selected design and colour. Its bilingual size guide explains fit and measuring method without inventing numerical garment measurements; final numbers remain blocked on the approved production sample. Shop routes provide localized empty, missing and recoverable-error states without exposing database details.

SEO uses the native Next.js Metadata API with `APP_URL` as the validated canonical origin and a non-indexable local fallback. Canonicals omit colour-selection query parameters. Sitemap product entries include active designs only and degrade to static public routes if MySQL is unavailable. Robots disallow all non-production environments and exclude admin, API, cart, checkout, order and payment routes in production. Product JSON-LD is derived from stored catalogue prices, currency, SKUs, images and current stock only; ratings, reviews, GTINs and unconfirmed business facts are intentionally absent.

Playwright browser contracts run against Chromium, Firefox, WebKit and a reduced-motion mobile profile. Cart and checkout requests are intercepted with isolated `.invalid` data so browser verification cannot create orders, send email, start payments, run retention or mutate existing reservations. Real server-side price, reservation and payment-event invariants remain covered separately by MySQL integration tests. Automated axe checks fail on serious or critical WCAG A/AA findings; real Safari hardware, screen-reader sessions and performance profiling remain explicit manual launch gates.

The route transition resets both Lenis and native scroll while its curtain fully covers the outgoing route, before `router.push`. This prevents the persistent sticky footer from appearing for a frame at the previous route's scroll position. Public pages share a consent banner that records either full consent or essential-only preference locally; optional analytics remain disabled unless separately configured behind that consent. `/privacy-policy` and `/cookies` use the same editorial GSAP reveal system and are linked from the footer. Their launch copy remains subject to final Greek/EU legal review and completion of the merchant's registered controller details.

As a rendering guarantee, `[data-site-footer]` is hidden whenever `data-route-ready="false"`; a layout effect also resets Lenis and native scroll synchronously when the destination pathname mounts. The footer cannot become visible again until the covered transition completes. Shop-card alternate imagery uses opacity and a small GPU-composited scale rather than per-card clip paths. `/terms` and `/returns` reuse the shared LegalPage composition so approved launch copy can replace section text without rebuilding the layout.

`ReactLenis` remains mounted at the provider root across public and operational route changes, preventing provider remounts from replaying the preloader. The preloader is enabled only for an initial public storefront render; checkout, payment, order and admin entries dispatch readiness without mounting loader visuals. Native scrollbar chrome is hidden cross-browser while scrolling remains available through Lenis, keyboard and touch input.

Locale selection follows the server-cookie design used by the Grecian Spices reference: `/api/locale` validates `en` or `el`, writes an HTTP-only SameSite cookie and safely redirects to the current path. The root layout resolves that cookie and supplies the matching dictionary through `LocaleProvider`. Public, commerce, legal, payment and admin surfaces all consume the shared localization system. Hosted checkout continues to redirect to the URL returned by the configured provider adapter, allowing an NBG or Eurobank hosted page to replace the fake provider without changing the checkout form.

Greek localization now includes a centralized DOM translation layer in addition to the typed navigation dictionary. It translates text nodes, dynamic status output, newly mounted drawers/modals, placeholders, titles and accessibility labels, allowing server-rendered admin/database content and client-rendered commerce feedback to share one glossary. A MutationObserver handles content mounted after hydration. Under `html[lang="el"]`, display typography uses Times New Roman; the sans-serif body/interface stack remains unchanged. Product and brand identifiers may retain their registered spelling where appropriate.

Admin authentication uses salted Node `scrypt` hashes peppered with `ADMIN_SESSION_SECRET`. The browser receives a random opaque, HTTP-only, SameSite-strict token scoped to `/admin`; MySQL stores only its secret-bound SHA-256 hash. Sessions expire after eight hours, are replaced on login, can be revoked immediately, and are resolved with the active admin role at every protected server boundary. Five failed attempts for one username within 15 minutes trigger a temporary database-backed throttle.

The admin sign-in keeps native username/current-password autofill semantics while using larger responsive input typography and an intentionally larger password mask. Its desktop editorial image is decorative, covered by a 65% dark overlay and revealed by one scoped GSAP clip-path tween; the ink background remains visible before reveal and reduced motion displays the completed state immediately. Admin destructive language follows `ADMIN_ACTION_SAFETY.md`: commerce ledgers are never hard-deleted, historically referenced records are archived, and notification clearing will affect notification state only.

Transactional email templates use stable system keys and immutable numbered versions. Draft database content cannot replace the reviewed code fallback; a later explicit publication workflow selects the active version. Placeholders are checked against a per-template allowlist. Each delivery captures the exact subject, plain text and HTML on its first attempt and reuses that snapshot for retries, so later template edits cannot rewrite delivery history.

The protected email-template workspace is limited to owner and manager roles. Editing always creates a new version; activation requires an explicit action, required system templates cannot be archived, and HTML preview is rendered in a sandboxed frame. Duplication produces a separate custom draft rather than mutating the source template or its historical versions.

Admin attention is stored separately from the operational records that produce it. `admin_notifications` uses stable deduplication keys and sanitized entity references; `admin_notification_states` stores read/archive state independently for each administrator. Role-filtered summaries may link to the underlying order, payment, email, inventory, return or enquiry screen, but never include provider payloads, customer message bodies or secrets. Archiving a notification cannot delete or mutate its source record.

## 9. Environment configuration

The current `.env` has a structurally valid MySQL URL pointing to `localhost:3306/next_kimono`. Secret values were not copied into this document.

Use purpose-specific keys:

```text
DATABASE_URL
ADMIN_BOOTSTRAP_USERNAME       temporary setup only
ADMIN_BOOTSTRAP_PASSWORD       temporary setup only
ADMIN_SESSION_SECRET
APP_URL
PAYMENTS_DEFAULT_PROVIDER
STRIPE_SECRET_KEY              when enabled
STRIPE_WEBHOOK_SECRET          when enabled
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
PAYPAL_CLIENT_ID               when enabled
PAYPAL_CLIENT_SECRET           when enabled
NBG_*                          after bank onboarding
WORLDLINE_*                    after bank onboarding
```

Generic `USERNAME` and `PASSWORD` keys should be replaced before authentication code is implemented. Environment validation must fail fast on missing/invalid required values and must never print secrets.

## 10. Operational requirements

- Automated MySQL backups and tested restoration before live payments.
- Papaki JetBackup/Plesk is the primary scheduled backup and point-in-time restore owner for MySQL and website files. The custom timestamped SQL/media rehearsal remains an optional diagnostic tool, not a duplicate production scheduler.
- Papaki/Plesk and JetBackup exclusively execute release, file and database rollback. The application exposes only an explicit `MAINTENANCE_MODE` traffic gate: it returns a non-cacheable 503 holding page for new storefront/cart/checkout requests while preserving admin access, health/API callbacks and existing order/payment routes. It never restores, deletes, migrates or rewinds data.
- Privacy retention runs as a private Plesk Scheduled Task invoking the Node worker directly. Automatic application requires both `--apply` and `PRIVACY_RETENTION_ENABLED=true`; the admin exposes status/history but no public cron endpoint.
- Public contact submissions are validated server-side, payload-limited, idempotent, honeypot/timing guarded, and rate-limited without retaining raw client IP addresses.
- Contact enquiry persistence and studio-notification queue creation share one transaction. SMTP delivery happens only after commit, so an unavailable mailbox cannot lose the enquiry.
- HTTPS and stable public webhook URLs in production.
- Provider sandbox credentials isolated from production credentials.
- Structured logs with secret and personal-data redaction.
- Health checks for application/database readiness, never credential disclosure.
- Payment/order reconciliation view for provider/database disagreements.
- Privacy, retention, returns/refunds, shipping, tax/VAT, terms, and cookie requirements reviewed with the appropriate Greek professionals before launch.

## 11. Explicit non-goals for the first release

- Multi-vendor marketplace behavior.
- Customer accounts as a checkout requirement.
- Storing payment-card data.
- Complex CMS or page builder.
- ERP, courier, invoicing, or loyalty integrations before the core order lifecycle is verified.
- Animation that delays payment or admin work.
