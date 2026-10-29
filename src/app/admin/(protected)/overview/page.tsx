import Link from "next/link";
import { MetricCard } from "@/components/admin/MetricCard";
import { attentionState } from "@/features/admin/overview-attention";
import { getAdminAttentionCounts, getAdminOverview } from "@/features/admin/queries";
import { getCatalogueReadiness } from "@/features/admin/catalogue-readiness";
import { launchApprovals } from "@/features/health/launch-approvals";

const money = (amount: number) => new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(amount / 100);
const date = (value: Date) => new Intl.DateTimeFormat("el-GR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default async function AdminOverviewPage() {
  const [{ metrics, stock, recent }, attention, catalogueReadiness] = await Promise.all([getAdminOverview(), getAdminAttentionCounts(), getCatalogueReadiness()]);
  const pendingApprovals = launchApprovals().filter((approval) => !approval.approved).length;
  const actions: Array<{ labelEl: string; labelEn: string; count: number; href: string; note: string; kind?: "external" }> = [
    { labelEl: "Νέα μηνύματα", labelEn: "New enquiries", count: Number(attention.new_enquiries), href: "/admin/enquiries", note: "Απαντήσεις πελατών που δεν έχουν ακόμη ανοιχτεί." },
    { labelEl: "Αποτυχημένα email", labelEn: "Failed emails", count: Number(attention.failed_emails), href: "/admin/email", note: `${Number(attention.queued_emails)} επιπλέον email βρίσκονται στην ουρά.` },
    { labelEl: "Χαμηλό απόθεμα", labelEn: "Low stock", count: Number(attention.low_stock), href: "/admin/inventory", note: "Παραλλαγές με δύο ή λιγότερες διαθέσιμες μονάδες." },
    { labelEl: "Εκκρεμείς επιστροφές", labelEn: "Pending refunds", count: Number(attention.pending_refunds), href: "/admin/order-operations", note: "Αιτήματα που περιμένουν εκτέλεση και επιβεβαίωση παρόχου." },
    { labelEl: "Αιτήματα επιστροφής", labelEn: "Return requests", count: Number(attention.pending_return_requests), href: "/admin/returns", note: "Αιτήματα πελατών που χρειάζονται λειτουργικό έλεγχο, όχι αυτόματη επιστροφή χρημάτων." },
    { labelEl: "Έλεγχοι πληρωμών", labelEn: "Payment checks", count: Number(attention.reconciliation_issues), href: "/admin/reconciliation", note: "Ασυμφωνίες ποσού, κατάστασης ή αποτυχημένων events." },
    { labelEl: "Πρόχειρες πληροφορίες", labelEn: "Draft information", count: Number(attention.draft_information_pages), href: "/admin/information", note: "Σελίδες που συνεχίζουν να χρησιμοποιούν το ασφαλές δημόσιο κείμενο." },
    { labelEl: "Ετοιμότητα προϊόντων", labelEn: "Product readiness", count: catalogueReadiness.filter((row) => !row.structurallyComplete || row.approvals.some((approval) => approval.status === "pending")).length, href: "/admin/catalogue-readiness", note: "Σχέδια με δομικές ελλείψεις ή εκκρεμή έγκριση στοιχείων από πελάτισσα/δείγμα." },
    { labelEl: "Εγκρίσεις launch", labelEn: "Launch approvals", count: pendingApprovals, href: "/admin/health", note: "Εξωτερικές εγκρίσεις από hosting, επιχείρηση, επαγγελματίες και παρόχους.", kind: "external" },
  ];
  const operationalTotal = actions.filter((item) => item.kind !== "external").reduce((sum, item) => sum + item.count, 0);

  return (
    <main className="px-[var(--gutter)] py-12">
      <p className="eyebrow">Καθημερινή λειτουργία / Daily operations</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6"><div><h1 className="font-display text-[clamp(4.5rem,9vw,9rem)] leading-[.8] tracking-[-.065em]">Σήμερα.</h1><p className="mt-6 max-w-xl text-sm leading-relaxed text-ink/70">{operationalTotal ? `${operationalTotal} λειτουργικά σημεία χρειάζονται έλεγχο.` : "Δεν υπάρχουν λειτουργικές εκκρεμότητες αυτή τη στιγμή."} Οι εξωτερικές εγκρίσεις εμφανίζονται χωριστά και δεν ενεργοποιούν καμία λειτουργία.</p></div><Link href="/admin/activity" className="text-xs uppercase tracking-[.14em] underline-offset-4 hover:underline">Ιστορικό ενεργειών →</Link></div>

      <section aria-labelledby="attention-title" className="mt-12"><h2 id="attention-title" className="font-display text-5xl">Τι χρειάζεται προσοχή.</h2><div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">{actions.map((item) => { const state = attentionState(item.count, item.kind); return <Link key={item.href} href={item.href} className={`group min-h-56 p-6 transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 ${state.tone === "attention" ? "bg-ink text-paper" : state.tone === "external" ? "bg-amber-100 text-ink" : "bg-paper-deep text-ink"}`}><div className="flex items-start justify-between gap-4"><span className="font-mono text-xs uppercase tracking-[.12em]">{state.labelEl}<span className="mt-1 block text-[.58rem] opacity-65">{state.labelEn}</span></span><strong className="font-display text-6xl leading-none">{item.count}</strong></div><h3 className="mt-10 text-lg font-medium">{item.labelEl}<span className="mt-1 block text-xs font-normal opacity-65">{item.labelEn}</span></h3><p className="mt-3 text-xs leading-relaxed opacity-70">{item.note}</p><span className="mt-5 block text-xs uppercase tracking-[.12em]">Άνοιγμα →</span></Link>; })}</div></section>

      <section className="mt-14 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="Παραγγελίες" value={Number(metrics?.total_orders ?? 0)} note={`${Number(metrics?.pending_orders ?? 0)} αναμένουν πληρωμή`} /><MetricCard label="Επιβεβαιωμένα έσοδα" value={money(Number(metrics?.paid_revenue_minor ?? 0))} note={`${Number(metrics?.paid_orders ?? 0)} πληρωμένες παραγγελίες`} /><MetricCard label="Δεσμευμένα" value={Number(stock?.reserved_units ?? 0)} note="Μονάδες σε ενεργά checkout" /><MetricCard label="Διαθέσιμα χαμηλού stock" value={Number(stock?.available_units ?? 0)} note="Σύνολο μονάδων στις χαμηλές παραλλαγές" /></section>

      <section className="mt-14"><div className="flex items-end justify-between border-b border-ink/20 pb-4"><div><p className="eyebrow">Πρόσφατη δραστηριότητα</p><h2 className="mt-3 font-display text-4xl">Τελευταίες παραγγελίες</h2></div><Link href="/admin/orders" className="text-xs uppercase tracking-[.14em]">Προβολή όλων</Link></div><div role="region" aria-label="Πίνακας πρόσφατων παραγγελιών" tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-[.6rem] uppercase tracking-[.14em] text-ink/70"><tr><th className="py-4">Παραγγελία</th><th>Πελάτης</th><th>Δημιουργία</th><th>Κατάσταση</th><th>Πληρωμή</th><th className="text-right">Σύνολο</th></tr></thead><tbody>{recent.map((order) => <tr key={order.order_number} className="border-t border-ink/10"><td className="py-4 font-mono text-xs"><Link href={`/admin/orders?view=all&q=${encodeURIComponent(order.order_number)}`} className="underline underline-offset-4">{order.order_number}</Link></td><td>{order.email}</td><td>{date(order.created_at)}</td><td>{order.status.replaceAll("_", " ")}</td><td>{order.payment_status}</td><td className="text-right">{money(order.total_minor)}</td></tr>)}</tbody></table>{!recent.length && <p className="py-12 text-center text-ink/70">Δεν υπάρχουν ακόμη παραγγελίες.</p>}</div></section>
    </main>
  );
}
