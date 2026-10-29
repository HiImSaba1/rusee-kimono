import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { getContactEnquiry, type EnquiryStatus } from "@/features/contact/admin";
import { advanceEnquiryStatus } from "../actions";

const statusLabels: Record<EnquiryStatus, string> = { new: "Νέο", read: "Διαβασμένο", replied: "Απαντημένο", closed: "Κλειστό" };
const next: Partial<Record<EnquiryStatus, { status: EnquiryStatus; label: string }>> = { new: { status: "read", label: "Σήμανση ως διαβασμένο" }, read: { status: "replied", label: "Σήμανση ως απαντημένο" }, replied: { status: "closed", label: "Κλείσιμο μηνύματος" } };

export default async function AdminEnquiryDetailPage({ params }: { params: Promise<{ publicId: string }> }) {
  const [admin, route] = await Promise.all([requireAdmin(), params]);
  const enquiry = await getContactEnquiry(route.publicId);
  if (!enquiry) notFound();
  const transition = next[enquiry.status];
  const canOperate = admin.role !== "viewer";
  return <main className="px-[var(--gutter)] py-12">
    <p className="eyebrow">Μήνυμα επικοινωνίας · Contact enquiry</p>
    <div className="mt-3 flex flex-wrap items-end justify-between gap-6"><h1 className="font-display text-[clamp(3.5rem,7vw,7rem)] leading-[.84] tracking-[-.05em]">{enquiry.name}</h1><span className="border border-ink/20 px-4 py-2 text-xs uppercase tracking-[.12em]">{statusLabels[enquiry.status]}</span></div>
    <section className="mt-10 grid gap-px bg-ink/15 md:grid-cols-2"><div className="bg-paper p-6"><p className="eyebrow">Στοιχεία</p><dl className="mt-5 grid gap-4 text-sm"><div><dt className="text-ink/45">Email</dt><dd><a className="underline underline-offset-4" href={`mailto:${enquiry.email}`}>{enquiry.email}</a></dd></div><div><dt className="text-ink/45">Θέμα</dt><dd>{enquiry.subject.replaceAll("_", " ")}</dd></div><div><dt className="text-ink/45">Παραγγελία</dt><dd>{enquiry.order_number ?? "—"}</dd></div><div><dt className="text-ink/45">Υποβολή</dt><dd>{new Date(enquiry.created_at).toLocaleString("el-GR")}</dd></div></dl></div><div className="bg-paper p-6"><p className="eyebrow">Email studio</p><dl className="mt-5 grid gap-4 text-sm"><div><dt className="text-ink/45">Κατάσταση</dt><dd>{enquiry.delivery_status ?? "Δεν έχει δημιουργηθεί"}</dd></div><div><dt className="text-ink/45">Προσπάθειες</dt><dd>{enquiry.attempt_count ?? 0}/5</dd></div><div><dt className="text-ink/45">Αποστολή</dt><dd>{enquiry.sent_at ? new Date(enquiry.sent_at).toLocaleString("el-GR") : "—"}</dd></div>{enquiry.last_error && <div><dt className="text-ink/45">Τελευταίο σφάλμα</dt><dd className="text-red-900">{enquiry.last_error}</dd></div>}</dl></div></section>
    <section className="mt-10 border-y border-ink/15 py-8"><p className="eyebrow">Μήνυμα</p><p className="mt-5 max-w-3xl whitespace-pre-wrap text-lg leading-relaxed">{enquiry.message}</p></section>
    {canOperate && transition && <form action={advanceEnquiryStatus} className="mt-8"><input type="hidden" name="enquiryId" value={enquiry.id} /><input type="hidden" name="publicId" value={enquiry.public_id} /><input type="hidden" name="status" value={transition.status} /><button className="border border-ink px-5 py-3 text-xs uppercase tracking-[.13em] hover:bg-ink hover:text-paper">{transition.label}</button></form>}
  </main>;
}
