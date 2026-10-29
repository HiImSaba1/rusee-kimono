import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/session";
import { returnTransitionOptions, safeStatusLabel } from "@/features/admin/order-operations";
import { databasePool } from "@/lib/db/connection";
import { updateReturnRequest } from "./actions";

const labels = { approved: "Έγκριση / Approve", rejected: "Απόρριψη / Reject", received: "Παραλήφθηκε / Mark received", closed: "Κλείσιμο / Close" } as const;

export default async function AdminReturnsPage() {
  const admin = await requireAdmin();
  const canOperate = admin.role === "owner" || admin.role === "manager" || admin.role === "fulfilment";
  const [rows] = await databasePool.execute(`SELECT r.id,r.public_id,r.reason,r.customer_note,r.status,r.admin_note,r.reviewed_at,r.created_at,r.updated_at,
    o.public_id AS order_public_id,o.order_number,o.email,o.fulfilment_status
    FROM return_requests r INNER JOIN orders o ON o.id=r.order_id
    ORDER BY FIELD(r.status,'pending','approved','received','rejected','closed'),r.created_at DESC LIMIT 100`);
  const requests = rows as Array<{ id:number; public_id:string; reason:string; customer_note:string; status:string; admin_note:string|null; reviewed_at:Date|null; created_at:Date; updated_at:Date; order_public_id:string; order_number:string; email:string; fulfilment_status:string }>;
  return <main className="px-[var(--gutter)] py-12">
    <p className="eyebrow">Πωλήσεις / Sales</p>
    <h1 className="mt-3 font-display text-[clamp(4rem,8vw,8rem)] leading-[.82] tracking-[-.06em]">Αιτήματα επιστροφής.</h1>
    <p className="mt-6 max-w-3xl text-base leading-relaxed text-ink/70">Η έγκριση δεν επιστρέφει χρήματα. Η κατάσταση «παραλήφθηκε» ενημερώνει τη φυσική επιστροφή του προϊόντος· το refund παραμένει χωριστή επαληθευμένη ροή παρόχου.</p>
    <div className="mt-12 space-y-5">{requests.map((request) => {
      const options = returnTransitionOptions[request.status] ?? [];
      return <article key={request.id} className="grid gap-6 border-t border-ink/20 py-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <Link href={`/admin/orders/${request.order_public_id}`} className="font-display text-3xl underline underline-offset-4">{request.order_number}</Link>
          <p className="mt-2 text-xs uppercase tracking-[.12em]">{safeStatusLabel(request.reason)} · {safeStatusLabel(request.status)} · fulfilment {safeStatusLabel(request.fulfilment_status)}</p>
          <p className="mt-2 text-xs text-ink/55">{request.email} · {new Date(request.created_at).toLocaleString("el-GR")}</p>
          <p className="mt-4 text-sm leading-relaxed">{request.customer_note}</p>
          {request.admin_note && <div className="mt-5 bg-paper-deep p-4"><p className="eyebrow">Τελευταία εσωτερική σημείωση</p><p className="mt-2 text-sm">{request.admin_note}</p>{request.reviewed_at && <time className="mt-2 block text-xs text-ink/55">{new Date(request.reviewed_at).toLocaleString("el-GR")}</time>}</div>}
        </div>
        <div>
          {canOperate && options.length > 0 ? <form action={updateReturnRequest} className="grid gap-3">
            <input type="hidden" name="requestId" value={request.id}/>
            <label className="text-xs uppercase tracking-[.12em]">Next state<select name="status" className="mt-2 block w-full border-b border-ink/25 bg-transparent py-2">{options.map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></label>
            <label className="text-xs uppercase tracking-[.12em]">Internal review note<textarea required minLength={8} maxLength={500} name="adminNote" rows={3} className="mt-2 block w-full border-b border-ink/25 bg-transparent py-2"/></label>
            <button className="justify-self-start border border-ink px-4 py-2 text-xs uppercase tracking-[.12em] transition-colors hover:bg-ink hover:text-paper">Update review</button>
          </form> : <p className="text-sm text-ink/55">{options.length ? "Ο ρόλος σας έχει μόνο προβολή." : "Δεν υπάρχει επόμενη επιτρεπτή μετάβαση."}</p>}
        </div>
      </article>;
    })}{requests.length === 0 && <p className="border-t border-ink/20 py-10 text-ink/55">Δεν υπάρχουν αιτήματα / No return requests.</p>}</div>
  </main>;
}
