import { ArrowLeft, ArrowRight } from "lucide-react";
import { TransitionLink } from "@/components/ui/TransitionLink";
import type { Locale } from "@/i18n/config";
import { informationPageLabels, type InformationPageSlug } from "@/features/content/information-pages";

const sequence:InformationPageSlug[]=["shipping","payment-methods","returns","care-guide","cookies","privacy-policy"];

export function InformationSiblingNav({slug,locale}:{slug:InformationPageSlug;locale:Locale}){
  const current=sequence.indexOf(slug);
  if(current<0)return null;
  const previous=sequence[(current-1+sequence.length)%sequence.length];
  const next=sequence[(current+1)%sequence.length];
  return <nav aria-label={locale==="el"?"Πλοήγηση σελίδων πληροφοριών":"Information page navigation"} className="mt-[clamp(5rem,10vw,10rem)] grid border-y border-ink/20 md:grid-cols-[1fr_auto_1fr]">
    <TransitionLink data-structural-control href={`/${previous}`} className="group flex min-h-36 flex-col justify-between p-5 transition-colors hover:bg-ink hover:text-paper md:min-h-44 md:p-7"><span className="flex items-center gap-2 text-xs uppercase tracking-[.14em]"><ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1"/>{locale==="el"?"Προηγούμενο":"Previous"}</span><strong className="font-display text-[clamp(1.8rem,3vw,3.4rem)] font-normal leading-none">{informationPageLabels[previous][locale]}</strong></TransitionLink>
    <TransitionLink data-structural-control href="/information" className="flex items-center justify-center border-y border-ink/20 px-6 py-5 text-center text-xs uppercase tracking-[.14em] transition-colors hover:bg-paper-deep hover:text-paper md:border-x md:border-y-0">{locale==="el"?"Όλες οι πληροφορίες":"All information"}</TransitionLink>
    <TransitionLink data-structural-control href={`/${next}`} className="group flex min-h-36 flex-col items-end justify-between p-5 text-right transition-colors hover:bg-ink hover:text-paper md:min-h-44 md:p-7"><span className="flex items-center gap-2 text-xs uppercase tracking-[.14em]">{locale==="el"?"Επόμενο":"Next"}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1"/></span><strong className="font-display text-[clamp(1.8rem,3vw,3.4rem)] font-normal leading-none">{informationPageLabels[next][locale]}</strong></TransitionLink>
  </nav>;
}
