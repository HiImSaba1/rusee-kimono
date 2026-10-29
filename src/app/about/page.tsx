import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { Reveal } from "@/components/animations/Reveal";
import { AboutServicesSection } from "@/components/about/AboutServicesSection";
import { localizedPageMetadata } from "@/lib/seo/metadata";
import { EditorialSectionChoreography } from "@/components/animations/EditorialSectionChoreography";

const aboutHeroImage = "/kimono_images_optimized/kimono_design_seabed_5.webp";
const aboutCtaImage = "/kimono_images_optimized/kimono_design_liquid_geo_8.webp";

export function generateMetadata() { return localizedPageMetadata({ path: "/about", title: { el: "Σχετικά με τη Ruseè", en: "About Ruseè" }, description: { el: "Η προσέγγιση της Ruseè σε μία ανοιχτή σιλουέτα κιμονό, το μοτίβο και την καθημερινή κίνηση.", en: "The Ruseè approach to one open kimono silhouette, pattern and everyday movement." }, image: aboutHeroImage }); }

export default function AboutPage() {
  return (
    <EditorialSectionChoreography>
      <section className="section-shell pb-12"><p className="eyebrow">About Ruseè</p><h1 className="mt-8 max-w-6xl font-display text-[clamp(4.5rem,11vw,12rem)] leading-[0.84] tracking-[-0.065em]">Clothes for the space<br /><em>between occasions.</em></h1></section>
      <section className="grid lg:grid-cols-[40%_60%]"><ParallaxImage src={aboutHeroImage} alt="Ruseè kimono worn by the sea" priority sizes="(min-width:1024px) 40vw, 100vw" className="min-h-[70svh]" speed={8} /><div className="relative flex items-end bg-paper-deep p-[var(--gutter)] py-16"><Image src="/rusee-flower-logo.png" alt="" aria-hidden="true" width={72} height={102} className="absolute right-[var(--gutter)] top-[var(--gutter)] h-auto w-14 object-contain"/><p className="relative z-10 max-w-3xl font-display text-[clamp(2.5rem,4.5vw,5rem)] leading-[0.98] tracking-[-0.04em]">We believe the most loved garments are not reserved. They enter the rhythm of a life.</p></div></section>
      <section className="section-shell grid gap-14 lg:grid-cols-12"><Reveal className="lg:col-span-4"><p className="eyebrow">Our approach</p></Reveal><Reveal className="space-y-8 text-lg leading-relaxed text-ink/65 lg:col-span-7"><p>Ruseè begins in Greece with an ancient, generous idea: a garment can create shape without restricting the body. We reinterpret the open robe as an everyday editorial piece.</p><p>Instead of seasons full of noise, we work around one silhouette and explore it through print, colour and feeling. Fewer decisions. Better ones. A wardrobe with memory.</p></Reveal></section>
      <AboutServicesSection />
      <section className="px-[var(--gutter)] pb-[var(--section)]"><div className="grid border-y border-ink/20 md:grid-cols-3">{[["01","Ease","A soft architecture that follows movement."],["02","Expression","Prints with atmosphere rather than trend."],["03","Return","Pieces designed to be reached for again."]].map(([n,title,text]) => <article key={n} className="border-b border-ink/20 py-8 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"><p className="eyebrow text-ink/70">{n}</p><h2 className="mt-8 font-display text-5xl">{title}</h2><p className="mt-5 max-w-xs text-sm leading-relaxed text-ink/70">{text}</p></article>)}</div></section>
      <section className="relative min-h-[80svh] overflow-hidden"><ParallaxImage src={aboutCtaImage} alt="Ruseè kimono styled outdoors" sizes="100vw" className="absolute inset-0" speed={8} /><div className="absolute inset-0 grid place-items-center bg-ink/25 p-6 text-center text-paper"><div><p className="eyebrow">Find your variation</p><h2 className="mt-5 font-display text-[clamp(4rem,9vw,10rem)] leading-[0.86] tracking-[-0.06em]">Wear the story.</h2><Link href="/shop" className="mt-8 inline-flex items-center gap-3 border-b border-paper pb-2 text-xs uppercase tracking-[0.16em]">Explore the collection <ArrowUpRight className="size-4" /></Link></div></div></section>
    </EditorialSectionChoreography>
  );
}
