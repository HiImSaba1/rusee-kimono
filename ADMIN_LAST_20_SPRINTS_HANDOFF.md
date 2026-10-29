# Ruseè Admin — Last 20 Sprints Brief

This brief covers Sprint 08L through Sprint 08AE, the latest twenty completed sprints. It is intended as a compact handoff for another implementation agent.

## Current admin foundation

- Protected Next.js App Router admin backed by MySQL and server-side authorization.
- Greek is the primary admin language; English is secondary through the shared locale system.
- Navigation is grouped into **Overview, Sales, Catalogue, Customers, and System**.
- Admin sessions are opaque, expiring, revocable, database-backed and role checked.
- Routine catalogue, stock, order, payment, email, customer-information and operational work does not require phpMyAdmin.
- Sensitive payment payloads, password hashes, session tokens and secrets are never rendered in admin lists or logs.
- Every material mutation records immutable, redacted audit evidence.

## Sprint-by-sprint implementation

### 08L — Operational maintenance

- Added an explicit production maintenance flag and real HTTP `503` holding page.
- Kept liveness and required operational routes available during maintenance.
- Papaki/Plesk and JetBackup remain the only production backup and rollback owners.

### 08M — Launch-approval visibility

- Expanded **System status** to separate technical readiness from seven external business/provider approvals.
- External approvals default safely to pending and cannot be inferred from passing code tests.

### 08N — Customer-information frontend

- Added the information hub and customer pages for shipping/courier, payment methods, care/fit, returns, cookies and legal information.
- Connected them to the public navigation, footer and sitemap with bilingual accessibility coverage.

### 08O — Admin-managed customer information

- Added seven fixed MySQL-backed bilingual information records.
- Owner/manager roles can edit Greek and English drafts and explicitly publish them.
- Public pages use reviewed code fallbacks unless a complete record is explicitly published.

### 08P — Information review and preview

- Added authenticated read-only draft previews.
- Added explicit Greek/English preview switching, readiness guidance and contextual admin navigation.

### 08Q — Publication and withdrawal safety

- Added explicit confirmation for publish, update and withdrawal actions.
- Added status-specific audit events, success feedback and safe fallback behavior after withdrawal.

### 08R — Redacted admin activity log

- Added an owner/manager-only audit-history viewer.
- Includes operational filters, server pagination and Greek-first action labels.
- Audit output excludes secrets, raw credentials, password hashes and session tokens.

### 08S — Optional team and roles

- Added owner-only staff creation, role explanations, password reset, activation/deactivation and session revocation.
- Every access change is audited.
- No staff account is required and verification does not create a permanent staff user.

### 08T — Daily operations action centre

- Added Greek-first attention cards to the admin overview.
- Surfaces enquiries, queued/failed email, low stock, pending refunds, reconciliation issues, information drafts and external launch approvals.

### 08U — Pre-provider release-candidate audit

- Consolidated database, catalogue, media, commerce-guard, information, launch-readiness, storefront and owner-admin checks.
- Confirmed the pre-provider application state without treating it as live-payment readiness.

### 08V — Performance and operator acceptance

- Verified ten isolated production-build desktop/mobile route budgets and the complete quality gate.
- Papaki field performance and physical-device measurements remain launch-time checks.

### 08W — Bilingual visual acceptance

- Captured Greek/English desktop/mobile storefront and temporary-owner admin evidence.
- Included the responsive three-column desktop footer and compact mobile layouts.

### 08X — Checkout resilience and customer recovery

- Added restored-cart validation, bilingual recovery states and stable retry idempotency.
- Browser verification remains isolated and cannot create real payments or customer communication.

### 08Y — Catalogue launch-readiness matrix

- Added a read-only matrix for all 15 designs with direct editor links.
- Surfaces structural catalogue/media issues in the admin overview without claiming client approval.

### 08Z — Product-fact approval ledger

- Added six approval categories per design: composition, measurements/fit, opacity, care, provenance and final imagery.
- All facts default to pending and require explicit owner/manager approval.
- Approval status is reversible and audited; evidence metadata never stores confidential client messages.

### 08AA — Courier-neutral shipment tracking

- Added one carrier/tracking record per shipped order.
- Dispatch requires carrier and tracking code; the optional tracking URL must use HTTPS.
- Shipment state, fulfilment transition, status event, audit event and queued email commit together.
- No courier pricing, SLA, label or provider API is invented.

### 08AB — Customer return intake and admin triage

- Added email-confirmed, UUID-protected customer return requests.
- Enforces eligible fulfilment stages and one idempotent request per order.
- Added a protected Greek-first admin review queue with bounded notes and audited transitions.
- Review never marks money refunded or invents legal eligibility/return windows.

### 08AC — Return communication and visibility

- Added return-request visibility to the admin overview.
- Added idempotent studio/customer email queueing for return workflow updates.
- Communication does not claim that a provider refund has completed.

### 08AD — Greek-first transactional email

- Customer order emails now present Greek first and English second.
- Uses canonical UUID order-status links and leaves identifiers unchanged.
- Dynamic HTML is escaped; production status links require a validated HTTPS application URL.

### 08AE — Responsive admin/storefront typography and testimonial QA

- Reduced oversized headings/menu links with responsive clamps and enlarged very small labels/metadata.
- Verified bilingual desktop/mobile admin and storefront visual captures.
- Added a six-item homepage testimonial stack with keyboard controls and all-screen pointer dragging; testimonial records remain unapproved placeholders and must be replaced before publication.
- Passed testimonial contracts in Chromium, Firefox, WebKit and reduced-motion mobile, plus ESLint, TypeScript, Vitest and production build.

## Existing operational admin areas

- Dashboard/overview and action centre.
- Contact enquiry inbox and idempotent studio notifications.
- Orders: paginated search, immutable item/address snapshots, reservation history, status events and sanitized payment attempts.
- Order operations: guarded fulfilment progression, shipment tracking and queued customer updates.
- Payments and reconciliation: sanitized views, mismatch detection and provider-pending refund requests.
- Catalogue: products, designs, sizes, unique size-level SKUs, bilingual details and launch-readiness matrix.
- Media: design/size image assignment, bilingual alt text, lead-image and isolation checks.
- Inventory: role-restricted adjustments with immutable movement records.
- Customer information: seven bilingual drafts, preview, publish and withdrawal workflow.
- Returns: protected triage, audited review transitions and queued communications.
- Email: idempotent transactional queue and delivery visibility.
- Privacy: customer-data search/export, guarded anonymization and retention-run history.
- System: health, launch approvals, redacted audit activity and optional staff management.

## Critical boundaries for the next agent

- MySQL is authoritative; do not introduce JSON/file persistence for commerce or admin records.
- Never trust browser totals, payment success URLs, SKUs or stock values.
- Never mark an order paid without authenticated server-side provider verification.
- Never complete a refund merely from an admin action; provider confirmation is required.
- Preserve append-only order/payment history and immutable audit events.
- Keep Greek primary and English secondary; do not translate SKUs, provider IDs, emails or the Ruseè brand.
- Prefer typed/server dictionaries when substantially editing localized pages; do not keep expanding fragile DOM substring translation.
- The user runs all PowerShell, npm, Node, Git, migration, build, test and deployment commands. The agent edits code/scripts only.
- Never inspect or print `.env` secrets.
- Papaki/Plesk/JetBackup owns production backup and rollback.

## Current readiness and remaining blockers

The admin and pre-provider commerce foundation are verified through Sprint 08AE. The next agent should not rebuild these areas. Remaining launch work is primarily external configuration and approved content:

- Replace logo, product imagery, catalogue copy and placeholder testimonials with approved material.
- Approve real composition, measurements, fit, opacity, care, provenance, pricing and stock.
- Finalize VAT, invoicing, shipping zones/rates, discounts, courier process and legal copy.
- Configure Papaki/Plesk production database, Node runtime, HTTPS, SMTP, SPF/DKIM/DMARC, cron and monitoring.
- Implement Sprint 09 only after a live payment provider is contracted and official current documentation plus sandbox/production credentials are supplied.
- Complete a controlled low-value live payment, refund and reconciliation before public launch.

## Reading order for continuation

1. `AGENTS.md`
2. `codex_agent_instructions.md`
3. This file
4. `sprints.md` current execution position
5. `TODO.md` Immediate next task
6. Only the relevant sections of `ARCHITECTURE.md`
