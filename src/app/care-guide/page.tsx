import { LocalizedLegalPage } from "@/components/legal/LocalizedLegalPage";
import { localizedPageMetadata } from "@/lib/seo/metadata";
export function generateMetadata(){return localizedPageMetadata({path:"/care-guide",title:{el:"Οδηγός φροντίδας και εφαρμογής",en:"Care and fit guide"},description:{el:"Φροντίδα, αποθήκευση, εφαρμογή και μέτρηση των κιμονό Ruseè.",en:"Care, storage, fit and measuring guidance for Ruseè kimonos."}});}
const el={eyebrow:"Το ένδυμα / Φροντίδα",title:"Φροντίδα & εφαρμογή",intro:"Ένας πρακτικός οδηγός για να επιλέξετε σωστά και να διατηρήσετε το κιμονό σας με σεβασμό στο ύφασμα.",sections:[
  {heading:"Πρώτα η ραμμένη ετικέτα",content:"Οι οδηγίες της ραμμένης ετικέτας του συγκεκριμένου ενδύματος υπερισχύουν κάθε γενικής συμβουλής. Η τελική σύνθεση και οι εγκεκριμένες οδηγίες πλύσης πρέπει να επιβεβαιωθούν στο δείγμα παραγωγής πριν από το launch."},
  {heading:"Πλύσιμο",content:"Μέχρι να εγκριθεί η τελική ετικέτα, αποφύγετε επιθετικά απορρυπαντικά, λευκαντικό, υψηλή θερμοκρασία και έντονο στύψιμο. Αν υπάρχει αμφιβολία, ζητήστε επαγγελματική συμβουλή καθαρισμού με βάση την πραγματική σύνθεση."},
  {heading:"Στέγνωμα και σιδέρωμα",content:"Η υψηλή θερμότητα μπορεί να μεταβάλει χρώμα, πτώση ή διαστάσεις. Ακολουθήστε αποκλειστικά τα σύμβολα της ετικέτας και δοκιμάστε οποιαδήποτε θερμική επαφή σε μη εμφανές σημείο."},
  {heading:"Αποθήκευση",content:"Φυλάξτε το ένδυμα καθαρό και στεγνό, μακριά από άμεσο ήλιο και υγρασία. Χρησιμοποιήστε φαρδιά κρεμάστρα ή χαλαρή δίπλωση ώστε να μην πιέζονται οι ώμοι και το μοτίβο."},
  {heading:"Εφαρμογή κιμονό",content:"Η γραμμή είναι χαλαρή και προορίζεται να φοριέται ανοιχτή ή με ελαφριά επικάλυψη. Επιλέξτε μέγεθος με βάση την άνεση, την επιθυμητή κίνηση και τα ρούχα που θα φορεθούν από μέσα."},
  {heading:"Πώς μετράμε",content:"Μετρήστε ένα παρόμοιο ένδυμα τοποθετημένο επίπεδα και συγκρίνετε στήθος, μήκος, άνοιγμα μανικιού και περίμετρο. Οι τελικοί αριθμητικοί πίνακες θα προστεθούν μόνο αφού ελεγχθούν όλα τα μεγέθη παραγωγής."},
  {heading:"Χρώμα και διαφάνεια",content:"Η απόδοση χρώματος διαφέρει ανά οθόνη και φωτισμό. Η διαφάνεια εξαρτάται από το σχέδιο και τις συνθήκες· ελέγξτε το ένδυμα σε φυσικό φως και χρησιμοποιήστε κατάλληλη εσωτερική στρώση όπου χρειάζεται."},
]};
const en={eyebrow:"The garment / Care",title:"Care & fit",intro:"A practical guide to choosing well and preserving your kimono with respect for its fabric.",sections:[
  {heading:"The sewn label comes first",content:"The sewn label on the individual garment overrides all general advice. Final composition and approved washing instructions must be confirmed on the production sample before launch."},
  {heading:"Washing",content:"Until the final label is approved, avoid aggressive detergent, bleach, high heat and forceful spinning. When uncertain, seek professional cleaning advice based on the actual fibre composition."},
  {heading:"Drying and ironing",content:"High heat can alter colour, drape or dimensions. Follow only the label symbols and test any heat contact on an inconspicuous area."},
  {heading:"Storage",content:"Store the piece clean and dry, away from direct sunlight and moisture. Use a broad hanger or loose fold so the shoulders and print are not compressed."},
  {heading:"Kimono fit",content:"The silhouette is relaxed and intended to be worn open or with a light overlap. Choose size for comfort, desired movement and the clothing worn underneath."},
  {heading:"How to measure",content:"Measure a similar garment laid flat and compare chest, length, sleeve opening and circumference. Final numerical charts will be added only after every production size is checked."},
  {heading:"Colour and opacity",content:"Colour rendering varies by screen and light. Opacity depends on the design and conditions; inspect in natural light and use an appropriate underlayer when needed."},
]};
export default function CareGuidePage(){return <LocalizedLegalPage slug="care-guide" el={el} en={en}/>;}
