import { LocalizedLegalPage } from "@/components/legal/LocalizedLegalPage";
import { privacyDraft } from "@/data/legal-draft-copy";
import { localizedPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata() { return localizedPageMetadata({ path: "/privacy-policy", title: { el: "Πολιτική απορρήτου", en: "Privacy policy" }, description: { el: "Πώς η Ruseè χειρίζεται προσωπικά δεδομένα σε ερωτήματα, παραγγελίες, πληρωμές και εκτέλεση.", en: "How Ruseè handles personal information across enquiries, orders, payments and fulfilment." } }); }
export default function PrivacyPolicyPage() { return <LocalizedLegalPage slug="privacy-policy" {...privacyDraft} />; }
