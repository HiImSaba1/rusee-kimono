import { LocalizedLegalPage } from "@/components/legal/LocalizedLegalPage";
import { returnsDraft } from "@/data/legal-draft-copy";
import { localizedPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata() { return localizedPageMetadata({ path: "/returns", title: { el: "Πολιτική επιστροφών", en: "Returns policy" }, description: { el: "Η διαδικασία επιστροφής, ελέγχου και επιστροφής χρημάτων για επιλέξιμα προϊόντα Ruseè.", en: "The process for returning, inspecting and refunding eligible Ruseè pieces." } }); }
export default function ReturnsPage() { return <LocalizedLegalPage slug="returns" {...returnsDraft} />; }
