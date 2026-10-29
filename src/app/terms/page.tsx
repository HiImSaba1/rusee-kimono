import { LocalizedLegalPage } from "@/components/legal/LocalizedLegalPage";
import { termsDraft } from "@/data/legal-draft-copy";
import { localizedPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata() { return localizedPageMetadata({ path: "/terms", title: { el: "Όροι και προϋποθέσεις", en: "Terms and conditions" }, description: { el: "Το πλαίσιο για παραγγελίες, πληρωμές, παράδοση και χρήση του καταστήματος Ruseè.", en: "The framework for ordering, payment, delivery and use of the Ruseè storefront." } }); }
export default function TermsPage() { return <LocalizedLegalPage slug="terms" {...termsDraft} />; }
