"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { contactCopy } from "@/features/contact/copy";
import { contactSubjects } from "@/features/contact/schema";
import { useLocale } from "@/i18n/LocaleProvider";
import { gsap } from "@/lib/animations/gsap";
import { ParallaxImage } from "@/components/animations/ParallaxImage";
import { kimonoDesignModelImage } from "@/lib/media/kimono-images";

const input =
  "w-full border-b border-ink/20 bg-transparent py-3 text-sm uppercase outline-none placeholder:text-ink/25 focus:border-ink";
const contactPrimaryImage = kimonoDesignModelImage(13, 5)!;
const contactHoverImage = kimonoDesignModelImage(11, 1)!;

type FormStatus = "idle" | "sending" | "success" | "invalid" | "too_fast" | "expired" | "rate_limited" | "unavailable";
type FeedbackStatus = Exclude<FormStatus, "idle" | "sending">;

export function ContactStudio() {
  const root = useRef<HTMLElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const startedAt = useRef<number | null>(null);
  const submissionId = useRef<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");
  const { locale } = useLocale();
  const copy = contactCopy[locale];

  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });
      timeline
        .set(".contact-left", { xPercent: -100 })
        .set(".contact-image", { scale: 1.15 })
        .set(".contact-reveal", { opacity: 0, y: 40 })
        .set(".contact-form", { opacity: 0, x: 60 })
        .to(".contact-left", { xPercent: 0, duration: 1.6, ease: "expo.inOut" })
        .to(".contact-image", { scale: 1, duration: 2 }, "-=1")
        .to(".contact-reveal", { y: 0, opacity: 1, stagger: 0.1, duration: 1.2 }, "-=1")
        .to(".contact-form", { x: 0, opacity: 1, duration: 1.4 }, "-=.8");
      return () => timeline.kill();
    },
    { scope: root },
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");

    const data = new FormData(event.currentTarget);
    submissionId.current ??= crypto.randomUUID();
    const payload = {
      submissionId: submissionId.current,
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      subject: String(data.get("subject") ?? ""),
      orderNumber: String(data.get("orderNumber") ?? ""),
      message: String(data.get("message") ?? ""),
      website: String(data.get("website") ?? ""),
      locale,
      startedAt: startedAt.current ?? Date.now(),
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({ code: "unavailable" })) as { code?: string };
      if (response.ok && result.code === "accepted") {
        setStatus("success");
        form.current?.reset();
        submissionId.current = null;
        startedAt.current = Date.now();
        return;
      }
      const known = ["invalid", "too_fast", "expired", "rate_limited"] as const;
      setStatus(known.includes(result.code as (typeof known)[number]) ? result.code as FormStatus : "unavailable");
    } catch {
      setStatus("unavailable");
    }
  }

  const feedbackStatus: FeedbackStatus | null = status === "idle" || status === "sending" ? null : status;
  const feedback = feedbackStatus ? copy[feedbackStatus] : null;

  return (
    <section ref={root} className="grid min-h-[calc(100svh-5rem)] overflow-hidden bg-paper lg:grid-cols-2">
      <div className="contact-left group/contact relative min-h-[52svh] overflow-hidden lg:min-h-screen">
        <div className="contact-image absolute inset-0">
          <div className="absolute inset-0 opacity-100 transition-opacity duration-[2400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover/contact:opacity-20">
            <ParallaxImage
              src={contactPrimaryImage}
              alt="Ruseè kimono portrait by the sea"
              priority
              sizes="(min-width:1024px) 50vw,100vw"
              className="h-full w-full"
              imageClassName="object-cover transition-transform duration-[2800ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover/contact:scale-[1.035]"
              speed={7}
            />
          </div>
          <div className="absolute inset-0 opacity-0 transition-opacity duration-[2400ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover/contact:opacity-100">
            <ParallaxImage
              src={contactHoverImage}
              alt="Ruseè kimono styled outdoors"
              sizes="(min-width:1024px) 50vw,100vw"
              className="h-full w-full"
              imageClassName="object-cover transition-transform duration-[2800ms] ease-[cubic-bezier(.16,1,.3,1)] scale-[1.025] group-hover/contact:scale-100"
              speed={5}
            />
          </div>
          <div className="absolute inset-0 bg-ink/15" />
        </div>
      </div>
      <div className="flex items-center p-[var(--gutter)] py-14">
        <div className="mx-auto w-full max-w-3xl">
          <div className="contact-reveal flex flex-col gap-3 border-b border-ink pb-4 md:flex-row md:items-baseline md:justify-between">
            <span className="eyebrow">{copy.eyebrow}</span>
            <span className="font-display text-3xl uppercase tracking-[-.03em]">{copy.strapline}</span>
          </div>
          <div className="contact-reveal mt-8">
            <h1 className="font-display text-[clamp(4rem,8vw,9rem)] leading-[.8] tracking-[-.06em]">
              {copy.titleLine} <em>{copy.titleEmphasis}</em>
            </h1>
            <p className="mt-7 max-w-lg leading-relaxed text-ink/70">{copy.intro}</p>
          </div>
          <form ref={form} className="contact-form mt-10 space-y-6" onSubmit={submit} noValidate>
            <div className="pointer-events-none absolute -left-[10000px] h-px w-px overflow-hidden" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="eyebrow">
                {copy.nameLabel}
                <input required minLength={2} maxLength={140} name="name" autoComplete="name" className={input} placeholder={copy.namePlaceholder} />
              </label>
              <label className="eyebrow">
                {copy.emailLabel}
                <input required type="email" maxLength={254} name="email" autoComplete="email" className={input} placeholder={copy.emailPlaceholder} />
              </label>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <label htmlFor="contact-subject" className="eyebrow">
                {copy.subjectLabel}
                <select id="contact-subject" name="subject" className={input} defaultValue="order_question">
                  {contactSubjects.map((subject) => <option key={subject} value={subject}>{copy.subjects[subject]}</option>)}
                </select>
              </label>
              <label className="eyebrow">
                {copy.orderLabel}
                <input name="orderNumber" maxLength={40} className={input} placeholder={copy.orderPlaceholder} />
              </label>
            </div>
            <label className="eyebrow block">
              {copy.messageLabel}
              <textarea required minLength={10} maxLength={4_000} name="message" rows={4} className={`${input} resize-none`} placeholder={copy.messagePlaceholder} />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-5">
              <button
                disabled={status === "sending"}
                className="group flex items-center gap-3 border border-ink px-6 py-4 text-xs uppercase tracking-[.16em] transition-colors hover:bg-ink hover:text-paper disabled:cursor-wait disabled:opacity-50"
              >
                {status === "sending" ? copy.sending : copy.send}
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </button>
              <a href="mailto:hello@rusee.gr" className="border-b border-ink/30 pb-1 text-sm">hello@rusee.gr</a>
            </div>
            <p
              aria-live="polite"
              className={`min-h-6 text-sm ${status === "success" ? "text-green-900" : feedback ? "text-red-900" : "text-ink/50"}`}
            >
              {feedback}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
