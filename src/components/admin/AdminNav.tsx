"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/animations/gsap";
import { logoutAdmin } from "@/app/admin/actions";
import type { AdminSession } from "@/features/admin-auth/session";
import { useLocale } from "@/i18n/LocaleProvider";
import { NotificationCentre } from "@/components/admin/NotificationCentre";
import type { AdminNotification } from "@/features/admin/notifications";

type Label = { el: string; en: string };
type AdminLink = { label: Label; href: string; roles?: AdminSession["role"][] };
type AdminGroup = { label: Label; links: readonly AdminLink[] };

const groups: readonly AdminGroup[] = [
  { label: { el: "Επισκόπηση", en: "Overview" }, links: [
    { label: { el: "Πίνακας", en: "Dashboard" }, href: "/admin/overview" },
    { label: { el: "Οδηγός χρήσης", en: "Admin guide" }, href: "/admin/guide" },
  ] },
  { label: { el: "Πωλήσεις", en: "Sales" }, links: [
    { label: { el: "Παραγγελίες", en: "Orders" }, href: "/admin/orders" },
    { label: { el: "Ροή παραγγελιών", en: "Order workflow" }, href: "/admin/order-operations" },
    { label: { el: "Αιτήματα επιστροφής", en: "Return requests" }, href: "/admin/returns" },
    { label: { el: "Πληρωμές", en: "Payments" }, href: "/admin/payments" },
    { label: { el: "Συμφωνία πληρωμών", en: "Payment checks" }, href: "/admin/reconciliation" },
  ] },
  { label: { el: "Κατάλογος", en: "Catalogue" }, links: [
    { label: { el: "Προϊόντα", en: "Products" }, href: "/admin/products" },
    { label: { el: "Νέο προϊόν", en: "Add product" }, href: "/admin/products/new", roles: ["owner", "manager"] },
    { label: { el: "Εικόνες", en: "Images" }, href: "/admin/media" },
    { label: { el: "Ετοιμότητα", en: "Readiness" }, href: "/admin/catalogue-readiness" },
    { label: { el: "Απόθεμα", en: "Stock" }, href: "/admin/inventory" },
  ] },
  { label: { el: "Πελάτες", en: "Customers" }, links: [
    { label: { el: "Μηνύματα", en: "Enquiries" }, href: "/admin/enquiries" },
    { label: { el: "Email", en: "Email" }, href: "/admin/email" },
    { label: { el: "Πρότυπα email", en: "Email templates" }, href: "/admin/email-templates", roles: ["owner", "manager"] },
    { label: { el: "Ιστορικό προτύπων", en: "Template history" }, href: "/admin/email-template-history", roles: ["owner", "manager"] },
    { label: { el: "Ιδιωτικότητα", en: "Privacy" }, href: "/admin/privacy" },
    { label: { el: "Σελίδες πληροφοριών", en: "Information pages" }, href: "/admin/information" },
  ] },
  { label: { el: "Σύστημα", en: "System" }, links: [
    { label: { el: "Αυτοματισμοί", en: "Automations" }, href: "/admin/automation" },
    { label: { el: "Κατάσταση", en: "Health" }, href: "/admin/health" },
    { label: { el: "Ιστορικό ενεργειών", en: "Activity log" }, href: "/admin/activity", roles: ["owner", "manager"] },
    { label: { el: "Ομάδα", en: "Team" }, href: "/admin/team", roles: ["owner"] },
  ] },
] as const;

export function AdminNav({ admin, notifications }: { admin: AdminSession; notifications: AdminNotification[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { locale } = useLocale();

  useGSAP(() => {
    if (!panel.current) return;
    const items = panel.current.querySelectorAll("[data-admin-menu-item]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      gsap.set(panel.current, { display: open ? "block" : "none", height: open ? "auto" : 0, autoAlpha: open ? 1 : 0 });
      gsap.set(items, { yPercent: 0, autoAlpha: 1 });
      return;
    }
    const timeline = gsap.timeline();
    if (open) timeline.set(panel.current, { display: "block", overflow: "hidden" }).fromTo(panel.current, { height: 0, autoAlpha: 0, clipPath: "inset(50% 0 50% 0)" }, { height: "auto", autoAlpha: 1, clipPath: "inset(0% 0 0% 0)", duration: .6, ease: "power3.inOut" }).fromTo(items, { yPercent: 45, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, stagger: .035, duration: .4, ease: "power3.out" }, "-=.25");
    else timeline.to(items, { yPercent: -25, autoAlpha: 0, stagger: .02, duration: .2, ease: "power2.in" }).to(panel.current, { height: 0, autoAlpha: 0, clipPath: "inset(50% 0 50% 0)", duration: .45, ease: "power3.inOut" }, "-=.1").set(panel.current, { display: "none" });
    return () => timeline.kill();
  }, { scope: root, dependencies: [open] });

  useEffect(() => {
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);

  return <header ref={root} className="relative z-40 border-b border-ink/20 bg-paper">
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-[var(--gutter)] py-5">
      <Link href="/admin/overview" className="w-fit"><span className="font-display text-3xl tracking-[-.05em]">RUSEÈ</span><span className="ml-3 hidden text-[.58rem] uppercase tracking-[.16em] text-ink/75 sm:inline">{locale === "el" ? "Λειτουργίες" : "Operations"}</span></Link>
      <button type="button" aria-label={open ? (locale === "el" ? "Κλείσιμο μενού" : "Close menu") : (locale === "el" ? "Άνοιγμα μενού" : "Open menu")} aria-expanded={open} aria-controls="admin-menu" onClick={() => setOpen(value => !value)} className="group flex items-center gap-3 font-mono text-[.65rem] uppercase tracking-[.2em]"><span>{open ? (locale === "el" ? "Κλείσιμο" : "Close") : (locale === "el" ? "Μενού" : "Menu")}</span><span aria-hidden className="relative h-3 w-5"><span className={`absolute left-0 top-0 block h-px w-5 bg-current transition-transform duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`} /><span className={`absolute bottom-0 left-0 block h-px w-5 bg-current transition-transform duration-300 ${open ? "-translate-y-[6px] -rotate-45" : ""}`} /></span></button>
      <div className="flex items-center justify-self-end gap-5"><NotificationCentre items={notifications}/><form action={logoutAdmin}><button className="font-mono text-[.62rem] uppercase tracking-wider text-ink hover:text-ink"><span className="hidden sm:inline">{admin.username} · </span>{locale === "el" ? "Έξοδος" : "Sign out"}</button></form></div>
    </div>
    <div id="admin-menu" ref={panel} className="hidden h-0 overflow-hidden border-t border-ink/20 bg-paper-deep">
      <nav aria-label={locale === "el" ? "Πλοήγηση διαχείρισης" : "Admin navigation"} className="mx-auto grid w-full max-w-[96rem] gap-px bg-ink/15 px-[clamp(.5rem,1.4vw,1.25rem)] py-4 md:grid-cols-2 xl:grid-cols-5">
        {groups.map((group, groupIndex) => {
          const links = group.links.filter(link => !link.roles || link.roles.includes(admin.role));
          const active = links.some(link => pathname === link.href || (link.href !== "/admin/overview" && pathname.startsWith(`${link.href}/`)));
          return <section key={group.label.en} data-admin-menu-item className="bg-paper-deep p-[clamp(.75rem,1.25vw,1.15rem)]">
            <div className="flex items-start justify-between gap-3 border-b border-ink/20 pb-3"><h2 data-admin-menu-title className={`min-w-0 font-display uppercase tracking-[-.025em] ${active ? "italic" : ""}`}>{group.label[locale]}</h2><span className="shrink-0 font-mono text-[.58rem] text-ink/75">0{groupIndex + 1}</span></div>
            <div className="mt-3 flex flex-col">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={pathname === link.href ? "page" : undefined} className={`border-b border-ink/10 px-3 py-2.5 text-sm transition-colors duration-300 hover:text-ink focus-visible:text-ink focus-visible:outline-none ${pathname === link.href ? "font-semibold" : ""}`}>{link.label[locale]}</Link>)}</div>
          </section>;
        })}
      </nav>
    </div>
  </header>;
}
