import { LocalizedLegalPage } from "@/components/legal/LocalizedLegalPage";
import { localizedPageMetadata } from "@/lib/seo/metadata";
export function generateMetadata(){return localizedPageMetadata({path:"/payment-methods",title:{el:"Τρόποι πληρωμής",en:"Payment methods"},description:{el:"Ασφάλεια πληρωμών, επιβεβαίωση και επιστροφές χρημάτων στη Ruseè.",en:"Payment security, verification and refunds at Ruseè."}});}
const el={eyebrow:"Εξυπηρέτηση / Πληρωμές",title:"Τρόποι πληρωμής",intro:"Καθαρή εικόνα για το πού γίνεται η πληρωμή, πότε επιβεβαιώνεται και τι συμβαίνει αν δεν ολοκληρωθεί.",sections:[
  {heading:"Διαθέσιμοι τρόποι",content:"Οι τελικοί τρόποι πληρωμής θα αναρτηθούν μόνο μετά τη σύμβαση και την επιτυχή δοκιμή του παρόχου. Μέχρι τότε δεν παρουσιάζουμε συγκεκριμένη κάρτα, τράπεζα ή ψηφιακό πορτοφόλι ως ενεργό."},
  {heading:"Hosted checkout",content:"Η εισαγωγή στοιχείων πληρωμής θα γίνεται στο ασφαλές περιβάλλον του συμβεβλημένου παρόχου ή της τράπεζας. Η Ruseè δεν αποθηκεύει πλήρη στοιχεία κάρτας ή CVV."},
  {heading:"Επιβεβαίωση πληρωμής",content:"Μια επιστροφή του browser στη Ruseè δεν αρκεί για να θεωρηθεί η παραγγελία πληρωμένη. Η κατάσταση ενημερώνεται μόνο μετά από αυθεντικοποιημένη επιβεβαίωση του παρόχου από server σε server."},
  {heading:"Αποτυχία ή ακύρωση",content:"Αν η πληρωμή αποτύχει ή ακυρωθεί, η παραγγελία δεν σημειώνεται ως πληρωμένη. Θα εμφανιστεί ασφαλής κατάσταση και, όπου επιτρέπεται, δυνατότητα νέας προσπάθειας χωρίς διπλή χρέωση."},
  {heading:"Δεσμεύσεις τράπεζας",content:"Μια προσωρινή δέσμευση μπορεί να εμφανιστεί από την τράπεζα ακόμη και αν η πληρωμή δεν ολοκληρωθεί. Ο χρόνος αποδέσμευσης εξαρτάται από την εκδότρια τράπεζα και τον πάροχο."},
  {heading:"Επιστροφές χρημάτων",content:"Μια εγκεκριμένη επιστροφή χρημάτων αποστέλλεται στον αρχικό τρόπο πληρωμής μετά τον απαιτούμενο έλεγχο. Ο πάροχος ή η τράπεζα μπορεί να χρειαστεί επιπλέον χρόνο για την εμφάνισή της."},
]};
const en={eyebrow:"Service / Payments",title:"Payment methods",intro:"A clear view of where payment happens, when it is verified and what happens if it is not completed.",sections:[
  {heading:"Available methods",content:"Final payment methods will be published only after the provider is contracted and successfully tested. Until then, no specific card, bank or wallet is presented as active."},
  {heading:"Hosted checkout",content:"Payment details will be entered in the secure environment of the contracted provider or bank. Ruseè does not store full card details or CVV."},
  {heading:"Payment verification",content:"A browser return to Ruseè is not enough to mark an order paid. Status changes only after authenticated server-to-server confirmation from the provider."},
  {heading:"Failure or cancellation",content:"If payment fails or is cancelled, the order is not marked paid. A safe status and, where permitted, another attempt are offered without creating a duplicate charge."},
  {heading:"Bank authorisations",content:"A temporary authorisation may appear at your bank even when payment is not completed. Its release timing is controlled by the issuing bank and provider."},
  {heading:"Refunds",content:"An approved refund is returned to the original payment method after the required review. The provider or bank may need additional time before it appears."},
]};
export default function PaymentMethodsPage(){return <LocalizedLegalPage slug="payment-methods" el={el} en={en}/>;}
