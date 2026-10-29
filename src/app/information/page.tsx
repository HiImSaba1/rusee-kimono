import { cookies } from "next/headers";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { localizedPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata() {
  return localizedPageMetadata({
    path: "/information",
    title: { el: "Πληροφορίες εξυπηρέτησης", en: "Customer information" },
    description: { el: "Αποστολές, πληρωμές, επιστροφές, φροντίδα και πολιτικές της Ruseè.", en: "Ruseè shipping, payments, returns, care and store policies." },
  });
}

const items = [
  { href: "/shipping", image: "/kimono_images_optimized/kimono_design_birds_1.webp", hoverImage: "/kimono_images_optimized/kimono_design_birds_7.webp", el: ["Αποστολές & courier", "Προετοιμασία, tracking και παράδοση."], en: ["Shipping & courier", "Preparation, tracking and delivery."] },
  { href: "/payment-methods", image: "/kimono_images_optimized/kimono_design_birds_2.webp", hoverImage: "/kimono_images_optimized/kimono_design_birds_8.webp", el: ["Τρόποι πληρωμής", "Ασφάλεια, επιβεβαίωση και επιστροφές χρημάτων."], en: ["Payment methods", "Security, verification and refunds."] },
  { href: "/returns", image: "/kimono_images_optimized/kimono_design_birds_3.webp", hoverImage: "/kimono_images_optimized/kimono_design_birds_9.webp", el: ["Επιστροφές", "Διαδικασία, κατάσταση προϊόντος και έλεγχος."], en: ["Returns", "Process, condition and inspection."] },
  { href: "/care-guide", image: "/kimono_images_optimized/kimono_design_birds_4.webp", hoverImage: "/kimono_images_optimized/kimono_design_birds_10.webp", el: ["Φροντίδα & εφαρμογή", "Πλύσιμο, αποθήκευση, εφαρμογή και μέτρηση."], en: ["Care & fit", "Washing, storage, fit and measuring."] },
  { href: "/cookies", image: "/kimono_images_optimized/kimono_design_birds_5.webp", hoverImage: "/kimono_images_optimized/kimono_design_birds_1.webp", el: ["Cookies", "Απαραίτητη αποθήκευση και επιλογές συναίνεσης."], en: ["Cookies", "Essential storage and consent choices."] },
  { href: "/privacy-policy", image: "/kimono_images_optimized/kimono_design_birds_6.webp", hoverImage: "/kimono_images_optimized/kimono_design_birds_2.webp", el: ["Απόρρητο & όροι", "Προσωπικά δεδομένα και όροι καταστήματος."], en: ["Privacy & terms", "Personal information and store terms."] },
] as const;

export default async function InformationPage() {
  const locale = (await cookies()).get("rusee_locale")?.value === "en" ? "en" : "el";

  return <main className="section-shell mx-auto max-w-[110rem]">
    <div className="grid gap-10 md:grid-cols-2 md:items-end md:gap-[var(--gutter)]">
      <div>
        <p className="eyebrow">{locale === "el" ? "Οδηγός πελάτη / 01—06" : "Customer guide / 01—06"}</p>
        <SplitText as="h1" type="lines" triggerOnScroll={false} className="mt-6 font-display text-[clamp(4.5rem,9vw,10rem)] leading-[.8] tracking-[-.07em]">{locale === "el" ? "Όλα, ξεκάθαρα." : "Everything, clearly."}</SplitText>
      </div>
      <p className="max-w-2xl text-lg leading-relaxed text-ink/70 md:justify-self-end md:pb-3">{locale === "el" ? "Από την επιλογή και τη φροντίδα μέχρι την πληρωμή, την παράδοση και την επιστροφή — κάθε πρακτική πληροφορία σε ένα σημείο." : "From selection and care to payment, delivery and returns — every practical detail in one place."}</p>
    </div>

    <div className="mt-[clamp(5rem,10vw,10rem)] grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, index) => {
        const copy = item[locale];
        return <Reveal key={item.href} className={index % 3 === 1 ? "xl:translate-y-16" : ""}>
          <TransitionLink href={item.href} className="shop-design-card group block bg-paper-deep p-3">
            <div className="relative aspect-[4/3] overflow-hidden">
              <ParallaxImage src={item.image} alt="" sizes="(min-width:1280px) 33vw,(min-width:768px) 50vw,100vw" className="absolute inset-0" imageClassName="shop-design-card__primary object-cover" speed={6}/>
              <span className="shop-design-card__alternate absolute inset-0"><ParallaxImage src={item.hoverImage} alt="" sizes="(min-width:1280px) 33vw,(min-width:768px) 50vw,100vw" className="h-full w-full" imageClassName="shop-design-card__alternate-image object-cover" speed={6}/></span>
            </div>
            <div className="flex min-h-44 flex-col justify-between p-5">
              <span className="font-mono text-xs text-ink/70">{String(index + 1).padStart(2, "0")}</span>
              <div><h2 className="font-display text-4xl">{copy[0]}</h2><p className="mt-2 text-sm leading-relaxed text-ink/70">{copy[1]}</p></div>
            </div>
          </TransitionLink>
        </Reveal>;
      })}
    </div>

    <div className="mt-24 border-t border-ink/20 pt-8"><TransitionLink href="/terms" className="text-xs uppercase tracking-[.14em] underline underline-offset-4">{locale === "el" ? "Όροι και προϋποθέσεις" : "Terms & conditions"}</TransitionLink></div>
  </main>;
}
