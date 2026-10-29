import Link from "next/link";
import { requireAdmin } from "@/features/admin-auth/session";
import { informationPageLabels, listAdminInformationPages } from "@/features/content/information-pages";

export const dynamic = "force-dynamic";

export default async function InformationAdminPage() {
  await requireAdmin();
  const pages = await listAdminInformationPages();
  return (
    <main className="px-[var(--gutter)] py-12">
      <p className="eyebrow">Πελάτες / Customer information</p>
      <h1 className="mt-3 font-display text-[clamp(4rem,8vw,8rem)] leading-[.82] tracking-[-.06em]">Σελίδες πληροφοριών.</h1>
      <p className="mt-7 max-w-2xl text-sm leading-relaxed text-ink/70">Επεξεργαστείτε μόνο επιβεβαιωμένο κείμενο. Η δημοσίευση αλλάζει μόνο το δημόσιο περιεχόμενο και δεν ενεργοποιεί courier, πληρωμές, ΦΠΑ ή νομική έγκριση.</p>
      <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pages.map((page, index) => {
          const label = informationPageLabels[page.slug];
          return (
            <article key={page.slug} className="bg-paper-deep p-6">
              <div className="flex justify-between font-mono text-xs text-ink/70"><span>{String(index + 1).padStart(2, "0")}</span><span className={page.status === "published" ? "text-green-900" : "text-amber-900"}>{page.status === "published" ? "Δημοσιευμένο / Published" : "Πρόχειρο / Draft"}</span></div>
              <h2 className="mt-12 font-display text-4xl">{label.el}</h2>
              <p className="mt-2 text-sm text-ink/70">{label.en}</p>
              <div className="mt-8 flex flex-wrap gap-4 text-xs uppercase tracking-[.13em]">
                <Link href={`/admin/information/${page.slug}`} className="underline-offset-4 hover:underline focus-visible:underline">Επεξεργασία / Edit</Link>
                <Link href={`/admin/information/${page.slug}/preview`} className="underline-offset-4 hover:underline focus-visible:underline">Προεπισκόπηση / Preview</Link>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
