import { notFound } from "next/navigation";
import { databasePool } from "@/lib/db/connection";
import { FakePaymentControls } from "@/components/payments/FakePaymentControls";
import { privateRouteRobots } from "@/lib/seo/indexing";

export const metadata = { title: "Sandbox payment", robots: privateRouteRobots };

export default async function FakePaymentPage({ params }: { params: Promise<{ providerPaymentId: string }> }) {
  if (process.env.ENABLE_FAKE_PAYMENTS !== "true") notFound();
  const { providerPaymentId } = await params;
  const [rows] = await databasePool.execute(`SELECT p.provider_payment_id, p.amount_minor, p.currency, p.status, o.public_id, o.order_number
    FROM payments p INNER JOIN orders o ON o.id = p.order_id
    WHERE p.provider = 'fake' AND p.provider_payment_id = ? LIMIT 1`, [providerPaymentId]);
  const payment = (rows as Array<{ provider_payment_id: string; amount_minor: number; currency: string; status: string; public_id: string; order_number: string }>)[0];
  if (!payment) notFound();
  return <section className="grid min-h-[calc(100svh-5rem)] place-items-center bg-paper px-[var(--gutter)] py-16"><div className="w-full max-w-xl border border-ink/20 bg-paper-deep p-[clamp(1.5rem,5vw,4rem)]"><div className="flex items-center justify-between"><p className="eyebrow">Local sandbox</p><span className="rounded-full border border-ink/20 px-3 py-1 text-[0.58rem] uppercase tracking-[0.12em]">Not a real charge</span></div><h1 className="mt-8 font-display text-[clamp(4rem,9vw,7rem)] leading-[0.82] tracking-[-0.06em]">Complete<br /><em>the study.</em></h1><dl className="mt-10 space-y-3 border-y border-ink/15 py-5 text-sm"><div className="flex justify-between"><dt>Order</dt><dd className="font-mono text-xs">{payment.order_number}</dd></div><div className="flex justify-between"><dt>Amount</dt><dd>{new Intl.NumberFormat("en-GR", { style: "currency", currency: payment.currency }).format(payment.amount_minor / 100)}</dd></div><div className="flex justify-between"><dt>Current state</dt><dd>{payment.status}</dd></div></dl>{payment.status === "pending" ? <FakePaymentControls paymentId={payment.provider_payment_id} publicId={payment.public_id} /> : <a href={`/order/${payment.public_id}`} className="mt-10 block bg-ink px-6 py-5 text-center text-xs uppercase tracking-[0.17em] text-paper">Return to order status</a>}<p className="mt-7 text-xs leading-relaxed text-ink/45">This screen generates a server-signed fake provider event. The browser response itself never changes payment status.</p></div></section>;
}
