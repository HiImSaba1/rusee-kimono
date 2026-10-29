import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { decodeStoredSections, getAdminInformationPage, informationPageLabels, informationPageSlug, localizedSections } from "@/features/content/information-pages";
import { legalDraftsBySlug } from "@/data/legal-draft-copy";
import { updateInformationPage } from "../actions";

const field = "mt-2 block w-full border-b border-ink/25 bg-transparent px-1 py-2 outline-none focus:border-ink disabled:opacity-60";
export const dynamic = "force-dynamic";

export default async function InformationEditorPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string }> }) {
  const parsed = informationPageSlug.safeParse((await params).slug);
  if (!parsed.success) notFound();
  const [admin, page] = await Promise.all([requireAdmin(), getAdminInformationPage(parsed.data)]);
  if (!page) notFound();
  const canEdit = admin.role === "owner" || admin.role === "manager";
  const stored = localizedSections.safeParse(decodeStoredSections(page.sections));
  const starter = parsed.data in legalDraftsBySlug ? legalDraftsBySlug[parsed.data as keyof typeof legalDraftsBySlug] : null;
  const sections = stored.success && stored.data.el.length > 0 ? stored.data : starter ? { el: starter.el.sections, en: starter.en.sections } : { el: [], en: [] };
  const label = informationPageLabels[parsed.data];
  const saved = (await searchParams).saved;
  const feedback = saved === "publish" ? "Η σελίδα δημοσιεύτηκε. / Page published." : saved === "withdraw" ? "Η σελίδα αποσύρθηκε και επέστρεψε σε πρόχειρο. / Page withdrawn." : saved === "save_draft" ? "Το πρόχειρο αποθηκεύτηκε. / Draft saved." : null;

  return (
    <main className="px-[var(--gutter)] py-12">
      <div className="flex flex-wrap gap-5 text-xs uppercase tracking-[.13em]"><Link href="/admin/information">← Σελίδες πληροφοριών</Link><Link href={`/admin/information/${parsed.data}/preview`}>Προεπισκόπηση / Preview →</Link></div>
      <p className="eyebrow mt-10">{parsed.data}</p>
      <h1 className="mt-3 font-display text-[clamp(4rem,8vw,8rem)] leading-[.84]">{label.el}</h1>
      <p className="mt-4 text-sm text-ink/70">{label.en} · Τελευταία αλλαγή {new Date(page.updated_at).toLocaleString("el-GR")}</p>
      {feedback && <p role="status" className="mt-6 bg-emerald-950 p-4 text-sm text-white">{feedback}</p>}
      <form action={updateInformationPage} className="mt-10 grid gap-6 md:grid-cols-2">
        <input type="hidden" name="slug" value={parsed.data} />
        <Field disabled={!canEdit} name="eyebrowEl" label="Κατηγορία · Greek" value={page.eyebrow_el} />
        <Field disabled={!canEdit} name="eyebrowEn" label="Eyebrow · English" value={page.eyebrow_en} />
        <Field disabled={!canEdit} name="titleEl" label="Τίτλος · Greek" value={page.title_el} />
        <Field disabled={!canEdit} name="titleEn" label="Title · English" value={page.title_en} />
        <Area disabled={!canEdit} name="introEl" label="Εισαγωγή · Greek" value={starter && page.status === "draft" ? starter.el.intro : page.intro_el} />
        <Area disabled={!canEdit} name="introEn" label="Introduction · English" value={starter && page.status === "draft" ? starter.en.intro : page.intro_en} />
        <div className="md:col-span-2 mt-5 border-t border-ink/20 pt-7"><p className="eyebrow">Ενότητες / Sections</p><p className="mt-3 text-sm text-ink/70">Συμπληρώστε κάθε ενότητα και στις δύο γλώσσες. Τα πεδία ADD_YOUR_… επισημαίνουν μόνο τα στοιχεία που περιμένουμε από τη Sandra ή επαγγελματικό έλεγχο.</p></div>
        {Array.from({ length: 12 }, (_, index) => <section key={index} className="contents"><div className="border-t border-ink/15 pt-5"><p className="font-mono text-xs text-ink/70">{String(index + 1).padStart(2, "0")} · GR</p><Field disabled={!canEdit} name={`headingEl${index}`} label="Επικεφαλίδα" value={sections.el[index]?.heading} /><Area disabled={!canEdit} name={`contentEl${index}`} label="Κείμενο" value={sections.el[index]?.content} /></div><div className="border-t border-ink/15 pt-5"><p className="font-mono text-xs text-ink/70">{String(index + 1).padStart(2, "0")} · EN</p><Field disabled={!canEdit} name={`headingEn${index}`} label="Heading" value={sections.en[index]?.heading} /><Area disabled={!canEdit} name={`contentEn${index}`} label="Copy" value={sections.en[index]?.content} /></div></section>)}
        <section className="md:col-span-2 mt-6 border-t border-ink/25 pt-8">
          <p className="eyebrow">Κατάσταση / Status</p>
          <p className="mt-3 text-lg">{page.status === "published" ? "Δημοσιευμένο / Published" : "Πρόχειρο / Draft"}</p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-ink/70">Η δημοσίευση απαιτεί πλήρες ζεύγος GR/EN και ρητή επιβεβαίωση. Δεν αποτελεί νομική, λογιστική, courier ή payment-provider έγκριση.</p>
          {canEdit && page.status === "draft" && <div className="mt-6 flex flex-wrap items-start gap-5"><button name="intent" value="save_draft" className="border border-ink px-6 py-4 text-xs uppercase tracking-[.14em]">Αποθήκευση προχείρου / Save draft</button><label className="flex max-w-xl gap-3 text-sm leading-relaxed"><input type="checkbox" name="publishConfirmation" value="confirmed" className="mt-1 size-4" /><span>Επιβεβαιώνω ότι έλεγξα και τις δύο γλώσσες και θέλω να δημοσιευτεί τώρα. / I confirm publication now.</span></label><button name="intent" value="publish" className="bg-ink px-6 py-4 text-xs uppercase tracking-[.14em] text-paper">Δημοσίευση / Publish</button></div>}
          {canEdit && page.status === "published" && <div className="mt-6 grid gap-5"><label className="flex max-w-xl gap-3 text-sm leading-relaxed"><input type="checkbox" name="publishConfirmation" value="confirmed" className="mt-1 size-4" /><span>Επιβεβαιώνω την άμεση ενημέρωση της ζωντανής σελίδας. / Confirm live update.</span></label><button name="intent" value="publish" className="w-fit bg-ink px-6 py-4 text-xs uppercase tracking-[.14em] text-paper">Αποθήκευση δημοσιευμένων αλλαγών / Update live page</button><label className="flex max-w-xl gap-3 text-sm leading-relaxed text-red-950"><input type="checkbox" name="withdrawConfirmation" value="confirmed" className="mt-1 size-4" /><span>Επιβεβαιώνω την απόσυρση. Θα ενεργοποιηθεί ξανά το ασφαλές δημόσιο κείμενο. / Confirm withdrawal.</span></label><button name="intent" value="withdraw" className="w-fit border border-red-900 px-6 py-4 text-xs uppercase tracking-[.14em] text-red-950">Απόσυρση σε πρόχειρο / Withdraw</button></div>}
        </section>
      </form>
    </main>
  );
}

function Field({ name, label, value, disabled }: { name: string; label: string; value: unknown; disabled: boolean }) { return <label className="mt-4 block text-sm">{label}<input disabled={disabled} name={name} defaultValue={String(value ?? "")} className={field} /></label>; }
function Area({ name, label, value, disabled }: { name: string; label: string; value: unknown; disabled: boolean }) { return <label className="mt-4 block text-sm">{label}<textarea disabled={disabled} name={name} defaultValue={String(value ?? "")} className={`${field} min-h-28`} /></label>; }
