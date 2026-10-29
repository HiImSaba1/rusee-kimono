import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/session";
import {
  emailDeliveryStatusCounts,
  listEmailDeliveries,
  type EmailDeliveryStatus,
} from "@/features/admin/queries";
import { sanitizeEmailDeliveryError } from "@/features/email/delivery";
import { listEmailCommunicationGaps } from "@/features/email/reconciliation";
import { dispatchEmailQueue, repairMissingEmail, retryEmailDelivery } from "./actions";

const button = "border border-ink/30 px-4 py-2 text-xs uppercase tracking-[.12em] transition-colors hover:bg-ink hover:text-paper disabled:opacity-40";
const statuses = ["queued", "sending", "sent", "failed"] as const;
const statusCopy: Record<EmailDeliveryStatus, { el: string; en: string }> = {
  queued: { el: "Σε αναμονή", en: "Queued" },
  sending: { el: "Σε αποστολή", en: "Sending" },
  sent: { el: "Απεστάλη", en: "Sent" },
  failed: { el: "Χρειάζεται έλεγχο", en: "Needs review" },
};

function isStatus(value: string | undefined): value is EmailDeliveryStatus {
  return statuses.some((status) => status === value);
}

export default async function AdminEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const parameters = await searchParams;
  const selectedStatus = isStatus(parameters.status) ? parameters.status : undefined;
  const [admin, rows, counts, communicationGaps] = await Promise.all([
    requireAdmin(),
    listEmailDeliveries(selectedStatus),
    emailDeliveryStatusCounts(),
    listEmailCommunicationGaps(),
  ]);
  const canOperate = admin.role === "owner" || admin.role === "manager";
  const configured = Boolean(
    process.env.SMTP_HOST
      && process.env.SMTP_USER
      && process.env.SMTP_PASSWORD
      && process.env.MAIL_FROM,
  );
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return <main data-testid="email-ledger" className="px-[var(--gutter)] py-12">
    <p className="eyebrow">Επικοινωνία πελατών / Customer communication</p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
      <h1 className="font-display text-[clamp(3.5rem,8vw,8rem)] leading-[.82] tracking-[-.06em]">Αρχείο email.</h1>
      {canOperate && <form action={dispatchEmailQueue}>
        <button disabled={!configured} className={button}>Ουρά αποστολής / Queue dispatch</button>
      </form>}
    </div>
    <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink/75">Κάθε συναλλακτικό μήνυμα έχει μοναδικό κλειδί. Οι ενέργειες εδώ προγραμματίζουν τον ιδιωτικό Plesk worker· η σελίδα δεν συνδέεται ποτέ απευθείας στο SMTP.</p>
    <p className={`mt-5 text-xs uppercase tracking-[.12em] ${configured ? "text-green-900" : "text-red-900"}`}>
      {configured ? "SMTP configured · delivery remains worker-only" : "SMTP credentials not configured · messages remain queued"}
    </p>

    <section aria-label="Σύνοψη κατάστασης email" className="mt-9 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Link href="/admin/email" aria-current={!selectedStatus ? "page" : undefined} className="bg-[#708a9c] p-5 text-ink transition-colors hover:bg-ink hover:text-paper">
        <p className="text-[.72rem] uppercase tracking-[.12em]">Όλα / All</p>
        <p className="mt-4 font-display text-5xl">{total}</p>
      </Link>
      {statuses.map((status) => <Link
        key={status}
        href={`/admin/email?status=${status}`}
        aria-current={selectedStatus === status ? "page" : undefined}
        className="border border-ink/15 p-5 transition-colors hover:bg-ink hover:text-paper aria-[current=page]:bg-ink aria-[current=page]:text-paper"
      >
        <p className="text-[.72rem] uppercase tracking-[.12em]">{statusCopy[status].el} / {statusCopy[status].en}</p>
        <p className="mt-4 font-display text-5xl">{counts[status]}</p>
      </Link>)}
    </section>

    <aside className="mt-6 border-l-4 border-ink bg-[#708a9c]/35 p-5 text-sm leading-relaxed text-ink">
      <strong>Ανάκτηση worker:</strong> μηνύματα που μένουν σε αποστολή πάνω από 15 λεπτά επιστρέφουν με ασφάλεια στην ουρά, εφόσον απομένουν προσπάθειες. Στις 5 προσπάθειες παραμένουν για τεχνικό έλεγχο. / Stale 15-minute claims recover automatically; exhausted deliveries remain visible for review.
    </aside>

    <section aria-labelledby="email-reconciliation-title" className="mt-10 border-y border-ink/15 py-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Έλεγχος πληρότητας / Communication reconciliation</p>
          <h2 id="email-reconciliation-title" className="mt-2 font-display text-[clamp(2rem,4vw,4rem)] leading-none">Μηνύματα που λείπουν.</h2>
        </div>
        <p className="font-display text-5xl" aria-label={`${communicationGaps.length} communication gaps`}>{communicationGaps.length}</p>
      </div>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink/75">Ο έλεγχος είναι μόνο ανάγνωσης. Μια ρητά επιβεβαιωμένη επιδιόρθωση επανελέγχει το γεγονός και δημιουργεί το μήνυμα μόνο στην ιδιωτική ουρά· δεν καλεί SMTP. / Detection is read-only. An explicitly confirmed repair revalidates the event and queues the missing record for the private worker.</p>
      {communicationGaps.length > 0
        ? <ul className="mt-6 grid gap-2">{communicationGaps.map((gap) => <li key={`${gap.expected_template}:${gap.order_public_id}`} className="grid items-center gap-3 border-t border-ink/10 py-4 text-sm md:grid-cols-[1fr_1fr_auto_auto]">
          <Link href={`/admin/orders/${gap.order_public_id}`} className="font-medium underline underline-offset-4">{gap.order_number}</Link>
          <span>{gap.expected_template.replaceAll("_", " ")}</span>
          <time dateTime={new Date(gap.source_created_at).toISOString()}>{new Date(gap.source_created_at).toLocaleString("el-GR")}</time>
          {canOperate && <form action={repairMissingEmail}>
            <input type="hidden" name="orderPublicId" value={gap.order_public_id} />
            <input type="hidden" name="expectedTemplate" value={gap.expected_template} />
            <label className="mb-2 flex items-center gap-2 text-xs"><input required type="checkbox" name="confirm" value="yes" /> Επιβεβαίωση / Confirm</label>
            <button className={button}>Επιδιόρθωση στην ουρά / Repair to queue</button>
          </form>}
        </li>)}</ul>
        : <p className="mt-6 border-t border-ink/10 py-5 text-sm text-ink/75">Δεν εντοπίστηκαν κενά επικοινωνίας. / No communication gaps detected.</p>}
    </section>

    <div role="region" aria-label="Αρχείο συναλλακτικών email" tabIndex={0} className="mt-10 overflow-x-auto">
      <table className="w-full min-w-[1050px] text-left text-sm">
        <thead className="text-xs uppercase tracking-[.12em] text-ink/75"><tr><th className="py-4">Δημιουργία</th><th>Πηγή</th><th>Template</th><th>Παραλήπτης</th><th>Κατάσταση</th><th>Προσπάθειες</th><th>Ασφαλές αποτέλεσμα</th><th>Ενέργεια</th></tr></thead>
        <tbody>{rows.map((row) => {
          const status = isStatus(row.status) ? row.status : "failed";
          const safeResult = row.provider_message_id
            ?? (row.last_error ? sanitizeEmailDeliveryError(new Error(row.last_error)) : "—");
          return <tr key={row.id} className="border-t border-ink/10 align-top">
            <td className="py-4">{new Date(row.created_at).toLocaleString("el-GR")}</td>
            <td>{row.public_id
              ? <Link className="underline underline-offset-4" href={`/admin/orders/${row.public_id}`}>{row.order_number}</Link>
              : row.enquiry_public_id
                ? <Link className="underline underline-offset-4" href={`/admin/enquiries/${row.enquiry_public_id}`}>{row.enquiry_name}</Link>
                : "—"}</td>
            <td>{row.template.replaceAll("_", " ")}</td>
            <td>{row.recipient}</td>
            <td><span className="font-medium">{statusCopy[status].el}</span><br /><span className="text-xs text-ink/70">{statusCopy[status].en}</span></td>
            <td>{row.attempt_count}/5</td>
            <td className="max-w-xs break-words text-xs text-ink/75">{safeResult}</td>
            <td>{canOperate && row.status === "failed" && row.attempt_count < 5 && <form action={retryEmailDelivery}>
              <input type="hidden" name="deliveryId" value={row.id} />
              <button className={button}>Ουρά επανάληψης / Queue retry</button>
            </form>}</td>
          </tr>;
        })}</tbody>
      </table>
      {!rows.length && <p className="border-t border-ink/10 py-10 text-ink/75">Δεν υπάρχουν μηνύματα σε αυτή την κατάσταση. / No messages match this status.</p>}
    </div>
  </main>;
}
