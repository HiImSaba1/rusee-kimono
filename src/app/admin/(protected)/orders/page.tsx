import Link from "next/link";
import { safeStatusLabel } from "@/features/admin/order-operations";
import { listAdminOrders, type AdminOrderView } from "@/features/admin/queries";

const money = (amount: number) => new Intl.NumberFormat("en-GR", { style: "currency", currency: "EUR" }).format(amount / 100);
const views: Array<{ value:AdminOrderView; label:string }> = [
  { value:"all", label:"Όλες / All" }, { value:"attention", label:"Προσοχή / Attention" }, { value:"ready", label:"Έτοιμες / Ready" },
  { value:"processing", label:"Προετοιμασία / Processing" }, { value:"shipped", label:"Αποστολές / Shipped" }, { value:"returns", label:"Επιστροφές / Returns" },
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; view?: string }> }) {
  const params = await searchParams;
  const query = params.q ?? "";
  const view = views.some((item) => item.value === params.view) ? params.view as AdminOrderView : "all";
  const result = await listAdminOrders(Number(params.page ?? 1), query, view);
  const pages = Math.max(1, Math.ceil(result.total / result.limit));
  const pageHref = (page:number) => `/admin/orders?page=${page}&view=${view}&q=${encodeURIComponent(query)}`;
  return <main className="px-[var(--gutter)] py-12">
    <p className="eyebrow">Commerce control room</p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-6"><div><h1 className="font-display text-[clamp(4.5rem,9vw,9rem)] leading-[0.8] tracking-[-0.065em]">Orders</h1><p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/65">Φιλτράρετε την πραγματική κατάσταση της παραγγελίας χωρίς να αλλάζετε το payment ledger.</p></div><Link href="/admin/order-operations" className="border border-ink px-5 py-3 text-xs uppercase tracking-[.12em] transition-colors hover:bg-ink hover:text-paper">Open workflow</Link></div>
    <nav aria-label="Order views" className="mt-9 flex flex-wrap gap-2">{views.map((item) => <Link key={item.value} href={`/admin/orders?view=${item.value}&q=${encodeURIComponent(query)}`} aria-current={view === item.value ? "page" : undefined} className="border border-ink/25 px-4 py-2 text-xs uppercase tracking-[.1em] aria-[current=page]:bg-ink aria-[current=page]:text-paper">{item.label}</Link>)}</nav>
    <form className="mt-8 flex max-w-xl border-b border-ink/30"><input type="hidden" name="view" value={view}/><input name="q" defaultValue={query} placeholder="Order number or email" className="min-w-0 flex-1 bg-transparent py-3 outline-none"/><button className="px-4 text-xs uppercase tracking-[0.14em]">Search</button></form>
    <div role="region" aria-label="Orders table" tabIndex={0} className="mt-10 overflow-x-auto"><table className="w-full min-w-[960px] text-left text-sm"><thead className="text-[0.68rem] uppercase tracking-[0.14em] text-ink/55"><tr><th className="py-4">Order</th><th>Customer</th><th>Order state</th><th>Payment</th><th>Fulfilment</th><th>Created</th><th className="text-right">Total</th></tr></thead><tbody>{result.rows.map((order) => <tr key={order.public_id} className="border-t border-ink/10"><td className="py-4 font-mono text-xs"><Link href={`/admin/orders/${order.public_id}`} className="border-b border-ink/30 pb-1">{order.order_number}</Link></td><td>{order.email}</td><td>{safeStatusLabel(order.status)}</td><td><Status value={order.payment_status}/></td><td><Status value={order.fulfilment_status}/></td><td>{new Date(order.created_at).toLocaleDateString("en-GB")}</td><td className="text-right">{money(order.total_minor)}</td></tr>)}</tbody></table>{!result.rows.length && <p className="py-16 text-center text-ink/55">No matching orders.</p>}</div>
    <nav aria-label="Order pages" className="mt-8 flex justify-between text-xs uppercase tracking-[0.14em]"><span>{result.total} orders · Page {result.page} of {pages}</span><div className="flex gap-5">{result.page > 1 && <Link href={pageHref(result.page - 1)}>Previous</Link>}{result.page < pages && <Link href={pageHref(result.page + 1)}>Next</Link>}</div></nav>
  </main>;
}

function Status({ value }: { value:string }) { const tone = ["paid","delivered"].includes(value) ? "bg-emerald-100" : ["failed","cancelled"].includes(value) ? "bg-red-100" : ["pending","pending_payment"].includes(value) ? "bg-amber-100" : "bg-paper-deep"; return <span className={`inline-block px-2 py-1 text-xs ${tone}`}>{safeStatusLabel(value)}</span>; }
