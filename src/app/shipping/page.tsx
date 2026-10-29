import { LocalizedLegalPage } from "@/components/legal/LocalizedLegalPage";
import { localizedPageMetadata } from "@/lib/seo/metadata";

export function generateMetadata(){return localizedPageMetadata({path:"/shipping",title:{el:"Αποστολές και courier",en:"Shipping and courier"},description:{el:"Προετοιμασία, αποστολή, tracking και παράδοση παραγγελιών Ruseè.",en:"Preparation, shipping, tracking and delivery of Ruseè orders."}});}

const el={eyebrow:"Εξυπηρέτηση / Αποστολή",title:"Αποστολές & courier",intro:"Τι συμβαίνει από τη στιγμή που επιβεβαιώνεται η πληρωμή μέχρι την παράδοση του κιμονό σας.",sections:[
  {heading:"Περιοχές παράδοσης",content:"Οι τελικές χώρες και περιοχές εξυπηρέτησης θα εμφανίζονται στο checkout πριν από την πληρωμή. Δεν παρουσιάζουμε έναν προορισμό ως διαθέσιμο μέχρι να επιβεβαιωθεί η συνεργασία και η αντίστοιχη χρέωση."},
  {heading:"Χρόνος προετοιμασίας",content:"Η παραγγελία προχωρά σε προετοιμασία μόνο μετά από επιβεβαιωμένη πληρωμή και έλεγχο αποθέματος. Ο εκτιμώμενος χρόνος προετοιμασίας θα αναγράφεται πριν από το launch και μπορεί να διαφέρει για ειδικές ή προπαραγγελθείσες εκδόσεις."},
  {heading:"Courier και κόστος",content:"Η τελική εταιρεία courier, οι υπηρεσίες και οι χρεώσεις δεν έχουν ακόμη εγκριθεί. Το πραγματικό κόστος αποστολής πρέπει να εμφανίζεται στο checkout πριν από την πληρωμή και δεν θα προστίθεται εκ των υστέρων."},
  {heading:"Tracking",content:"Όταν η παραγγελία παραδοθεί στην courier, θα σταλεί ενημέρωση αποστολής με τον διαθέσιμο αριθμό παρακολούθησης. Η πρώτη ενημέρωση μπορεί να εμφανιστεί αφού το δέμα σαρωθεί από την courier."},
  {heading:"Καθυστερήσεις",content:"Οι ημερομηνίες παράδοσης αποτελούν εκτιμήσεις εκτός αν συμφωνηθεί ρητά διαφορετικά. Σε περίπτωση γνωστής καθυστέρησης θα χρησιμοποιήσουμε τα στοιχεία της παραγγελίας για να σας ενημερώσουμε."},
  {heading:"Ζημιά ή λάθος δέμα",content:"Αν το δέμα φτάσει εμφανώς κατεστραμμένο ή περιέχει διαφορετικό προϊόν, κρατήστε τη συσκευασία και επικοινωνήστε άμεσα με τον αριθμό παραγγελίας και καθαρές φωτογραφίες."},
  {heading:"Διεθνείς αποστολές",content:"Τυχόν δασμοί, φόροι εισαγωγής, περιορισμοί και ευθύνη εκτελωνισμού πρέπει να δηλωθούν ανά προορισμό πριν ενεργοποιηθούν διεθνείς πωλήσεις."},
]};
const en={eyebrow:"Service / Shipping",title:"Shipping & courier",intro:"What happens from verified payment until your kimono reaches you.",sections:[
  {heading:"Delivery areas",content:"Final supported countries and regions will appear at checkout before payment. We do not present a destination as available until the courier service and charge are confirmed."},
  {heading:"Preparation time",content:"An order enters preparation only after verified payment and stock confirmation. The estimated preparation time will be published before launch and may differ for special or pre-order editions."},
  {heading:"Courier and cost",content:"The final courier, services and charges are not yet approved. The actual shipping cost must appear at checkout before payment and will not be added afterwards."},
  {heading:"Tracking",content:"When the parcel is handed to the courier, a shipping update will include the available tracking number. Its first update may appear only after the courier scans the parcel."},
  {heading:"Delays",content:"Delivery dates are estimates unless explicitly agreed otherwise. If a delay becomes known, we will use the order contact details to provide an update."},
  {heading:"Damage or incorrect parcel",content:"If a parcel arrives visibly damaged or contains the wrong piece, retain the packaging and contact us promptly with the order number and clear photographs."},
  {heading:"International shipping",content:"Duties, import taxes, restrictions and customs responsibility must be stated per destination before international sales are enabled."},
]};
export default function ShippingPage(){return <LocalizedLegalPage slug="shipping" el={el} en={en}/>;}
