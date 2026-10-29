import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/features/admin-auth/session";
import { assessInformationPageReadiness, getAdminInformationPage, informationPageLabels, informationPageSlug } from "@/features/content/information-pages";

export const dynamic = "force-dynamic";

export default async function InformationPreviewPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ locale?: string }> }) {
  const parsedSlug = informationPageSlug.safeParse((await params).slug);
  if (!parsedSlug.success) notFound();
  await requireAdmin();
  const page = await getAdminInformationPage(parsedSlug.data);
  if (!page) notFound();
  const locale = (await searchParams).locale === "en" ? "en" : "el";
  const readiness = assessInformationPageReadiness(page);
  const label = informationPageLabels[parsedSlug.data];
  const copy = locale === "el"
    ? { eyebrow: page.eyebrow_el, title: page.title_el, intro: page.intro_el, sections: readiness.sections.el }
    : { eyebrow: page.eyebrow_en, title: page.title_en, intro: page.intro_en, sections: readiness.sections.en };

  return (
    <main className="px-[var(--gutter)] py-12">
      <nav aria-label="Ενέργειες προεπισκόπησης" className="flex flex-wrap items-center gap-5 text-xs uppercase tracking-[.13em]">
        <Link href={`/admin/information/${parsedSlug.data}`}>← Επεξεργασία / Edit</Link>
        <Link href={`/admin/information/${parsedSlug.data}/preview?locale=el`} aria-current={locale === "el" ? "page" : undefined} className={locale === "el" ? "underline underline-offset-4" : ""}>GR</Link>
        <Link href={`/admin/information/${parsedSlug.data}/preview?locale=en`} aria-current={locale === "en" ? "page" : undefined} className={locale === "en" ? "underline underline-offset-4" : ""}>EN</Link>
        {page.status === "published" && <Link href={`/${parsedSlug.data}`} className="ml-auto">Ζωντανή σελίδα / Live ↗</Link>}
      </nav>

      <section aria-labelledby="preview-status" className={`mt-8 p-5 ${readiness.ready ? "bg-emerald-950 text-white" : "bg-amber-100 text-ink"}`}>
        <p id="preview-status" className="font-mono text-xs uppercase tracking-[.13em]">{page.status === "published" ? "Δημοσιευμένο / Published" : "Πρόχειρο / Draft"} · {readiness.ready ? "Πλήρες δίγλωσσο περιεχόμενο / Structurally ready" : "Δεν είναι έτοιμο για δημοσίευση / Not ready"}</p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed">{readiness.ready ? `Ελέγξτε τις ${readiness.sectionCount} ενότητες και στις δύο γλώσσες πριν τη δημοσίευση.` : "Προσθέστε τουλάχιστον μία πλήρη, αντίστοιχη ενότητα GR/EN. Το δημόσιο site συνεχίζει να χρησιμοποιεί το ασφαλές προεπιλεγμένο κείμενο."}</p>
        <p className="mt-3 text-xs leading-relaxed opacity-80">Ο έλεγχος δομής δεν αποτελεί νομική, λογιστική, courier ή payment-provider έγκριση.</p>
      </section>

      <article className="mx-auto mt-16 max-w-6xl" lang={locale} data-testid="information-draft-preview">
        <p className="eyebrow">{copy.eyebrow || label[locale]}</p>
        <h1 className="mt-6 max-w-5xl font-display text-[clamp(4rem,10vw,10rem)] leading-[.82] tracking-[-.06em]">{copy.title || label[locale]}</h1>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/70">{copy.intro}</p>
        <div className="mt-14">
          {copy.sections.map((section, index) => <section key={`${section.heading}-${index}`} className="grid gap-5 border-t border-ink/20 py-9 md:grid-cols-[5rem_1fr]"><span className="font-mono text-sm text-ink/70">{String(index + 1).padStart(2, "0")}</span><div><h2 className="font-display text-4xl">{section.heading}</h2><p className="mt-4 max-w-3xl leading-relaxed text-ink/65">{section.content}</p></div></section>)}
          {!copy.sections.length && <p className="border-t border-ink/20 py-10 text-sm text-ink/65">Δεν υπάρχουν ακόμη ενότητες προεπισκόπησης. / No preview sections yet.</p>}
        </div>
      </article>
    </main>
  );
}
