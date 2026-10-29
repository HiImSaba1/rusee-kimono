"use client";

import Image from "next/image";
import { Reveal } from "@/components/animations/Reveal";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { useLocale } from "@/i18n/LocaleProvider";
import { kimonoDesignModelImage } from "@/lib/media/kimono-images";

const copy = {
  el: {
    eyebrow: "Η ανατομία της άνεσης",
    title: <>Ύφασμα, χρώμα,<br/><em>κίνηση.</em></>,
    intro: "Το κιμονό Ruseè βασίζεται σε μία ιδέα: ένα όμορφο ένδυμα πρέπει να αφήνει χώρο στον άνθρωπο που το φορά.",
    alts: ["Ύφασμα κιμονό Ruseè σε κίνηση", "Κιμονό Ruseè σε εξωτερικό χώρο", "Κιμονό Ruseè φορεμένο σε κίνηση"],
    features: [
      { number: "01", title: "Μία ανοιχτή σιλουέτα", copy: "Μία γενναιόδωρη φόρμα, σχεδιασμένη για ελεύθερη κίνηση, εύκολους συνδυασμούς και αβίαστη αίσθηση από το πρωί μέχρι το βράδυ." },
      { number: "02", title: "Μοτίβο με παρουσία", copy: "Κάθε ατμόσφαιρα ξεκινά από το χρώμα και τον ρυθμό και ζωντανεύει όταν το ύφασμα συναντά το σώμα." },
      { number: "03", title: "Μελετημένο ύφασμα", copy: "Η ανάλαφρη, ρευστή υφή χαρίζει σε κάθε σχέδιο τη δική του πτώση, διατηρώντας τη χαρακτηριστική αρχιτεκτονική του κιμονό." },
      { number: "04", title: "Φτιαγμένο για να το κατοικείς", copy: "Όχι κοστούμι και ποτέ ένα στατικό αντικείμενο: ένα κομμάτι που διαμορφώνεται από τη χειρονομία, την προσωπικότητα και τον τρόπο που επιλέγετε να το φορέσετε." },
    ],
  },
  en: {
    eyebrow: "The anatomy of ease",
    title: <>Cloth, colour,<br/><em>movement.</em></>,
    intro: "The Ruseè kimono is built around one idea: a beautiful garment should make room for the person wearing it.",
    alts: ["Ruseè kimono fabric in motion", "Ruseè kimono styled outdoors", "Ruseè kimono worn in motion"],
    features: [
      { number: "01", title: "An open silhouette", copy: "One generous form designed to move freely, layer easily and feel effortless from morning into evening." },
      { number: "02", title: "Print with presence", copy: "Each atmosphere begins with colour and rhythm, then comes alive when the cloth meets the body." },
      { number: "03", title: "Considered cloth", copy: "A light, fluid handle gives every design its drape while preserving the kimono’s distinctive architecture." },
      { number: "04", title: "Made to inhabit", copy: "Not a costume and never a static object: a piece shaped by gesture, personality and the way you choose to wear it." },
    ],
  },
} as const;

export function KimonoCraftSection() {
  const { locale } = useLocale();
  const content = copy[locale];
  const portrait = kimonoDesignModelImage(6, 2)!;
  const detailLeft = kimonoDesignModelImage(4, 0)!;
  const detailRight = kimonoDesignModelImage(8, 3)!;

  return <section className="overflow-hidden border-b border-ink/20 px-[var(--gutter)] py-[clamp(5rem,10vw,10rem)]">
    <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_.6fr]">
      <Reveal><p className="eyebrow">{content.eyebrow}</p><h2 className="mt-4 max-w-5xl font-display text-[clamp(4rem,9vw,10rem)] leading-[.82] tracking-[-.065em]">{content.title}</h2></Reveal>
      <Reveal delay={0.12}><p className="max-w-lg text-lg leading-relaxed text-ink/70">{content.intro}</p></Reveal>
    </div>

    <div className="relative mt-[clamp(4rem,9vw,9rem)] min-h-[64rem] lg:min-h-[68rem]">
      <div className="absolute left-0 top-[12%] hidden w-[22%] lg:block"><ParallaxImage src={detailLeft} alt={content.alts[0]} sizes="22vw" className="aspect-square" speed={5}/></div>
      <div className="absolute right-0 top-[4%] hidden w-[20%] lg:block"><ParallaxImage src={detailRight} alt={content.alts[1]} sizes="20vw" className="aspect-square" speed={7}/></div>
      <div className="relative z-10 mx-auto w-[82%] max-w-[30rem] overflow-hidden lg:w-[38%]"><ParallaxImage src={portrait} alt={content.alts[2]} sizes="(min-width:1024px) 38vw, 82vw" className="aspect-square" speed={8}/></div>

      <div className="relative z-20 mx-auto -mt-10 grid max-w-6xl gap-px bg-ink/20 sm:grid-cols-2 lg:-mt-24">
        {content.features.map((feature) => <Reveal key={feature.number} className="bg-paper p-[clamp(1.5rem,4vw,3.5rem)]">
          <div className="flex items-start justify-between gap-5"><span className="font-mono text-base font-semibold">{feature.number}</span><Image src="/rusee-flower-logo.png" alt="" aria-hidden="true" width={48} height={68} className="h-auto w-10 object-contain"/></div>
          <h3 className="mt-12 font-display text-[clamp(2.5rem,4.5vw,4.5rem)] leading-none tracking-[-.04em]">{feature.title}</h3>
          <p className="mt-6 max-w-lg text-lg leading-[1.35] text-ink/75">{feature.copy}</p>
        </Reveal>)}
      </div>
    </div>
  </section>;
}
