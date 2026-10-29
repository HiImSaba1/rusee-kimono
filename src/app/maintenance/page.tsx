import type { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = { title: "Προσωρινή συντήρηση | Ruseè", robots: { index: false, follow: false } };

const copy = {
  el: { eyebrow: "Προσωρινή συντήρηση", title: "Επιστρέφουμε σύντομα.", body: "Το ηλεκτρονικό κατάστημα ενημερώνεται με ασφάλεια. Οι υπάρχουσες παραγγελίες και πληρωμές παραμένουν καταγεγραμμένες.", note: "Δοκιμάστε ξανά σε λίγα λεπτά." },
  en: { eyebrow: "Temporary maintenance", title: "We will be back shortly.", body: "The online shop is being updated safely. Existing orders and payments remain recorded.", note: "Please try again in a few minutes." },
} as const;

export default async function MaintenancePage() {
  const locale = (await cookies()).get("rusee_locale")?.value === "en" ? "en" : "el";
  const text = copy[locale];
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-paper px-[var(--gutter)] py-20 text-ink">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-ink" />
      <section className="w-full max-w-5xl border-y border-ink/20 py-[clamp(3rem,9vw,8rem)]">
        <p className="eyebrow text-ink/70">{text.eyebrow}</p>
        <h1 className="mt-7 max-w-4xl font-display text-[clamp(4.5rem,11vw,11rem)] leading-[.82] tracking-[-.065em]">{text.title}</h1>
        <div className="mt-10 grid gap-7 md:grid-cols-[1fr_.35fr] md:items-end">
          <p className="max-w-2xl text-lg leading-relaxed text-ink/70">{text.body}</p>
          <p className="font-mono text-xs uppercase tracking-[.13em] text-ink/70 md:text-right">{text.note}</p>
        </div>
      </section>
    </main>
  );
}
