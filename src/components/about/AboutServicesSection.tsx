"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "motion/react";
import { useLocale } from "@/i18n/LocaleProvider";

const services = [
  {
    title: { el: "Η σιλουέτα", en: "The silhouette" },
    summary: {
      el: "Μία ρευστή αρχιτεκτονική, δουλεμένη μέσα από την αναλογία, την πτώση του υφάσματος και την ελευθερία να τη φορέσετε με τον δικό σας τρόπο.",
      en: "One fluid architecture, refined through proportion, drape and the freedom to style it your way.",
    },
    capabilities: {
      el: ["Ανοιχτή γραμμή", "Μελετημένη πτώση", "Εύκολοι συνδυασμοί"],
      en: ["Open form", "Considered drape", "Easy layering"],
    },
    image: "/kimono_images_optimized/kimono_design_birds_8.webp",
  },
  {
    title: { el: "Η ατμόσφαιρα", en: "The atmosphere" },
    summary: {
      el: "Βοτανικές, ορυκτές και νυχτερινές αναφορές χαρίζουν στην ίδια φόρμα μια διαφορετική συναισθηματική θερμοκρασία.",
      en: "Botanical, mineral and nocturnal studies give the same form a different emotional temperature.",
    },
    capabilities: {
      el: ["Πρωτότυπο μοτίβο", "Χρωματικές μελέτες", "Περιορισμένες σειρές"],
      en: ["Original print", "Colour studies", "Limited runs"],
    },
    image: "/kimono_images_optimized/kimono_design_lily_pond_13.webp",
  },
  {
    title: { el: "Η τελετουργία", en: "The ritual" },
    summary: {
      el: "Ένα κομμάτι στο οποίο επιστρέφετε ξανά — από τα ήσυχα πρωινά έως τα ταξίδια, τα δείπνα και τις στιγμές ανάμεσα στις περιστάσεις.",
      en: "A piece made to return to—from quiet mornings to travel, dinners and the space between occasions.",
    },
    capabilities: {
      el: ["Καθημερινή άνεση", "Ντύσιμο περιστάσεων", "Φτιαγμένο για επανάληψη"],
      en: ["Everyday ease", "Occasion dressing", "Made for repetition"],
    },
    image: "/kimono_images_optimized/kimono_design_stripes_7.webp",
  },
] as const;

export function AboutServicesSection() {
  const { locale } = useLocale();
  return (
    <section className="py-10 lg:py-14">
      <div className="flex flex-col gap-10 bg-paper-deep px-[var(--gutter)] py-12 lg:gap-14 lg:py-16">
        <div>
          <p className="eyebrow text-ink/75">{locale === "el" ? "Η πρακτική της Ruseè" : "The Ruseè practice"}</p>
          <p className="mt-5 w-full text-[clamp(1.5rem,3.3vw,3.5rem)] leading-[1.05] tracking-[-.035em]">
            {locale === "el"
              ? "Ένα ένδυμα, μελετημένο από κάθε γωνία. Η φόρμα, η ατμόσφαιρα και η τελετουργία συνδυάζονται σε ένα κομμάτι εκφραστικό, χωρίς να γίνεται υπερβολικά πολύτιμο."
              : "One garment, considered from every angle. Form, atmosphere and ritual align to create a piece that feels expressive without becoming precious."}
          </p>
        </div>
        <ul data-about-services-list className="flex w-full flex-col bg-paper px-3 text-ink lg:px-4">
          {services.map((service, index) => <ServiceCard key={service.title.en} service={service} index={index} locale={locale} />)}
        </ul>
      </div>
    </section>
  );
}

function ServiceCard({ service, index, locale }: { service: (typeof services)[number]; index: number; locale: "el" | "en" }) {
  const keywords = useRef<HTMLUListElement>(null);
  const image = useRef<HTMLDivElement>(null);
  const keywordsInView = useInView(keywords, { once: true, margin: "0px 0px -15% 0px" });
  const imageInView = useInView(image, { once: true, margin: "0px 0px -10% 0px" });
  const { scrollYProgress } = useScroll({ target: image, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-3vh", "3vh"]);
  const title = service.title[locale];

  return <li className="flex w-full flex-col border-ink/15 py-7 not-last:border-b lg:grid lg:min-h-[20rem] lg:grid-cols-[5fr_30fr_30fr_35fr] lg:items-center lg:gap-x-2 lg:py-8"><p className="eyebrow mb-3 text-ink/75 lg:mb-0">0{index + 1}</p><h3 className="mb-6 font-display text-[clamp(2.4rem,4vw,5rem)] uppercase leading-none lg:mb-0 lg:px-2">{title}</h3><div className="mb-8 flex flex-col gap-5 lg:mb-0 lg:px-2"><p className="text-[clamp(1rem,1.2vw,1.25rem)] leading-[1.3] text-ink/70">{service.summary[locale]}</p><ul ref={keywords} className="flex flex-wrap gap-1.5">{service.capabilities[locale].map((keyword, keywordIndex) => <motion.li key={keyword} initial={{ y: 24, opacity: 0, scale: .9 }} animate={keywordsInView ? { y: 0, opacity: 1, scale: 1 } : {}} transition={{ duration: 1, delay: keywordIndex * .025, ease: [.16, 1, .3, 1] }} className="bg-ink px-2 pb-1.5 pt-2 font-mono text-[.62rem] uppercase tracking-wider text-paper">{keyword}</motion.li>)}</ul></div><motion.div className="min-w-0 lg:h-[16rem] lg:pl-2"><div ref={image} className="relative h-[220px] w-full overflow-hidden sm:h-[400px] lg:h-full"><motion.div style={{ y }} initial={{ clipPath: "polygon(0 0,100% 0,100% 0,0 0)" }} animate={imageInView ? { clipPath: "polygon(0 0,100% 0,100% 100%,0 100%)" } : {}} transition={{ duration: 1.6, ease: [.87, 0, .13, 1] }} className="absolute -top-[10%] inset-x-0 h-[120%]"><Image src={service.image} alt={title} fill sizes="(max-width:1024px) 100vw,35vw" className="object-cover image-zoom" /></motion.div></div></motion.div></li>;
}
