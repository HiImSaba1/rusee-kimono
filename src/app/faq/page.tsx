import { cookies } from "next/headers";
import { FaqAccordion } from "@/components/faq/FaqAccordion";
import { defaultLocale, isLocale, localeCookieName, type Locale } from "@/i18n/config";
import { localizedPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata() { return localizedPageMetadata({ path: "/faq", title: { el: "Συχνές ερωτήσεις", en: "Frequently asked questions" }, description: { el: "Απαντήσεις για την εφαρμογή, τη φροντίδα, τις παραγγελίες, την παράδοση και τις επιστροφές Ruseè.", en: "Answers about Ruseè fit, care, orders, delivery and returns." } }); }

type Entry={category:string;question:string;answer:string};
const faq:Record<Locale,Entry[]>={
  el:[
    {category:"Το ένδυμα",question:"Πώς εφαρμόζει το κιμονό;",answer:"Η σιλουέτα είναι σκόπιμα άνετη. Επιλέξτε το συνηθισμένο σας μέγεθος για χαλαρή εφαρμογή· οι αναλυτικές διαστάσεις και ο πλήρης οδηγός μεγεθών θα βρίσκονται στη σελίδα του προϊόντος."},
    {category:"Το ένδυμα",question:"Έχουν όλα τα σχέδια την ίδια γραμμή;",answer:"Ναι. Το Signature Kimono βασίζεται σε μία προσεγμένη γραμμή, η οποία εκφράζεται μέσα από διαφορετικά σχέδια και χρώματα."},
    {category:"Το ένδυμα",question:"Πώς πρέπει να το φροντίζω;",answer:"Πλύνετε σε χαμηλή θερμοκρασία με απαλό πρόγραμμα, στεγνώστε στη σκιά και χρησιμοποιήστε ατμό ή σίδερο σε χαμηλή θερμοκρασία. Ακολουθείτε πάντα την τελική ετικέτα φροντίδας του ενδύματος."},
    {category:"Παραγγελίες και παράδοση",question:"Σε ποιες περιοχές αποστέλλετε;",answer:"Σχεδιάζουμε αποστολές σε όλη την Ελλάδα και διεθνώς. Οι ακριβείς προορισμοί, χρόνοι παράδοσης και χρεώσεις θα εμφανίζονται στο checkout."},
    {category:"Παραγγελίες και παράδοση",question:"Μπορώ να αλλάξω την παραγγελία μου;",answer:"Επικοινωνήστε μαζί μας το συντομότερο δυνατό. Αν η προετοιμασία της παραγγελίας δεν έχει ξεκινήσει, θα κάνουμε ό,τι μπορούμε για να σας εξυπηρετήσουμε."},
    {category:"Παραγγελίες και παράδοση",question:"Ποιοι τρόποι πληρωμής θα είναι διαθέσιμοι;",answer:"Το checkout θα υποστηρίζει ασφαλείς πληρωμές με κάρτα και επιλεγμένα ψηφιακά πορτοφόλια μέσω συμβεβλημένων παρόχων πληρωμών."},
    {category:"Επιστροφές",question:"Μπορώ να επιστρέψω ένα προϊόν;",answer:"Ναι, σύμφωνα με την τελική πολιτική επιστροφών και την ισχύουσα νομοθεσία προστασίας καταναλωτή. Το προϊόν πρέπει να είναι αφόρετο, άπλυτο και να φέρει όλες τις αρχικές ετικέτες του."},
    {category:"Επιστροφές",question:"Πότε θα λάβω την επιστροφή χρημάτων;",answer:"Μετά την παραλαβή και αποδοχή της επιστροφής, το ποσό θα επιστρέφεται στον αρχικό τρόπο πληρωμής. Ο χρόνος επεξεργασίας από την τράπεζα ενδέχεται να διαφέρει."},
  ],
  en:[
    {category:"The garment",question:"How does the kimono fit?",answer:"The silhouette is intentionally relaxed. Choose your usual size for an easy fit; measurements and a complete size guide will be available on the product page."},
    {category:"The garment",question:"Are all designs the same shape?",answer:"Yes. The Signature Kimono uses one considered pattern, expressed through different designs and colours."},
    {category:"The garment",question:"How should I care for it?",answer:"Use a cool gentle wash, dry in shade and steam or iron at low temperature. Follow the final care label attached to your garment."},
    {category:"Orders & delivery",question:"Where do you ship?",answer:"We plan to ship throughout Greece and internationally. Exact destinations, delivery times and rates will be shown at checkout."},
    {category:"Orders & delivery",question:"Can I change my order?",answer:"Contact us as soon as possible. If fulfilment has not started, we will do our best to help."},
    {category:"Orders & delivery",question:"What payment methods will be available?",answer:"The launch checkout is planned to support secure card payments and selected wallets through contracted payment providers."},
    {category:"Returns",question:"Can I return a piece?",answer:"Yes, subject to the final returns policy and applicable consumer law. Items must be unworn, unwashed and returned with their original tags."},
    {category:"Returns",question:"When will I receive a refund?",answer:"After an accepted return is inspected, the refund will be issued to the original payment method. Bank processing time may vary."},
  ]
};

export default async function FaqPage(){const saved=(await cookies()).get(localeCookieName)?.value;const locale=isLocale(saved)?saved:defaultLocale;return <section data-no-translate className="section-shell"><div className="mb-16 grid items-start gap-8 border-t border-ink/20 pt-8 lg:grid-cols-2"><div><p className="eyebrow">{locale==="el"?"Ερωτήσεις, με φροντίδα":"Questions, considered"}</p><h1 className="mt-7 font-display text-[clamp(5rem,9vw,10rem)] leading-[.82] tracking-[-.06em]">FAQ</h1></div><p className="max-w-md text-sm uppercase leading-relaxed tracking-[-.01em] text-ink/60 lg:pt-12">{locale==="el"?"Όσα γνωρίζουμε μέχρι σήμερα. Οι πολιτικές λειτουργίας θα οριστικοποιηθούν πριν ενεργοποιηθούν οι ζωντανές πληρωμές.":"Everything we know so far. Launch policies will be finalized before payments go live."}</p></div><FaqAccordion items={faq[locale]}/></section>}
