"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { Minus, Plus } from "lucide-react";
import { gsap, SplitText } from "@/lib/animations/gsap";

export type FaqEntry = {
  category: string;
  question: string;
  answer: string;
};

function FaqItem({ item, index, open, onToggle }: { item: FaqEntry; index: number; open: boolean; onToggle: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const question = useRef<HTMLSpanElement>(null);
  const category = useRef<HTMLSpanElement>(null);
  const panelId = `faq-answer-${index}`;

  useGSAP(() => {
    if (!question.current || !category.current || !root.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const questionSplit = SplitText.create(question.current, { type: "words", mask: "words" });
    const categorySplit = SplitText.create(category.current, { type: "words", mask: "words" });
    const tween = gsap.fromTo(
      [categorySplit.words, questionSplit.words],
      { yPercent: 105 },
      {
        yPercent: 0,
        duration: 1,
        stagger: 0.05,
        ease: "power4.out",
        scrollTrigger: { trigger: root.current, start: "top 90%", toggleActions: "play reverse play reverse" },
      },
    );

    return () => {
      tween.kill();
      categorySplit.revert();
      questionSplit.revert();
    };
  }, { scope: root });

  useGSAP(() => {
    if (!content.current || !root.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const words = gsap.utils.toArray<HTMLElement>(".faq-word-inner", root.current);
    if (reduced) {
      gsap.set(content.current, { height: open ? "auto" : 0, opacity: open ? 1 : 0 });
      gsap.set(words, { yPercent: 0, opacity: open ? 1 : 0 });
      return;
    }

    if (open) {
      const timeline = gsap.timeline();
      timeline
        .to(content.current, { height: "auto", opacity: 1, duration: 0.5, ease: "power3.inOut" })
        .fromTo(words, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4, stagger: 0.008, ease: "power3.out" }, "-=0.2");
      return () => timeline.kill();
    }

    const tween = gsap.to(content.current, { height: 0, opacity: 0, duration: 0.4, ease: "power3.inOut" });
    return () => tween.kill();
  }, { scope: root, dependencies: [open], revertOnUpdate: true });

  return (
    <div ref={root} className="group relative w-full overflow-hidden border-t border-ink/15 last:border-b">
      <div aria-hidden="true" className="absolute inset-0 z-0 -translate-y-[115%] -rotate-2 bg-ink transition-transform duration-500 ease-[cubic-bezier(.215,.61,.355,1)] group-hover:translate-y-0 group-hover:rotate-0 group-focus-within:translate-y-0 group-focus-within:rotate-0" />
      <button data-structural-control type="button" aria-expanded={open} aria-controls={panelId} onClick={onToggle} className="relative z-10 flex w-full flex-col items-start px-4 pb-4 pt-6 text-left outline-none">
        <span className="mb-2 flex w-full items-center justify-between">
          <span ref={category} className="text-xs uppercase tracking-[.16em] text-ink/60 transition-colors duration-500 group-hover:text-sage group-focus-within:text-sage">{item.category}</span>
          <span aria-hidden="true" className="text-ink transition-colors duration-500 group-hover:text-sage group-focus-within:text-sage">{open ? <Minus className="size-4" /> : <Plus className="size-4" />}</span>
        </span>
        <span ref={question} className="font-display text-[clamp(1.65rem,2.6vw,3rem)] leading-[1.08] tracking-[-.035em] text-ink transition-colors duration-500 group-hover:text-paper group-focus-within:text-paper">{item.question}</span>
      </button>
      <div ref={content} id={panelId} role="region" aria-hidden={!open} className="relative z-10 h-0 overflow-hidden opacity-0">
        <p className="flex max-w-3xl flex-wrap gap-x-[.3em] px-4 pb-8 pt-2 text-[clamp(1.1rem,1rem+.35vw,1.35rem)] leading-relaxed tracking-[-.015em] text-ink/80 transition-colors duration-500 group-hover:text-paper/90 group-focus-within:text-paper/90">
          {item.answer.split(" ").map((word, wordIndex) => <span key={`${word}-${wordIndex}`} className="inline-block overflow-hidden"><span className="faq-word-inner inline-block opacity-0">{word}</span></span>)}
        </p>
      </div>
    </div>
  );
}

export function FaqAccordion({ items }: { items: FaqEntry[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const midpoint = Math.ceil(items.length / 2);
  const columns = [items.slice(0, midpoint), items.slice(midpoint)];

  return (
    <div className="grid items-start gap-x-12 lg:grid-cols-2">
      {columns.map((column, columnIndex) => (
        <div key={columnIndex} className="flex flex-col">
          {column.map((item, itemIndex) => {
            const index = columnIndex === 0 ? itemIndex : midpoint + itemIndex;
            return <FaqItem key={item.question} item={item} index={index} open={openIndex === index} onToggle={() => setOpenIndex(openIndex === index ? null : index)} />;
          })}
        </div>
      ))}
    </div>
  );
}
