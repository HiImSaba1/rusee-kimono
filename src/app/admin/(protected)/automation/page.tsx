import { requireAdmin } from "@/features/admin-auth/session";
import { listAutomationJobs } from "@/features/automation/queue";
import { cancelAutomationJob, retryAutomationJob } from "./actions";

const statusEl = { queued:"Σε αναμονή", processing:"Εκτελείται", retry_wait:"Αναμονή επανάληψης", completed:"Ολοκληρώθηκε", failed:"Χρειάζεται έλεγχο", cancelled:"Ακυρώθηκε" } as const;
const kindEl = { email_dispatch:"Αποστολή συναλλακτικών email", notification_sync:"Συγχρονισμός ειδοποιήσεων", reservation_release:"Αποδέσμευση ληγμένων κρατήσεων" } as const;
const button = "border border-ink/25 px-4 py-2 text-[.68rem] uppercase tracking-[.1em] transition-colors hover:bg-ink hover:text-paper";

export default async function AutomationPage() {
  const [admin, jobs] = await Promise.all([requireAdmin(), listAutomationJobs()]);
  const canOperate = admin.role === "owner" || admin.role === "manager";
  const count = (statuses: string[]) => jobs.filter(job => statuses.includes(job.status)).length;
  return <main data-testid="automation-dashboard" className="px-[var(--gutter)] py-12">
    <p className="eyebrow">Ασφαλής εκτέλεση μέσω Plesk</p>
    <h1 className="mt-3 font-display text-[clamp(3.25rem,7vw,7rem)] leading-[.86] tracking-[-.055em]">Αυτοματισμοί.</h1>
    <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/65">Η Papaki καλεί ιδιωτικά τον worker. Κάθε εργασία δεσμεύεται από έναν μόνο worker, επαναλαμβάνεται με όριο και δεν εμφανίζει secrets ή payload πελάτη.</p>
    <section className="mt-9 grid gap-3 sm:grid-cols-3">
      {[{label:"Σε αναμονή",value:count(["queued","retry_wait"])},{label:"Χρειάζεται έλεγχο",value:count(["failed"])},{label:"Ολοκληρωμένες",value:count(["completed"])}].map(item => <article key={item.label} className="bg-[#708a9c] p-5 text-ink"><p className="text-[.72rem] uppercase tracking-[.12em]">{item.label}</p><p className="mt-4 font-display text-5xl">{item.value}</p></article>)}
    </section>
    <div role="region" aria-label="Πίνακας εργασιών αυτοματισμού" tabIndex={0} className="mt-10 overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="text-[.68rem] uppercase tracking-[.11em] text-ink/75"><tr><th className="py-4">Εργασία</th><th>Κατάσταση</th><th>Προγραμματισμός</th><th>Προσπάθειες</th><th>Ασφαλές αποτέλεσμα</th><th>Ενέργεια</th></tr></thead><tbody>{jobs.map(job => <tr key={job.id} className="border-t border-ink/15 align-top"><td className="py-5"><strong>{kindEl[job.kind]}</strong><p className="mt-1 font-mono text-xs text-ink/70">{job.public_id}</p></td><td>{statusEl[job.status]}</td><td>{new Date(job.run_at).toLocaleString("el-GR")}</td><td>{job.attempt_count}/{job.max_attempts}</td><td className="max-w-xs text-xs text-ink/75">{job.last_error ?? "—"}</td><td>{canOperate && <div className="flex gap-2">{job.status === "failed" && <form action={retryAutomationJob}><input type="hidden" name="jobId" value={job.id}/><button className={button}>Επανάληψη</button></form>}{["queued","retry_wait","failed"].includes(job.status) && <form action={cancelAutomationJob}><input type="hidden" name="jobId" value={job.id}/><button className={button}>Ακύρωση</button></form>}</div>}</td></tr>)}</tbody></table>{!jobs.length && <p className="border-t border-ink/15 py-10 text-ink/75">Δεν υπάρχουν ακόμη εργασίες. Η πρώτη κλήση του Plesk worker θα δημιουργήσει τις ασφαλείς λειτουργικές εργασίες.</p>}</div>
    <aside className="mt-10 border-l-4 border-ink bg-[#708a9c] p-5 text-sm leading-relaxed text-ink"><strong>Εκτός λειτουργίας:</strong> marketing, abandoned-cart και οποιαδήποτε μη εγκεκριμένη μαζική επικοινωνία. Η ουρά εκτελεί μόνο συναλλακτικές και λειτουργικές εργασίες.</aside>
  </main>;
}
