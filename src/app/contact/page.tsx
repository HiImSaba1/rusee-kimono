import { ContactStudio } from "@/components/contact/ContactStudio";
import { localizedPageMetadata } from "@/lib/seo/metadata";
export function generateMetadata() { return localizedPageMetadata({ path: "/contact", title: { el: "Επικοινωνία", en: "Contact" }, description: { el: "Επικοινωνήστε με το studio Ruseè για εφαρμογή, μεγέθη, παραγγελίες, συνεργασίες ή πληροφορίες συλλογής.", en: "Contact the Ruseè studio about fit, sizing, orders, collaborations or collection information." } }); }
export default function ContactPage(){return <ContactStudio/>;}
