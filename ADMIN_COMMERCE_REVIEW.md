# Ruseè Admin Commerce Review

Review date: 2026-10-29

## Outcome

The provider-independent Admin commerce workflow is organized as Sprint 08AX. It gives staff one consolidated order view and strengthens the server-side fulfilment boundary. It does not enable live checkout, execute refunds, contact a provider, send SMTP directly, deploy, or change production data.

Public checkout remains blocked until Sprint 09 implements one contracted provider from its current official documentation and passes sandbox plus controlled live payment/refund evidence.

## Existing controls retained

- Browser success pages cannot mark an order paid.
- Verified provider events are idempotent and compare reference, amount and currency.
- Captured payment consumes reserved stock transactionally.
- Failed or cancelled payment releases reservations.
- Admin actions use server-side roles, row locks, audit records and state transitions.
- Transactional communication is persisted before the private worker delivers it.
- Raw webhook payloads, signatures, credentials and authorization headers are not shown in Admin.
- Return approval is separate from provider refund execution.

## Sprint 08AX corrections

- Order filters: attention, verified-ready, processing, shipped and active returns.
- Consolidated order detail: immutable lines, receipt/invoice snapshot, payment attempts, sanitized provider events, shipment, return, refund and email ledgers.
- Explicit `Verified / Review / Do not ship` evidence on order detail and workflow.
- Locked fulfilment action now requires exactly one captured payment matching total and currency.
- Direct `delivered -> returned` fulfilment action removed.
- A received return request is the only Admin workflow that records physical return receipt.
- Return forms now offer only transitions accepted by the state machine and expose prior review notes.
- Viewer roles no longer see mutation forms; restricted navigation links are role-filtered.
- Failed and unmatched provider events are visible in reconciliation with metadata-only investigation notes.
- Audit categories include return-request and provider-event reviews.
- Invalid `requires_action` notification status removed because it is not part of the payment schema.

## Still blocked on the contracted provider

- Hosted checkout creation and provider credential handling.
- Provider-specific signed webhook endpoint.
- Server-to-server payment status refresh.
- Provider refund execution and refund confirmation events.
- Settlement/bank reconciliation references.
- Sandbox fixtures for success, decline, cancellation, timeout, replay, mismatch and refund.
- Controlled low-value live payment and refund.

No manual `Mark paid` action should be added.

## Business and owner decisions still required

- Contracted provider selection and agreement.
- Approved shipping/courier procedure and whether partial shipments are required. Current schema supports one shipment per order.
- Approved return policy and whether partial item-level returns are required. Current schema supports one return request per order.
- Greek accountant confirmation of receipt/invoice, VAT and fiscal-document procedure. Admin displays the stored invoice request but does not issue a fiscal document.
- Whether MFA/passkeys are required for owner and manager accounts. Current authentication uses strong password hashing, bounded login attempts, strict secure sessions and role separation, but no second factor.
- Production monitoring destination and escalation owner.

## Release boundary

Sprint 08AX must pass `scripts/sprint-08ax.ps1`. A passing gate proves static, unit, integration and build contracts only. Browser acceptance, GitHub push, TAR creation, SSH activation, production migration, restart and live smoke checks remain separate owner-run phases.
