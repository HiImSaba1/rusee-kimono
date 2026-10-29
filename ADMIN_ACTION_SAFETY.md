# Ruseè Admin Action Safety

Admin icons and labels must communicate what the server actually does. Visual convenience never overrides commerce history or role checks.

## Standard actions

| Action | Meaning | Appropriate records |
| --- | --- | --- |
| View | Read details without mutation | All records |
| Edit | Change a mutable draft or current operational field | Product drafts, information drafts, template drafts |
| Retry | Requeue one eligible failed operation with the established attempt limit | Failed email or automation job |
| Resolve / review | Record an audited investigation or workflow transition | Reconciliation, enquiries, returns |
| Archive | Remove an inactive record from routine views while preserving history | Products or templates that may be referenced historically |
| Trash | Remove a recoverable or genuinely disposable item after confirmation | Unused draft media assignment, unsaved list item, dismissible notification |

## Never expose permanent deletion for

- orders, order items, addresses or status events;
- payments, provider events, refunds or reconciliation history;
- inventory movements;
- email-delivery history or rendered historical snapshots;
- admin audit events;
- published or historically used email-template versions.

## Confirmation contract

- Icon-only controls require an accessible name and tooltip/title.
- A first confirmation names the exact target and consequence.
- High-impact archive/removal requires a second explicit confirmation or typed confirmation when the action affects connected records.
- The server action repeats authorization and eligibility checks; browser confirmation is never the security boundary.
- Every material action writes redacted audit metadata without secrets, raw provider payloads or password/session data.

Clearing a notification means marking it read or archived. It never deletes or resolves the underlying order, payment, email, stock or return condition.
