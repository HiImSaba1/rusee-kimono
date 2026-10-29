"use client";

import { useId, useState } from "react";

export function GuideAccordion({ question, answer, answerEn, defaultOpen = false }: { question:string; answer:string; answerEn:string; defaultOpen?:boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();
  return <article data-testid="guide-question">
    <h3>
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)} className="flex w-full cursor-pointer items-center justify-between gap-6 py-5 text-left text-sm font-semibold uppercase tracking-[.08em] outline-none focus-visible:ring-2 focus-visible:ring-ink">
        <span>{question}</span><span aria-hidden className={`text-xl transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
    </h3>
    <div id={panelId} hidden={!open} className="max-w-4xl pb-6 normal-case"><p className="text-base leading-relaxed text-ink">{answer}</p><p lang="en" className="mt-3 text-sm leading-relaxed text-ink/70">{answerEn}</p></div>
  </article>;
}
