import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/session";
import { fulfilmentEligibility, fulfilmentTransitions, safeStatusLabel } from "@/features/admin/order-operations";
import { listOrderOperations } from "@/features/admin/queries";
import { advanceFulfilment, requestRefund } from "./actions";

const button = "border border-ink/30 px-4 py-2 text-[0.68rem] uppercase tracking-[0.13em] transition-colors hover:bg-ink hover:text-paper";
const field = "mt-2 block w-full border-b border-ink/25 bg-transparent py-2 text-sm normal-case tracking-normal";
const money = (minor: number, currency: string) => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minor / 100);

export default async function OrderOperationsPage() {
  const [admin, orders] = await Promise.all([requireAdmin(), listOrderOperations()]);
  const canFulfil = admin.role === "owner" || admin.role === "manager" || admin.role === "fulfilment";
  const canRefund = admin.role === "owner" || admin.role === "manager";
  return <main className="px-[var(--gutter)] py-12">
    <p className="eyebrow">Ροή παραγγελιών / Order workflow</p>
    <h1 className="mt-3 font-display text-[clamp(4rem,8vw,8rem)] leading-[0.82] tracking-[-0.06em]">Εκτέλεση.</h1>
    <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink/70">Μόνο παραγγελίες με μία captured πληρωμή ίδιου ποσού και νομίσματος μπορούν να προχωρήσουν. Η παραλαβή επιστροφής γίνεται αποκλειστικά από τη ροή αιτημάτων επιστροφής.</p>
    <div className="mt-12 space-y-6">{orders.map((order) => {
      const eligibility = fulfilmentEligibility({ orderPaymentStatus: order.payment_status, matchingCapturedPayments: Number(order.matching_captured_payments), failedPaymentEvents: Number(order.failed_payment_events) });
      const next = fulfilmentTransitions[order.fulfilment_status];
      return <article key={order.id} className="grid gap-6 border-t border-ink/20 py-7 xl:grid-cols-[1fr_1.1fr_1fr]">
        <div>
          <Link href={`/admin/orders/${order.public_id}`} className="font-display text-3xl underline underline-offset-4">{order.order_number}</Link>
          <p className="mt-2 text-sm">{order.email}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.1em]">{safeStatusLabel(order.status)} · {safeStatusLabel(order.payment_status)} · {safeStatusLabel(order.fulfilment_status)}</p>
          <p className="mt-3 text-lg">{money(order.total_minor, order.currency)}</p>
          {order.tracking_code && <p className="mt-3 text-xs leading-relaxed text-ink/65">{order.carrier_name} · {order.tracking_code}{order.tracking_url ? <><br/><a href={order.tracking_url} target="_blank" rel="noreferrer" className="underline underline-offset-4">Ασφαλές tracking ↗</a></> : null}</p>}
        </div>
        <div>
          <div data-safety-state={eligibility.state} className={`p-4 ${eligibility.state === "verified" ? "bg-emerald-100" : eligibility.state === "review" ? "bg-amber-100" : "bg-red-100"}`}>
            <strong className="text-sm">{eligibility.labelEl}<span className="mt-1 block text-xs font-normal">{eligibility.labelEn}</span></strong>
            <p className="mt-3 text-xs leading-relaxed">{eligibility.detailEl}<br/>{eligibility.detailEn}</p>
          </div>
          {canFulfil && eligibility.eligible && next && <form action={advanceFulfilment} className="mt-5 grid gap-3">
            <input type="hidden" name="orderId" value={order.id}/>
            <label className="text-xs uppercase tracking-[0.1em]">Operational note<input required minLength={5} maxLength={300} name="note" className={field}/></label>
            {order.fulfilment_status === "processing" && <>
              <label className="text-xs uppercase tracking-[0.1em]">Courier<input required minLength={2} maxLength={120} name="carrierName" className={field}/></label>
              <label className="text-xs uppercase tracking-[0.1em]">Tracking code<input required minLength={3} maxLength={120} name="trackingCode" className={field}/></label>
              <label className="text-xs uppercase tracking-[0.1em]">HTTPS tracking link (optional)<input type="url" maxLength={500} name="trackingUrl" pattern="https://.*" className={field}/></label>
            </>}
            <button className={`${button} justify-self-start`}>{next.labelEl}<span className="ml-2 opacity-65">/ {next.labelEn}</span></button>
          </form>}
          {!canFulfil && next && <p className="mt-4 text-xs text-ink/55">Ο ρόλος σας έχει μόνο προβολή αυτής της ενέργειας.</p>}
          {order.fulfilment_status === "delivered" && <p className="mt-4 text-xs text-ink/65">Η παραγγελία έχει παραδοθεί. Τυχόν επιστροφή συνεχίζεται από <Link href="/admin/returns" className="underline underline-offset-4">Αιτήματα επιστροφής</Link>.</p>}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.1em]">Refund ledger</p>
          <p className="mt-2 text-sm">Pending/succeeded: {money(Number(order.refund_requested_minor), order.currency)}</p>
          {canRefund && order.payment_id && order.provider_status === "captured" && Number(order.refund_requested_minor) < order.total_minor && <form action={requestRefund} className="mt-5 grid gap-3">
            <input type="hidden" name="paymentId" value={order.payment_id}/>
            <label className="text-xs uppercase tracking-[0.1em]">Amount<input required name="amount" type="number" min="0.01" max={(order.total_minor - Number(order.refund_requested_minor)) / 100} step="0.01" className={field}/></label>
            <label className="text-xs uppercase tracking-[0.1em]">Reason<input required minLength={8} maxLength={300} name="reason" className={field}/></label>
            <button className={`${button} justify-self-start`}>Request provider refund</button>
          </form>}
          <p className="mt-3 text-xs leading-relaxed text-ink/55">Η ενέργεια καταγράφει pending αίτημα. Δεν επιστρέφει χρήματα μέχρι να υλοποιηθεί και να επιβεβαιωθεί ο συμβεβλημένος πάροχος.</p>
        </div>
      </article>;
    })}</div>
  </main>;
}
