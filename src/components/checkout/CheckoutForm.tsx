"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { TransitionLink } from "@/components/ui/TransitionLink";
import type { CartItem } from "@/features/cart/types";
import { useLocale } from "@/i18n/LocaleProvider";
import { useCart } from "@/providers/CartProvider";

type ValidationState = "checking" | "ready" | "conflict" | "unavailable";

const copy = {
  el: {
    restoring: "Επαναφορά της τσάντας σας…", checking: "Έλεγχος διαθεσιμότητας και τιμής…", conflictTitle: "Η τσάντα χρειάζεται ενημέρωση.", conflict: "Ένα προϊόν ή η ποσότητά του δεν είναι πλέον διαθέσιμο. Επιστρέψτε στην τσάντα για να το διορθώσετε.", unavailableTitle: "Δεν μπορέσαμε να ελέγξουμε την τσάντα.", unavailable: "Η υπηρεσία είναι προσωρινά μη διαθέσιμη. Τα προϊόντα και τα στοιχεία σας παραμένουν στη συσκευή σας.", retry: "Δοκιμή ξανά", bag: "Επιστροφή στην τσάντα",
    empty: "Η τσάντα σας είναι άδεια.", collection: "Επιστροφή στη συλλογή", contact: "01 — Επικοινωνία", firstName: "Όνομα", lastName: "Επώνυμο", email: "Email", phone: "Τηλέφωνο", delivery: "02 — Παράδοση στην Ελλάδα", address: "Διεύθυνση", address2: "Διαμέρισμα, όροφος κ.λπ.", optional: "προαιρετικό", city: "Πόλη", region: "Περιφέρεια", postal: "Ταχυδρομικός κώδικας", country: "Χώρα", greece: "Ελλάδα",
    terms: "Συμφωνώ με τους όρους του καταστήματος, την πολιτική απορρήτου και την πολιτική επιστροφών. Το τελικό νομικό κείμενο πρέπει να εγκριθεί πριν από τις ζωντανές πληρωμές.", orderError: "Δεν μπορέσαμε να δημιουργήσουμε την παραγγελία. Τα στοιχεία σας διατηρήθηκαν· δοκιμάστε ξανά.", paymentError: "Η παραγγελία διατηρήθηκε, αλλά η ασφαλής πληρωμή δεν άνοιξε. Δοκιμάστε ξανά χωρίς να δημιουργηθεί δεύτερη παραγγελία.", review: "Έλεγχος παραγγελίας", quantity: "Ποσ.", subtotal: "Υποσύνολο", shipping: "Παράδοση", complimentary: "Χωρίς χρέωση", total: "Σύνολο", vat: "Περιλαμβάνει εκτιμώμενο ΦΠΑ 24%", opening: "Άνοιγμα ασφαλούς πληρωμής…", pay: "Ασφαλής πληρωμή", hosted: "Θα συνεχίσετε στην ασφαλή φιλοξενούμενη σελίδα της ρυθμισμένης τράπεζας ή του παρόχου πληρωμών.",
  },
  en: {
    restoring: "Restoring your bag…", checking: "Checking availability and price…", conflictTitle: "Your bag needs attention.", conflict: "An item or its quantity is no longer available. Return to your bag to update it.", unavailableTitle: "We could not check your bag.", unavailable: "The service is temporarily unavailable. Your items and entered details remain on this device.", retry: "Try again", bag: "Return to bag",
    empty: "Your bag is empty.", collection: "Return to the collection", contact: "01 — Contact", firstName: "First name", lastName: "Last name", email: "Email", phone: "Phone", delivery: "02 — Delivery in Greece", address: "Address", address2: "Apartment, suite, etc.", optional: "optional", city: "City", region: "Region", postal: "Postal code", country: "Country", greece: "Greece",
    terms: "I agree to the store terms, privacy policy and returns policy. Final legal text must be approved before live payments.", orderError: "We could not create the order. Your details were preserved; please try again.", paymentError: "The order was preserved, but secure payment did not open. Try again without creating a duplicate order.", review: "Order review", quantity: "Qty", subtotal: "Subtotal", shipping: "Delivery", complimentary: "Complimentary", total: "Total", vat: "Includes estimated 24% VAT", opening: "Opening secure payment…", pay: "Pay securely", hosted: "You will continue to the secure hosted page of the configured bank or payment provider.",
  },
} as const;

const billingCopy = {
  el: { legend: "03 — Παραστατικό", receipt: "Απόδειξη", invoice: "Τιμολόγιο", company: "Επωνυμία επιχείρησης", vatNumber: "ΑΦΜ", taxOffice: "ΔΟΥ", activity: "Δραστηριότητα / Επάγγελμα", address: "Διεύθυνση έδρας", address2: "Πρόσθετα στοιχεία διεύθυνσης", city: "Πόλη", region: "Περιφέρεια", postal: "Ταχυδρομικός κώδικας", note: "Τα στοιχεία χρησιμοποιούνται αποκλειστικά για την έκδοση του παραστατικού της παραγγελίας." },
  en: { legend: "03 — Billing document", receipt: "Receipt", invoice: "Business invoice", company: "Legal business name", vatNumber: "Greek VAT number", taxOffice: "Tax office (DOY)", activity: "Business activity / Profession", address: "Registered address", address2: "Additional address details", city: "City", region: "Region", postal: "Postal code", note: "These details are used exclusively to issue the order's billing document." },
} as const;

export function CheckoutForm() {
  const cart = useCart();
  const { locale } = useLocale();
  const text = copy[locale];
  const billingText = billingCopy[locale];
  const [documentType, setDocumentType] = useState<"receipt" | "invoice">("receipt");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validation, setValidation] = useState<ValidationState>("checking");
  const [validationAttempt, setValidationAttempt] = useState(0);
  const lastValidatedKey = useRef("");
  const attemptId = useRef<string | null>(null);

  useEffect(() => {
    if (!cart.hydrated) return;
    if (!cart.items.length) return;
    const key = `${cart.items.map((item) => `${item.variantId}:${item.quantity}`).join("|")}:${validationAttempt}`;
    if (lastValidatedKey.current === key) return;
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    Promise.all(cart.items.map(async (item) => {
      const response = await fetch("/api/cart/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId: item.variantId, quantity: item.quantity }), signal: controller.signal });
      if (!response.ok) throw new Error(response.status === 503 ? "unavailable" : "conflict");
      const validated = await response.json() as CartItem;
      return validated;
    })).then((items) => {
      if (!active) return;
      window.clearTimeout(timeout);
      lastValidatedKey.current = key;
      cart.replaceItems(items);
      setValidation("ready");
    }).catch((caught) => {
      if (!active) return;
      window.clearTimeout(timeout);
      setValidation(caught instanceof Error && caught.message === "conflict" ? "conflict" : "unavailable");
    });
    return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
  }, [cart, validationAttempt]);

  const total = cart.items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0);
  const money = (amount: number, currency: string) => new Intl.NumberFormat(locale === "el" ? "el-GR" : "en-GR", { style: "currency", currency }).format(amount / 100);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart.items.length || submitting || validation !== "ready") return;
    setSubmitting(true); setError("");
    const form = new FormData(event.currentTarget);
    attemptId.current ??= crypto.randomUUID();
    const publicId = attemptId.current;
    const payload = {
      publicId, items: cart.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      customer: { email: String(form.get("email") ?? ""), firstName: String(form.get("firstName") ?? ""), lastName: String(form.get("lastName") ?? ""), phone: String(form.get("phone") ?? "") },
      shipping: { line1: String(form.get("line1") ?? ""), line2: String(form.get("line2") ?? ""), city: String(form.get("city") ?? ""), region: String(form.get("region") ?? ""), postalCode: String(form.get("postalCode") ?? ""), countryCode: "GR" }, acceptedTerms: form.get("acceptedTerms") === "on",
      billingDocument: documentType === "invoice" ? { type: "invoice", company: String(form.get("billingCompany") ?? ""), vatNumber: String(form.get("billingVatNumber") ?? "").replace(/\s/g, ""), taxOffice: String(form.get("billingTaxOffice") ?? ""), businessActivity: String(form.get("billingActivity") ?? ""), line1: String(form.get("billingLine1") ?? ""), line2: String(form.get("billingLine2") ?? ""), city: String(form.get("billingCity") ?? ""), region: String(form.get("billingRegion") ?? ""), postalCode: String(form.get("billingPostalCode") ?? ""), countryCode: "GR" } : { type: "receipt" },
    };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": publicId }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({})) as { publicId?: string };
      if (!response.ok || !result.publicId) throw new Error("order");
      const paymentResponse = await fetch("/api/payments/create", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": result.publicId }, body: JSON.stringify({ publicId: result.publicId }) });
      const payment = await paymentResponse.json().catch(() => ({})) as { redirectUrl?: string };
      if (!paymentResponse.ok || !payment.redirectUrl) throw new Error("payment");
      cart.clear();
      window.location.assign(payment.redirectUrl);
    } catch (caught) {
      setError(caught instanceof Error && caught.message === "payment" ? text.paymentError : text.orderError);
      setSubmitting(false);
    }
  }

  if (!cart.hydrated) return <StatusMessage message={text.restoring} />;
  if (!cart.items.length) return <div className="py-24 text-center"><p className="font-display text-5xl">{text.empty}</p><TransitionLink href="/shop" className="mt-8 inline-block border-b border-ink pb-2 text-xs uppercase tracking-[0.15em]">{text.collection}</TransitionLink></div>;
  if (validation === "checking") return <StatusMessage message={text.checking} />;
  if (validation === "conflict" || validation === "unavailable") return <div data-testid="checkout-recovery-alert" className="mx-auto max-w-xl py-24 text-center" role="alert"><p className="font-display text-5xl">{validation === "conflict" ? text.conflictTitle : text.unavailableTitle}</p><p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-ink/65">{validation === "conflict" ? text.conflict : text.unavailable}</p><div className="mt-8 flex flex-wrap justify-center gap-4"><button onClick={() => { setValidation("checking"); setError(""); setValidationAttempt((value) => value + 1); }} className="bg-ink px-6 py-4 text-xs uppercase tracking-[.15em] text-paper">{text.retry}</button><TransitionLink href="/cart" className="border border-ink px-6 py-4 text-xs uppercase tracking-[.15em]">{text.bag}</TransitionLink></div></div>;

  const field = "mt-2 w-full border-b border-ink/25 bg-transparent py-3 outline-none transition-colors focus:border-ink";
  return <form onSubmit={submit} className="grid gap-14 lg:grid-cols-[1fr_25rem]">
    <div className="space-y-12">
      <fieldset><legend className="eyebrow w-full border-b border-ink/20 pb-4">{text.contact}</legend><div className="mt-6 grid gap-6 sm:grid-cols-2"><Field name="firstName" label={text.firstName} autoComplete="given-name" className={field}/><Field name="lastName" label={text.lastName} autoComplete="family-name" className={field}/><Field name="email" label={text.email} type="email" autoComplete="email" className={field}/><Field name="phone" label={text.phone} type="tel" autoComplete="tel" className={field}/></div></fieldset>
      <fieldset><legend className="eyebrow w-full border-b border-ink/20 pb-4">{text.delivery}</legend><div className="mt-6 grid gap-6 sm:grid-cols-2"><Field name="line1" label={text.address} autoComplete="address-line1" className={field} wrapperClassName="sm:col-span-2"/><Field name="line2" label={`${text.address2} (${text.optional})`} autoComplete="address-line2" required={false} className={field} wrapperClassName="sm:col-span-2"/><Field name="city" label={text.city} autoComplete="address-level2" className={field}/><Field name="region" label={text.region} autoComplete="address-level1" required={false} className={field}/><Field name="postalCode" label={text.postal} autoComplete="postal-code" className={field}/><label className="text-xs uppercase tracking-[0.12em]">{text.country}<input value={text.greece} readOnly className={field}/></label></div></fieldset>
      <fieldset><legend className="eyebrow w-full border-b border-ink/20 pb-4">{billingText.legend}</legend><div className="mt-6 grid grid-cols-2 gap-3"><label data-billing-document-option className={`cursor-pointer border px-6 py-5 text-center text-base uppercase tracking-[.12em] ${documentType === "receipt" ? "border-ink bg-ink text-paper" : "border-ink/20"}`}><input type="radio" name="documentType" value="receipt" checked={documentType === "receipt"} onChange={() => setDocumentType("receipt")} className="sr-only"/>{billingText.receipt}</label><label data-billing-document-option className={`cursor-pointer border px-6 py-5 text-center text-base uppercase tracking-[.12em] ${documentType === "invoice" ? "border-ink bg-ink text-paper" : "border-ink/20"}`}><input type="radio" name="documentType" value="invoice" checked={documentType === "invoice"} onChange={() => setDocumentType("invoice")} className="sr-only"/>{billingText.invoice}</label></div>{documentType === "invoice" && <div className="mt-7 grid gap-6 sm:grid-cols-2"><Field name="billingCompany" label={billingText.company} autoComplete="organization" className={field} wrapperClassName="sm:col-span-2"/><Field name="billingVatNumber" label={billingText.vatNumber} className={field} wrapperClassName="sm:col-span-1"/><Field name="billingTaxOffice" label={billingText.taxOffice} className={field}/><Field name="billingActivity" label={billingText.activity} className={field} wrapperClassName="sm:col-span-2"/><Field name="billingLine1" label={billingText.address} autoComplete="billing address-line1" className={field} wrapperClassName="sm:col-span-2"/><Field name="billingLine2" label={`${billingText.address2} (${text.optional})`} autoComplete="billing address-line2" required={false} className={field} wrapperClassName="sm:col-span-2"/><Field name="billingCity" label={billingText.city} autoComplete="billing address-level2" className={field}/><Field name="billingRegion" label={`${billingText.region} (${text.optional})`} autoComplete="billing address-level1" required={false} className={field}/><Field name="billingPostalCode" label={billingText.postal} autoComplete="billing postal-code" className={field}/><label className="text-xs uppercase tracking-[0.12em]">{text.country}<input value={text.greece} readOnly className={field}/></label><p className="text-xs leading-relaxed text-ink/60 sm:col-span-2">{billingText.note}</p></div>}</fieldset>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-ink/65"><input name="acceptedTerms" type="checkbox" required className="mt-1 accent-ink"/><span>{text.terms}</span></label>
      {error && <p data-testid="checkout-submit-alert" role="alert" className="border-l-2 border-red-700 pl-4 text-sm text-red-800">{error}</p>}
    </div>
    <aside className="h-fit bg-paper-deep p-6 lg:sticky lg:top-28"><p className="eyebrow">{text.review}</p><div className="mt-6 space-y-5">{cart.items.map((item) => <article key={item.variantId} data-sku={item.sku} className="grid grid-cols-[4.5rem_1fr_auto] gap-3 border-b border-ink/15 pb-5"><div className="relative aspect-[3/4]"><Image src={item.image} alt="" fill sizes="72px" className="object-cover"/></div><div><p className="font-display text-xl leading-none">{item.designName}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="bg-ink px-1.5 py-1 font-mono text-[.58rem] uppercase tracking-[.08em] text-paper">{item.sizeLabel}</span><span className="text-[.65rem] text-ink/70">{item.colourName}</span></div><p className="mt-2 font-mono text-[.56rem] uppercase tracking-[.07em] text-ink/55">{item.sku}</p><p className="mt-1 text-[0.62rem]">{text.quantity} {item.quantity}</p></div><p className="text-sm">{money(item.priceMinor * item.quantity, item.currency)}</p></article>)}</div><dl className="mt-6 space-y-3 text-sm"><div className="flex justify-between"><dt>{text.subtotal}</dt><dd>{money(total, "EUR")}</dd></div><div className="flex justify-between"><dt>{text.shipping}</dt><dd>{text.complimentary}</dd></div><div className="flex justify-between border-t border-ink/20 pt-4 text-base"><dt>{text.total}</dt><dd>{money(total, "EUR")}</dd></div><div className="flex justify-between text-xs text-ink/70"><dt>{text.vat}</dt><dd>{money(Math.round(total * 24 / 124), "EUR")}</dd></div></dl><button data-checkout-payment disabled={submitting} className="mt-7 w-full bg-ink px-6 py-5 text-xs uppercase tracking-[0.18em] text-paper disabled:opacity-45">{submitting ? text.opening : text.pay}</button><p className="mt-4 text-center text-[0.72rem] leading-relaxed text-ink/70">{text.hosted}</p></aside>
  </form>;
}

function StatusMessage({ message }: { message: string }) { return <div className="py-24 text-center" role="status"><p className="eyebrow text-ink/55">{message}</p></div>; }

function Field({ label, wrapperClassName = "", required = true, ...input }: { label: string; wrapperClassName?: string; required?: boolean; name: string; type?: string; autoComplete?: string; className: string }) {
  return <label className={`text-xs uppercase tracking-[0.12em] ${wrapperClassName}`}>{label}<input {...input} required={required}/></label>;
}
