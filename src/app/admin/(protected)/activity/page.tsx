import Link from "next/link";
import { requireAdminRole } from "@/features/admin-auth/session";
import { activityCategory, activityCategoryLabels, describeAuditAction, getAdminActivity } from "@/features/admin/activity";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  await requireAdminRole(["owner", "manager"]);
  const query = await searchParams;
  const parsedCategory = activityCategory.safeParse(query.category);
  const category = parsedCategory.success ? parsedCategory.data : "all";
  const requestedPage = Number.parseInt(query.page ?? "1", 10);
  const activity = await getAdminActivity({ category, page: Number.isFinite(requestedPage) ? requestedPage : 1 });
  const href = (page: number) => `/admin/activity?category=${category}&page=${page}`;
  return (
    <main className="px-[var(--gutter)] py-12">
      <p className="eyebrow">Σύστημα / System</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6"><div><h1 className="font-display text-[clamp(4rem,8vw,8rem)] leading-[.82] tracking-[-.06em]">Ιστορικό ενεργειών.</h1><p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink/70">Αμετάβλητη λειτουργική εικόνα χωρίς πλήρες metadata, προσωπικά μηνύματα, provider payloads ή μυστικά. / Safe audit overview without sensitive payloads.</p></div><p className="font-mono text-xs">{activity.total} events</p></div>
      <nav aria-label="Φίλτρα ιστορικού" className="mt-10 flex flex-wrap gap-2">{activityCategory.options.map((value) => <Link key={value} href={`/admin/activity?category=${value}&page=1`} aria-current={category === value ? "page" : undefined} className={`border px-4 py-2 text-xs uppercase tracking-[.12em] ${category === value ? "border-ink bg-ink text-paper" : "border-ink/25"}`}>{activityCategoryLabels[value].el}<span className="ml-2 text-[.58rem] opacity-70">{activityCategoryLabels[value].en}</span></Link>)}</nav>
      <div role="region" aria-label="Πίνακας ιστορικού ενεργειών" tabIndex={0} className="mt-10 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
        <table className="w-full min-w-[900px] text-left text-sm"><thead className="text-[.6rem] uppercase tracking-[.14em] text-ink/65"><tr><th className="py-4">Χρόνος / Time</th><th>Ενέργεια / Action</th><th>Διαχειριστής / Admin</th><th>Οντότητα / Entity</th><th>Αναφορά / Ref</th></tr></thead><tbody>{activity.rows.map((row) => { const label = describeAuditAction(row.action); return <tr key={row.id} className="border-t border-ink/10"><td className="py-4 whitespace-nowrap">{new Date(row.created_at).toLocaleString("el-GR")}</td><td><strong className="block font-medium">{label.el}</strong><span className="text-xs text-ink/60">{label.en}</span></td><td>{row.username ?? "Σύστημα / System"}</td><td className="font-mono text-xs">{row.entity_type}</td><td className="font-mono text-xs">{row.entity_id ?? "—"}</td></tr>; })}</tbody></table>
        {!activity.rows.length && <p className="border-t border-ink/20 py-12 text-center text-ink/65">Δεν υπάρχουν ενέργειες σε αυτή την κατηγορία. / No activity in this category.</p>}
      </div>
      <nav aria-label="Σελιδοποίηση ιστορικού" className="mt-8 flex items-center justify-between text-xs uppercase tracking-[.13em]"><span>Σελίδα {activity.page} / {activity.totalPages}</span><div className="flex gap-5">{activity.page > 1 && <Link href={href(activity.page - 1)}>← Προηγούμενη</Link>}{activity.page < activity.totalPages && <Link href={href(activity.page + 1)}>Επόμενη →</Link>}</div></nav>
    </main>
  );
}
