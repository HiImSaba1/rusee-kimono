# Admin demo walkthrough

The ten `DEMO-*` orders use `.invalid` email addresses and fake provider records. They never send mail or charge a payment method.

Open `/admin/overview`, then `/admin/orders`. Search `DEMO-` and inspect:

1. `DEMO-001` — pending payment and active reservation.
2. `DEMO-002` — captured payment, awaiting fulfilment.
3. `DEMO-003` — processing workflow.
4. `DEMO-004` — shipped order.
5. `DEMO-005` — delivered order with a discount.
6. `DEMO-006` — cancelled order and released reservation.
7. `DEMO-007` — failed provider attempt and failed email example.
8. `DEMO-008` — partial refund.
9. `DEMO-009` — returned product and completed full refund.
10. `DEMO-010` — returned product with refund still pending.

Then visit Payments, Payment checks, Email and Order workflow. Records are deliberately labelled `DEMO` and may be regenerated safely; the seed resets only `DEMO-*`, `demo:*`, and `@rusee.invalid` demo records.
