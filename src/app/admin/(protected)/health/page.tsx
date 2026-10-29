import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/session";
import { applicationHealth } from "@/features/health/checks";
import { launchApprovals } from "@/features/health/launch-approvals";
import { getAutomationWorkerHealth } from "@/features/health/automation-worker";

export const dynamic = "force-dynamic";
const legalEditors = ["terms", "privacy-policy", "returns", "cookies"] as const;

export default async function AdminHealthPage() {
  await requireAdmin();
  const [health, approvals, worker] = await Promise.all([applicationHealth(), Promise.resolve(launchApprovals()), getAutomationWorkerHealth()]);
  const launchApproved = approvals.every(item => item.approved);
  const workerState = {
    healthy: "Πρόσφατη εκτέλεση / Recently active",
    delayed: "Καθυστερημένη ουρά / Queue delayed",
    attention: "Χρειάζεται έλεγχο / Needs review",
    stale: "Χωρίς πρόσφατη εκτέλεση / No recent run",
    never_run: "Δεν έχει εκτελεστεί / Never run",
  }[worker.state];
  return <main className="px-[var(--gutter)] py-12">
    <p className="eyebrow">Διαγνωστικά εγκατάστασης / Deployment diagnostics</p>
    <h1 className="mt-3 font-display text-[clamp(4rem,8vw,8rem)] leading-[.82] tracking-[-.06em]">Υγεία συστήματος.</h1>
    <div className="mt-8 flex flex-wrap gap-3 text-xs uppercase tracking-[.13em]"><span className={health.ok ? "text-green-900" : "text-red-900"}>{health.ok ? "Τεχνικά υγιές / Technically healthy" : "Η ρύθμιση χρειάζεται προσοχή / Configuration needs attention"}</span><span aria-hidden>·</span><span className={launchApproved ? "text-green-900" : "text-amber-900"}>{launchApproved ? "Εγκρίθηκε για launch / Launch approved" : "Εκκρεμούν εγκρίσεις / Approvals pending"}</span></div>
    <div className="mt-10 grid gap-px bg-ink/15 md:grid-cols-2">{health.checks.map(check => <article key={check.name} className="bg-paper p-7"><div className="flex items-center justify-between gap-4"><h2 className="font-display text-3xl capitalize">{check.name.replaceAll("_", " ")}</h2><span className={`text-xs uppercase tracking-[.12em] ${check.ok ? "text-green-900" : "text-red-900"}`}>{check.ok ? "Υγιές / Healthy" : "Προσοχή / Attention"}</span></div><p className="mt-4 text-sm text-ink/70">{check.detail}</p></article>)}</div>
    <section data-testid="worker-health" aria-labelledby="worker-health-title" className="mt-12 bg-[#708a9c] p-[clamp(1.25rem,3vw,2.5rem)] text-ink">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><p className="eyebrow">Plesk worker / Cron health</p><h2 id="worker-health-title" className="mt-3 font-display text-[clamp(2.5rem,5vw,5rem)] leading-[.9]">Ρυθμός αυτοματισμών.</h2></div>
        <span className={`text-xs font-semibold uppercase tracking-[.12em] ${worker.state === "healthy" ? "text-green-950" : "text-ink"}`}>{workerState}</span>
      </div>
      <div className="mt-8 grid gap-px bg-ink/20 sm:grid-cols-3">
        <article className="bg-[#708a9c] p-4"><p className="text-xs uppercase tracking-[.12em]">Έτοιμες εργασίες / Due</p><p className="mt-3 font-display text-4xl">{worker.dueJobs}</p></article>
        <article className="bg-[#708a9c] p-4"><p className="text-xs uppercase tracking-[.12em]">Αποτυχίες / Failed</p><p className="mt-3 font-display text-4xl">{worker.failedJobs}</p></article>
        <article className="bg-[#708a9c] p-4"><p className="text-xs uppercase tracking-[.12em]">Παλιές δεσμεύσεις / Stale locks</p><p className="mt-3 font-display text-4xl">{worker.staleLocks}</p></article>
      </div>
      <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-medium">Τελευταία ολοκλήρωση / Last completion</dt><dd className="mt-1">{worker.lastCompletedAt ? new Date(worker.lastCompletedAt).toLocaleString("el-GR") : "—"}</dd></div><div><dt className="font-medium">Παλαιότερη έτοιμη εργασία / Oldest due job</dt><dd className="mt-1">{worker.oldestDueAt ? new Date(worker.oldestDueAt).toLocaleString("el-GR") : "—"}</dd></div></dl>
      <p className="mt-6 max-w-3xl text-sm leading-relaxed">Ένδειξη μόνο ανάγνωσης. Η σελίδα δεν εκτελεί cron και δεν εμφανίζει URL, Bearer secret ή payload. Στην παραγωγή, επιβεβαιώστε τη ρύθμιση από το Plesk και πραγματικό timestamp εκτέλεσης. / Read-only signal; production scheduling still requires Plesk evidence.</p>
      <Link href="/admin/automation" className="mt-6 inline-block border border-ink px-4 py-2 text-xs uppercase tracking-[.12em] transition-colors hover:bg-ink hover:text-paper">Προβολή ουράς / View queue</Link>
    </section>
    <section className="mt-16">
      <p className="eyebrow">Εγκρίσεις launch / Launch approvals</p>
      <h2 className="mt-4 max-w-4xl font-display text-[clamp(2.5rem,5vw,5rem)] leading-[.92] tracking-[-.04em]">Τι περιμένουμε. Τι υλοποιούμε.</h2>
      <p className="mt-5 max-w-3xl text-base leading-relaxed text-ink/70">Κάθε κάρτα χωρίζει τα στοιχεία ή την απόφαση που περιμένουμε από τη Sandra από την τεχνική εργασία που είναι δική μας. / Each card separates Sandra’s source facts or decision from our implementation work.</p>
      <div className="mt-8 grid gap-4 xl:grid-cols-2">{approvals.map(item => <article key={item.key} className="bg-paper-deep p-[clamp(1.25rem,2.2vw,2rem)]">
        <div className="flex items-start justify-between gap-5"><div><h3 className="text-lg font-medium">{item.labelEl}</h3><p className="mt-1 text-sm text-ink/65">{item.labelEn}</p></div><span className={`shrink-0 text-xs uppercase tracking-[.12em] ${item.approved ? "text-green-900" : "text-amber-900"}`}>{item.approved ? "Εγκρίθηκε / Approved" : "Εκκρεμεί / Pending"}</span></div>
        <div className="mt-6 grid gap-px bg-ink/15 sm:grid-cols-2"><div className="bg-paper p-4"><p className="font-mono text-xs uppercase tracking-[.13em] text-amber-900">Wait for Sandra</p><p className="mt-3 text-sm leading-relaxed">{item.waitingEl}</p><p className="mt-2 text-xs leading-relaxed text-ink/60">{item.waitingEn}</p></div><div className="bg-ink p-4 text-paper"><p className="font-mono text-xs uppercase tracking-[.13em] text-paper/65">On me / Implementation</p><p className="mt-3 text-sm leading-relaxed">{item.implementationEl}</p><p className="mt-2 text-xs leading-relaxed text-paper/60">{item.implementationEn}</p></div></div>
        <p className="mt-5 font-mono text-xs text-ink/65">Υπεύθυνος: {item.ownerEl}<br />Owner: {item.ownerEn}</p>
        {item.key === "LAUNCH_LEGAL_APPROVED" && <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs uppercase tracking-[.1em]">{legalEditors.map(slug => <Link key={slug} href={`/admin/information/${slug}`} className="underline underline-offset-4">{slug.replaceAll("-", " ")}</Link>)}</div>}
      </article>)}</div>
      <p className="mt-6 max-w-3xl text-sm leading-relaxed text-ink/70">Οι ενδείξεις είναι μη απόρρητες δηλώσεις έγκρισης στο Plesk. Δεν αντικαθιστούν συμβάσεις, νομική ή λογιστική συμβουλή και δεν ενεργοποιούν πληρωμές, email ή deployment. / These non-secret Plesk declarations replace neither contracts nor professional advice and trigger no payment, email or deployment action.</p>
    </section>
    <p className="mt-10 text-xs text-ink/70">Έλεγχος / Checked {new Date(health.checkedAt).toLocaleString("el-GR")}. Τα δημόσια health endpoints εμφανίζουν μόνο συνοπτική κατάσταση.</p>
  </main>;
}
