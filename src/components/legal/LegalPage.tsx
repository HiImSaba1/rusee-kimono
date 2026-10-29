import { Reveal } from "@/components/animations/Reveal";
import { SplitText } from "@/components/animations/SplitText";
import type { ReactNode } from "react";

export type LegalSection = { heading: string; content: string };

export function LegalPage({ eyebrow, title, intro, sections, footer }: { eyebrow: string; title: string; intro: string; sections: LegalSection[]; footer?: ReactNode }) {
  return (
    <article className="section-shell mx-auto max-w-[96rem]">
      <header className="border-b border-ink/20 pb-[clamp(4rem,9vw,9rem)]">
        <p className="eyebrow">{eyebrow}</p>
        <SplitText as="h1" type="lines" triggerOnScroll={false} className="mt-6 max-w-6xl overflow-visible py-[.14em] font-display text-[clamp(4.5rem,11vw,12rem)] leading-[.82] tracking-[-.065em]">{title}</SplitText>
        <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink/70">{intro}</p>
      </header>
      <div className="grid gap-12 pt-14 lg:grid-cols-[.3fr_.7fr]">
        <p className="eyebrow text-ink/70">Policy index / {String(sections.length).padStart(2, "0")}</p>
        <div>
          {sections.map((section, index) => (
            <Reveal key={section.heading} className="grid gap-5 border-t border-ink/20 py-9 md:grid-cols-[5rem_1fr]">
              <span className="font-mono text-sm text-ink/70">{String(index + 1).padStart(2, "0")}</span>
              <div><h2 className="overflow-visible py-[.08em] font-display text-4xl">{section.heading}</h2><p className="mt-4 max-w-3xl text-base leading-relaxed text-ink/65">{section.content}</p></div>
            </Reveal>
          ))}
        </div>
      </div>
      {footer}
    </article>
  );
}
