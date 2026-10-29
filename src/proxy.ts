import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { shouldShowMaintenance } from "@/lib/operations/maintenance";

export function proxy(request: NextRequest) {
  if (!shouldShowMaintenance(request.nextUrl.pathname)) return NextResponse.next();

  const english = request.cookies.get("rusee_locale")?.value === "en";
  const text = english
    ? { eyebrow: "Temporary maintenance", title: "We will be back shortly.", body: "The online shop is being updated safely. Existing orders and payments remain recorded.", note: "Please try again in a few minutes." }
    : { eyebrow: "Προσωρινή συντήρηση", title: "Επιστρέφουμε σύντομα.", body: "Το ηλεκτρονικό κατάστημα ενημερώνεται με ασφάλεια. Οι υπάρχουσες παραγγελίες και πληρωμές παραμένουν καταγεγραμμένες.", note: "Δοκιμάστε ξανά σε λίγα λεπτά." };
  const document = `<!doctype html><html lang="${english ? "en" : "el"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${text.eyebrow} | Ruseè</title><style>:root{color-scheme:light;--paper:#f2f0e9;--ink:#171714}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,sans-serif}main{display:grid;min-height:100svh;place-items:center;padding:clamp(1rem,3vw,3rem)}section{width:min(100%,80rem);border-block:1px solid rgb(23 23 20/.2);padding:clamp(3rem,9vw,8rem) 0}.eyebrow,.note{font:700 .75rem/1.3 "Courier New",monospace;letter-spacing:.13em;text-transform:uppercase;color:rgb(23 23 20/.75)}h1{max-width:65rem;margin:1.75rem 0 0;font:400 clamp(4rem,11vw,10rem)/.82 Georgia,serif;letter-spacing:-.06em}div{display:grid;gap:1.75rem;margin-top:2.5rem}p{margin:0;max-width:46rem;font-size:1.125rem;line-height:1.65;color:rgb(23 23 20/.75)}@media(min-width:48rem){div{grid-template-columns:1fr .35fr;align-items:end}.note{text-align:right}}</style></head><body><main><section><p class="eyebrow">${text.eyebrow}</p><h1>${text.title}</h1><div><p>${text.body}</p><p class="note">${text.note}</p></div></section></main></body></html>`;

  return new NextResponse(document, {
    status: 503,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Retry-After": "300",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)"],
};
