import Link from "next/link";
import { cookies } from "next/headers";
import { defaultLocale, isLocale, localeCookieName } from "@/i18n/config";

export default async function ShopNotFound() {
  const saved = (await cookies()).get(localeCookieName)?.value;
  const locale = isLocale(saved) ? saved : defaultLocale;
  return <main className="section-shell grid min-h-[75svh] content-center pt-28">
    <p className="eyebrow">404 · Ruseè</p>
    <h1 className="mt-6 max-w-5xl font-display text-[clamp(4rem,10vw,10rem)] leading-[.88]">{locale === "el" ? "Αυτή η μελέτη δεν είναι διαθέσιμη." : "This study is not available."}</h1>
    <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/60">{locale === "el" ? "Το σχέδιο μπορεί να έχει αρχειοθετηθεί ή ο σύνδεσμος να μην είναι πλέον ενεργός." : "The design may have been archived or this link may no longer be active."}</p>
    <Link href="/shop" className="mt-10 w-fit border border-ink bg-ink px-7 py-4 text-sm uppercase tracking-[.15em] text-paper outline-none transition hover:bg-transparent hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">{locale === "el" ? "Επιστροφή στη συλλογή" : "Return to the collection"}</Link>
  </main>;
}
