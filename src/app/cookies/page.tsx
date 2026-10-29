import { LocalizedLegalPage } from "@/components/legal/LocalizedLegalPage";
import { cookiesDraft } from "@/data/legal-draft-copy";
import { localizedPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata() { return localizedPageMetadata({ path: "/cookies", title: { el: "Πολιτική cookies", en: "Cookies policy" }, description: { el: "Απαραίτητη αποθήκευση προγράμματος περιήγησης και προαιρετικές τεχνολογίες στη Ruseè.", en: "Essential browser storage and optional technologies on the Ruseè storefront." } }); }
export default function CookiesPolicyPage() { return <LocalizedLegalPage slug="cookies" {...cookiesDraft} />; }
