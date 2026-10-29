import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/session";
import { listAdminPayments } from "@/features/admin/queries";
import { paymentReconciliationIssues } from "@/features/admin/reconciliation";

const money = (minor: number, currency: string) => new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(minor / 100);

export default async function AdminPaymentsPage() {
  await requireAdmin();
  const rows = await listAdminPayments();
  const flagged = rows.filter((row) => paymentReconciliationIssues(row).length > 0).length;
  return <main className="px-[var(--gutter)] py-12">
    <p className="eyebrow">Financial operations</p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-6"><h1 className="font-display text-[clamp(4.5rem,9vw,9rem)] leading-[0.8] tracking-[-0.065em]">Payments</h1><p className="max-w-sm text-sm leading-relaxed text-ink/55">Provider events are compared with the order ledger. Raw webhook payloads and payment credentials are never shown here.</p></div>
    <div className="mt-10 grid gap-px bg-ink/15 sm:grid-cols-3"><div className="bg-paper p-6"><p className="eyebrow">Recent attempts</p><p className="mt-3 font-display text-5xl">{rows.length}</p></div><div className="bg-paper p-6"><p className="eyebrow">Needs review</p><p className="mt-3 font-display text-5xl">{flagged}</p></div><div className="bg-paper p-6"><p className="eyebrow">Captured</p><p className="mt-3 font-display text-5xl">{rows.filter((row) => row.payment_status === "captured").length}</p></div></div>
    <div className="mt-12 overflow-x-auto"><table className="w-full min-w-[1180px] text-left text-sm"><thead className="text-[0.6rem] uppercase tracking-[0.14em] text-ink/45"><tr><th className="py-4">Order</th><th>Provider</th><th>Amount</th><th>Payment</th><th>Order ledger</th><th>Events</th><th>Reconciliation</th><th>Updated</th></tr></thead><tbody>{rows.map((row) => { const issues = paymentReconciliationIssues(row); return <tr key={row.id} className={issues.length ? "border-t border-ink/10 bg-sage/30" : "border-t border-ink/10"}><td className="py-4"><Link className="underline underline-offset-4" href={`/admin/orders/${row.public_id}`}>{row.order_number}</Link></td><td className="uppercase">{row.provider}</td><td>{money(row.amount_minor, row.currency)}</td><td>{row.payment_status}</td><td>{row.order_payment_status}</td><td>{Number(row.event_count)}{Number(row.failed_event_count) > 0 ? ` (${row.failed_event_count} failed)` : ""}</td><td className={issues.length ? "font-medium" : "text-ink/45"}>{issues.length ? issues.join("; ") : "Matched"}</td><td>{new Date(row.updated_at).toLocaleString("en-GB")}</td></tr>; })}</tbody></table>{rows.length === 0 && <p className="border-t border-ink/10 py-8 text-sm text-ink/55">No payment attempts yet.</p>}</div>
  </main>;
}
