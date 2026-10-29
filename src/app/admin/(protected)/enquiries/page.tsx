import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/session";
import { enquiryStatuses, listContactEnquiries } from "@/features/contact/admin";

const statusLabels = { all: "Όλα", new: "Νέα", read: "Διαβασμένα", replied: "Απαντημένα", closed: "Κλειστά" } as const;
const subjectLabels: Record<string, string> = { order_question: "Παραγγελία", fit_sizing: "Εφαρμογή / μέγεθος", press: "Τύπος", stockist: "Συνεργάτης λιανικής", collaboration: "Συνεργασία" };

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  await requireAdmin();
  const parameters = await searchParams;
  const query = parameters.q ?? "";
  const status = parameters.status ?? "all";
  const rows = await listContactEnquiries(query, status);
  return <main className="px-[var(--gutter)] py-12">
    <p className="eyebrow">Επικοινωνία πελατών · Customer contact</p>
    <h1 className="mt-3 font-display text-[clamp(4rem,8vw,8rem)] leading-[.82] tracking-[-.06em]">Μηνύματα.</h1>
    <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink/55">Τα μηνύματα αποθηκεύονται στη MySQL πριν από κάθε προσπάθεια email. Η κατάσταση αλλάζει διαδοχικά και κάθε αλλαγή καταγράφεται.</p>
    <form className="mt-10 grid gap-4 border-y border-ink/15 py-5 md:grid-cols-[1fr_220px_auto]">
      <label className="text-xs uppercase tracking-[.12em]">Αναζήτηση<input name="q" defaultValue={query} className="mt-2 block w-full border-b border-ink/25 bg-transparent py-2 text-sm normal-case tracking-normal" placeholder="Όνομα, email, παραγγελία" /></label>
      <label className="text-xs uppercase tracking-[.12em]">Κατάσταση<select name="status" defaultValue={status} className="mt-2 block w-full border-b border-ink/25 bg-transparent py-2 text-sm normal-case tracking-normal"><option value="all">Όλα</option>{enquiryStatuses.map(item => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label>
      <button className="self-end border border-ink px-5 py-3 text-xs uppercase tracking-[.13em] hover:bg-ink hover:text-paper">Εφαρμογή</button>
    </form>
    <div className="mt-8 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="text-[.6rem] uppercase tracking-[.13em] text-ink/45"><tr><th className="py-4">Ημερομηνία</th><th>Όνομα</th><th>Θέμα</th><th>Παραγγελία</th><th>Γλώσσα</th><th>Κατάσταση</th></tr></thead><tbody>{rows.map(row => <tr key={row.public_id} className="border-t border-ink/10"><td className="py-4">{new Date(row.created_at).toLocaleString("el-GR")}</td><td><Link href={`/admin/enquiries/${row.public_id}`} className="font-medium underline underline-offset-4">{row.name}</Link><span className="mt-1 block text-xs text-ink/45">{row.email}</span></td><td>{subjectLabels[row.subject] ?? row.subject}</td><td>{row.order_number ?? "—"}</td><td className="uppercase">{row.locale}</td><td>{statusLabels[row.status]}</td></tr>)}</tbody></table>{!rows.length && <p className="border-t border-ink/10 py-10 text-ink/50">Δεν βρέθηκαν μηνύματα.</p>}</div>
  </main>;
}
