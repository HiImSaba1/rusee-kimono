"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);
  return submitted ? <p className="mt-6 text-sm">Thank you. You are on the list.</p> : (
    <form className="mt-4 flex max-w-xl border-b border-current sm:mt-7" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
      <label htmlFor="newsletter-email" className="sr-only">Email address</label>
      <input id="newsletter-email" required type="email" placeholder="Email address" className="min-w-0 flex-1 bg-transparent py-2.5 text-xs outline-none placeholder:text-current/45 sm:py-4 sm:text-sm" />
      <button aria-label="Join the newsletter" className="px-2"><ArrowRight className="size-5" strokeWidth={1.5} /></button>
    </form>
  );
}
