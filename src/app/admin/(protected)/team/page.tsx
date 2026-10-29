import { requireAdminRole } from "@/features/admin-auth/session";
import { listAdminTeam, staffRole, staffRoleLabels } from "@/features/admin/team";
import { createStaffMember, resetStaffPassword, setStaffActive } from "./actions";

const field = "mt-2 block w-full border-b border-ink/30 bg-transparent px-1 py-2 outline-none focus:border-ink";
export const dynamic = "force-dynamic";

export default async function AdminTeamPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const admin = await requireAdminRole(["owner"]);
  const members = await listAdminTeam();
  const saved = (await searchParams).saved;
  const feedback: Record<string, string> = { created: "Ο λογαριασμός δημιουργήθηκε. / Account created.", password: "Ο κωδικός άλλαξε και οι συνεδρίες ανακλήθηκαν. / Password reset and sessions revoked.", activated: "Ο λογαριασμός ενεργοποιήθηκε. / Account activated.", deactivated: "Ο λογαριασμός απενεργοποιήθηκε. / Account deactivated." };
  return (
    <main className="px-[var(--gutter)] py-12">
      <p className="eyebrow">Σύστημα / System</p>
      <h1 className="mt-3 font-display text-[clamp(4rem,8vw,8rem)] leading-[.82] tracking-[-.06em]">Ομάδα διαχείρισης.</h1>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink/70">Δημιουργία καθημερινών ρόλων, ανάκληση πρόσβασης και ασφαλής αλλαγή κωδικού. Οι λογαριασμοί ιδιοκτήτη παραμένουν bootstrap-level λειτουργία.</p>
      {saved && feedback[saved] && <p role="status" className="mt-6 bg-emerald-950 p-4 text-sm text-white">{feedback[saved]}</p>}

      <section className="mt-12 border-t border-ink/20 pt-8">
        <p className="eyebrow">Νέο μέλος / New member</p>
        <form action={createStaffMember} className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm">Όνομα χρήστη / Username<input required name="username" minLength={3} maxLength={100} autoComplete="off" className={field} /></label>
          <label className="text-sm">Email προαιρετικό / Optional email<input name="email" type="email" maxLength={254} autoComplete="off" className={field} /></label>
          <label className="text-sm">Ρόλος / Role<select name="role" className={field}>{staffRole.options.map((role) => <option key={role} value={role}>{staffRoleLabels[role].el} / {staffRoleLabels[role].en}</option>)}</select></label>
          <label className="text-sm">Προσωρινός κωδικός / Temporary password<input required name="password" type="password" minLength={14} maxLength={128} autoComplete="new-password" className={field} /></label>
          <p className="text-xs leading-relaxed text-ink/65 md:col-span-2 xl:col-span-3">Τουλάχιστον 14 χαρακτήρες με κεφαλαίο, πεζό, αριθμό και σύμβολο. Μεταδώστε τον κωδικό εκτός email/chat όπου είναι δυνατό.</p>
          <button className="justify-self-start bg-ink px-6 py-4 text-xs uppercase tracking-[.14em] text-paper">Δημιουργία / Create</button>
        </form>
      </section>

      <section className="mt-16"><p className="eyebrow">Ενεργοί λογαριασμοί / Accounts</p><div className="mt-6 grid gap-4 xl:grid-cols-2">
        {members.map((member) => { const active = Boolean(member.active); const role = staffRoleLabels[member.role]; return <article key={member.id} className="bg-paper-deep p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-display text-4xl">{member.username}</h2><p className="mt-2 text-sm text-ink/65">{member.email ?? "Χωρίς email / No email"}</p></div><span className={`font-mono text-xs ${active ? "text-green-900" : "text-red-900"}`}>{active ? "Ενεργός / Active" : "Ανενεργός / Inactive"}</span></div><div className="mt-6 border-t border-ink/15 pt-5"><p className="font-medium">{role.el} / {role.en}</p><p className="mt-1 text-sm text-ink/65">{role.description}</p><p className="mt-3 font-mono text-xs text-ink/60">Τελευταία είσοδος: {member.last_login_at ? new Date(member.last_login_at).toLocaleString("el-GR") : "—"}</p></div>
          {member.role !== "owner" && <div className="mt-6 grid gap-6 border-t border-ink/15 pt-5 md:grid-cols-2"><form action={resetStaffPassword}><input type="hidden" name="memberId" value={member.id} /><label className="text-xs uppercase tracking-[.1em]">Νέος κωδικός<input required type="password" name="password" minLength={14} maxLength={128} autoComplete="new-password" className={field} /></label><label className="mt-3 block text-xs">Πληκτρολογήστε RESET<input required name="confirmation" pattern="RESET" className={field} /></label><button className="mt-4 border border-ink px-4 py-3 text-xs uppercase tracking-[.12em]">Αλλαγή κωδικού</button></form><form action={setStaffActive}><input type="hidden" name="memberId" value={member.id} /><input type="hidden" name="active" value={active ? "false" : "true"} /><p className="text-sm">{active ? "Η απενεργοποίηση ανακαλεί όλες τις συνεδρίες." : "Η ενεργοποίηση επιτρέπει νέα είσοδο."}</p><label className="mt-3 block text-xs">Πληκτρολογήστε CONFIRM<input required name="confirmation" pattern="CONFIRM" className={field} /></label><button className={`mt-4 border px-4 py-3 text-xs uppercase tracking-[.12em] ${active ? "border-red-900 text-red-950" : "border-ink"}`}>{active ? "Απενεργοποίηση" : "Ενεργοποίηση"}</button></form></div>}
          {member.id === admin.id && <p className="mt-5 text-xs text-ink/60">Τρέχουσα συνεδρία / Current session</p>}
        </article>; })}
      </div></section>
    </main>
  );
}
