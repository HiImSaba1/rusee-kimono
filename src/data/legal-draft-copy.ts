import type { LegalSection } from "@/components/legal/LegalPage";

type LegalCopy = { eyebrow: string; title: string; intro: string; sections: LegalSection[] };
type LocalizedLegalDraft = { el: LegalCopy; en: LegalCopy };

export const termsDraft: LocalizedLegalDraft = {
  el: { eyebrow: "Νομικά / Κατάστημα", title: "Όροι και προϋποθέσεις", intro: "Οι όροι χρήσης και αγορών από το ηλεκτρονικό κατάστημα Ruseè.", sections: [
    { heading: "Στοιχεία επιχείρησης", content: "Το ηλεκτρονικό κατάστημα λειτουργεί από ADD_YOUR_LEGAL_NAME, με διακριτικό τίτλο ADD_YOUR_TRADING_NAME, έδρα ADD_YOUR_REGISTERED_ADDRESS, ΑΦΜ ADD_YOUR_VAT_NUMBER, ΔΟΥ ADD_YOUR_TAX_OFFICE και email επικοινωνίας ADD_YOUR_CONTACT_EMAIL." },
    { heading: "Προϊόντα και διαθεσιμότητα", content: "Παρουσιάζουμε κάθε σχέδιο, μέγεθος, σύνθεση και τιμή με τη μεγαλύτερη δυνατή ακρίβεια. Μικρές αποκλίσεις χρώματος μπορεί να οφείλονται στην οθόνη ή στη μικρή παραγωγή. Η αποδοχή παραγγελίας εξαρτάται από τη διαθέσιμη ποσότητα." },
    { heading: "Τιμές, ΦΠΑ και πληρωμές", content: "Οι τιμές εμφανίζονται σε ευρώ και ADD_YOUR_VAT_INCLUSION_STATEMENT. Οι διαθέσιμοι τρόποι πληρωμής είναι ADD_YOUR_PAYMENT_METHODS. Η πληρωμή ολοκληρώνεται στο ασφαλές περιβάλλον του συμβεβλημένου παρόχου και η Ruseè δεν αποθηκεύει πλήρη στοιχεία κάρτας." },
    { heading: "Παραγγελία και σύμβαση", content: "Η επιβεβαίωση παραλαβής του checkout δεν αποτελεί από μόνη της τελική αποδοχή. Η παραγγελία επιβεβαιώνεται όταν επαληθευτεί η πληρωμή και δεσμευτεί το προϊόν. Αν δεν είναι δυνατή η εκτέλεση, θα επικοινωνήσουμε με τον πελάτη." },
    { heading: "Παράδοση", content: "Οι περιοχές αποστολής, οι χρεώσεις και οι εκτιμώμενοι χρόνοι είναι ADD_YOUR_SHIPPING_TERMS. Τυχόν ειδικοί δασμοί ή περιορισμοί για αποστολές εκτός ADD_YOUR_CUSTOMS_AREA πρέπει να επιβεβαιωθούν πριν την αγορά." },
    { heading: "Εφαρμοστέο δίκαιο και επίλυση διαφορών", content: "Τα υποχρεωτικά δικαιώματα καταναλωτή δεν περιορίζονται. Το τελικό εφαρμοστέο δίκαιο, η αρμόδια δικαιοδοσία και η διαδικασία εναλλακτικής επίλυσης διαφορών είναι ADD_YOUR_LEGAL_DISPUTE_WORDING και απαιτούν έγκριση νομικού πριν το launch." },
  ] },
  en: { eyebrow: "Legal / Store", title: "Terms and conditions", intro: "Terms governing use of and purchases from the Ruseè online store.", sections: [
    { heading: "Business identity", content: "The online store is operated by ADD_YOUR_LEGAL_NAME, trading as ADD_YOUR_TRADING_NAME, registered at ADD_YOUR_REGISTERED_ADDRESS, VAT number ADD_YOUR_VAT_NUMBER, tax office ADD_YOUR_TAX_OFFICE, and contact email ADD_YOUR_CONTACT_EMAIL." },
    { heading: "Products and availability", content: "We present every design, size, composition and price as accurately as possible. Small colour differences may result from screen display or small-run production. Order acceptance remains subject to available stock." },
    { heading: "Prices, VAT and payment", content: "Prices are shown in euros and ADD_YOUR_VAT_INCLUSION_STATEMENT. Available payment methods are ADD_YOUR_PAYMENT_METHODS. Payment is completed in the contracted provider’s secure environment; Ruseè does not store full card details." },
    { heading: "Orders and contract", content: "A checkout acknowledgement is not by itself final acceptance. An order is confirmed once payment is verified and the piece is secured. If fulfilment is not possible, we will contact the customer." },
    { heading: "Delivery", content: "Shipping destinations, charges and estimated delivery times are ADD_YOUR_SHIPPING_TERMS. Any duties or restrictions for destinations outside ADD_YOUR_CUSTOMS_AREA must be confirmed before purchase." },
    { heading: "Governing law and disputes", content: "Mandatory consumer rights remain unaffected. The final governing law, jurisdiction and alternative-dispute wording is ADD_YOUR_LEGAL_DISPUTE_WORDING and requires legal approval before launch." },
  ] },
};

export const privacyDraft: LocalizedLegalDraft = {
  el: { eyebrow: "Νομικά / Απόρρητο", title: "Πολιτική απορρήτου", intro: "Πώς συλλέγουμε, χρησιμοποιούμε, προστατεύουμε και διατηρούμε προσωπικά δεδομένα.", sections: [
    { heading: "Υπεύθυνος επεξεργασίας", content: "Υπεύθυνος επεξεργασίας είναι ADD_YOUR_LEGAL_NAME, με διεύθυνση ADD_YOUR_REGISTERED_ADDRESS και email ιδιωτικότητας ADD_YOUR_PRIVACY_EMAIL." },
    { heading: "Δεδομένα που συλλέγουμε", content: "Συλλέγουμε στοιχεία επικοινωνίας, διευθύνσεις χρέωσης και παράδοσης, επιλογές παραγγελίας, κατάσταση πληρωμής και επικοινωνίες που απαιτούνται για ερωτήματα, παραγγελίες και υποστήριξη. Δεν αποθηκεύουμε πλήρη στοιχεία κάρτας ή CVV." },
    { heading: "Σκοποί και νομικές βάσεις", content: "Χρησιμοποιούμε δεδομένα για εκτέλεση παραγγελιών, πληρωμές, παράδοση, εξυπηρέτηση, ασφάλεια και υποχρεώσεις αρχείων. Οι τελικές νομικές βάσεις ανά σκοπό είναι ADD_YOUR_APPROVED_LAWFUL_BASES." },
    { heading: "Αποδέκτες και διαβιβάσεις", content: "Πάροχοι φιλοξενίας, email, πληρωμών και courier λαμβάνουν μόνο τα αναγκαία δεδομένα. Οι τελικοί πάροχοι, χώρες επεξεργασίας και εγγυήσεις διαβίβασης είναι ADD_YOUR_PROCESSOR_AND_TRANSFER_DETAILS." },
    { heading: "Χρόνοι διατήρησης", content: "Οι εγκεκριμένοι χρόνοι διατήρησης για ερωτήματα, παραγγελίες, πληρωμές, λογιστικά αρχεία και τεχνικά logs είναι ADD_YOUR_RETENTION_PERIODS." },
    { heading: "Δικαιώματα και καταγγελία", content: "Ανάλογα με τον GDPR, μπορείτε να ζητήσετε πρόσβαση, διόρθωση, φορητότητα, περιορισμό, εναντίωση ή διαγραφή μέσω ADD_YOUR_PRIVACY_EMAIL. Μπορείτε επίσης να απευθυνθείτε στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα. Η διαδικασία ταυτοποίησης αιτημάτων είναι ADD_YOUR_REQUEST_VERIFICATION_PROCESS." },
  ] },
  en: { eyebrow: "Legal / Privacy", title: "Privacy policy", intro: "How we collect, use, protect and retain personal information.", sections: [
    { heading: "Data controller", content: "The data controller is ADD_YOUR_LEGAL_NAME, registered at ADD_YOUR_REGISTERED_ADDRESS, with privacy email ADD_YOUR_PRIVACY_EMAIL." },
    { heading: "Information we collect", content: "We collect contact details, billing and delivery addresses, order selections, payment status and communications needed for enquiries, orders and support. We do not store full card details or CVV." },
    { heading: "Purposes and lawful bases", content: "We use information for order fulfilment, payments, delivery, support, security and record-keeping duties. The approved lawful basis for each purpose is ADD_YOUR_APPROVED_LAWFUL_BASES." },
    { heading: "Recipients and transfers", content: "Hosting, email, payment and courier providers receive only necessary information. Final processors, processing countries and transfer safeguards are ADD_YOUR_PROCESSOR_AND_TRANSFER_DETAILS." },
    { heading: "Retention", content: "Approved retention periods for enquiries, orders, payments, accounting records and technical logs are ADD_YOUR_RETENTION_PERIODS." },
    { heading: "Rights and complaints", content: "Subject to GDPR, you may request access, correction, portability, restriction, objection or erasure through ADD_YOUR_PRIVACY_EMAIL. You may also complain to the Hellenic Data Protection Authority. The request identity-check process is ADD_YOUR_REQUEST_VERIFICATION_PROCESS." },
  ] },
};

export const returnsDraft: LocalizedLegalDraft = {
  el: { eyebrow: "Νομικά / Επιστροφές", title: "Πολιτική επιστροφών", intro: "Η διαδικασία επιστροφής, ελέγχου και επιστροφής χρημάτων για επιλέξιμα προϊόντα.", sections: [
    { heading: "Δικαίωμα υπαναχώρησης", content: "Η εγκεκριμένη προθεσμία γνωστοποίησης υπαναχώρησης είναι ADD_YOUR_RETURN_NOTICE_PERIOD από ADD_YOUR_RETURN_PERIOD_START_EVENT. Τα δικαιώματα που προβλέπει υποχρεωτικά ο νόμος δεν περιορίζονται." },
    { heading: "Έναρξη επιστροφής", content: "Στείλτε αίτημα στο ADD_YOUR_RETURNS_EMAIL με αριθμό παραγγελίας και προϊόν. Η διεύθυνση επιστροφής είναι ADD_YOUR_RETURN_ADDRESS και οι εγκεκριμένες οδηγίες είναι ADD_YOUR_RETURN_INSTRUCTIONS." },
    { heading: "Κατάσταση προϊόντος", content: "Το προϊόν πρέπει να είναι αφόρετο, άπλυτο, χωρίς ζημιά και με τις αρχικές ετικέτες και συσκευασία, εκτός αν ο νόμος ορίζει διαφορετικά. Ο έλεγχος δεν πρέπει να υπερβαίνει ό,τι είναι εύλογα αναγκαίο για τη φύση και την εφαρμογή του." },
    { heading: "Έξοδα επιστροφής", content: "Το κόστος επιστροφής καλύπτεται από ADD_YOUR_RETURN_SHIPPING_PAYER με υπηρεσία ADD_YOUR_RETURN_COURIER. Η πολιτική για τα αρχικά έξοδα αποστολής είναι ADD_YOUR_ORIGINAL_SHIPPING_REFUND_RULE." },
    { heading: "Επιστροφή χρημάτων", content: "Μετά την παραλαβή και τον έλεγχο, η εγκεκριμένη επιστροφή χρημάτων γίνεται στην αρχική μέθοδο πληρωμής εντός ADD_YOUR_REFUND_TIMING, με την επιφύλαξη των νόμιμων προθεσμιών και του χρόνου επεξεργασίας της τράπεζας." },
    { heading: "Εξαιρέσεις και ελαττωματικά προϊόντα", content: "Τυχόν νόμιμες εξαιρέσεις για εξατομικευμένα ή κατά παραγγελία προϊόντα είναι ADD_YOUR_RETURN_EXCLUSIONS. Για λάθος, ελαττωματικό ή κατεστραμμένο προϊόν επικοινωνήστε στο ADD_YOUR_RETURNS_EMAIL με φωτογραφίες και αριθμό παραγγελίας." },
  ] },
  en: { eyebrow: "Legal / Returns", title: "Returns policy", intro: "The return, inspection and refund process for eligible pieces.", sections: [
    { heading: "Withdrawal right", content: "The approved withdrawal notice period is ADD_YOUR_RETURN_NOTICE_PERIOD from ADD_YOUR_RETURN_PERIOD_START_EVENT. Mandatory statutory rights remain unaffected." },
    { heading: "Starting a return", content: "Send a request to ADD_YOUR_RETURNS_EMAIL with the order number and product. The return address is ADD_YOUR_RETURN_ADDRESS and the approved instructions are ADD_YOUR_RETURN_INSTRUCTIONS." },
    { heading: "Product condition", content: "The piece should be unworn, unwashed, undamaged and accompanied by original tags and packaging unless the law provides otherwise. Inspection should not go beyond what is reasonably necessary to assess its nature and fit." },
    { heading: "Return shipping", content: "Return shipping is paid by ADD_YOUR_RETURN_SHIPPING_PAYER using ADD_YOUR_RETURN_COURIER. The rule for original delivery charges is ADD_YOUR_ORIGINAL_SHIPPING_REFUND_RULE." },
    { heading: "Refunds", content: "After receipt and inspection, an approved refund is issued to the original payment method within ADD_YOUR_REFUND_TIMING, subject to statutory deadlines and bank processing time." },
    { heading: "Exceptions and faulty pieces", content: "Any lawful exclusions for personalised or made-to-order pieces are ADD_YOUR_RETURN_EXCLUSIONS. For an incorrect, faulty or damaged piece, contact ADD_YOUR_RETURNS_EMAIL with photographs and the order number." },
  ] },
};

export const cookiesDraft: LocalizedLegalDraft = {
  el: { eyebrow: "Νομικά / Cookies", title: "Πολιτική cookies", intro: "Οι τεχνολογίες αποθήκευσης που χρησιμοποιεί το κατάστημα και οι διαθέσιμες επιλογές.", sections: [
    { heading: "Τι είναι τα cookies", content: "Τα cookies και παρόμοιες τεχνολογίες είναι μικρές εγγραφές που βοηθούν μια ιστοσελίδα να διατηρεί ασφαλείς συνεδρίες, καλάθι και προτιμήσεις ή, μόνο με την απαιτούμενη συναίνεση, να μετρά τη χρήση." },
    { heading: "Απολύτως απαραίτητα", content: "Το κατάστημα χρησιμοποιεί απαραίτητη αποθήκευση για ασφάλεια, admin sessions, καλάθι, γλώσσα και επιλογή cookies. Η τελική λίστα ονομάτων, παρόχων, σκοπών και διάρκειας είναι ADD_YOUR_ESSENTIAL_COOKIE_TABLE." },
    { heading: "Προαιρετικά analytics και marketing", content: "Τα προαιρετικά εργαλεία παραμένουν απενεργοποιημένα μέχρι έγκυρη συγκατάθεση. Οι εγκεκριμένοι πάροχοι, cookies, σκοποί και διάρκειες είναι ADD_YOUR_OPTIONAL_COOKIE_TABLE. Αν δεν χρησιμοποιούνται, αντικαταστήστε το πεδίο με NONE." },
    { heading: "Διαχείριση συναίνεσης", content: "Η επιλογή Essential only απορρίπτει τις προαιρετικές τεχνολογίες και η επιλογή Accept all καταγράφει συγκατάθεση. Ο εγκεκριμένος χρόνος διατήρησης της επιλογής είναι ADD_YOUR_CONSENT_DURATION και ο τρόπος ανάκλησης είναι ADD_YOUR_CONSENT_WITHDRAWAL_METHOD." },
    { heading: "Ρυθμίσεις browser και επικοινωνία", content: "Μπορείτε να διαγράψετε ή να αποκλείσετε cookies από τον browser, όμως η απαγόρευση απαραίτητης αποθήκευσης μπορεί να επηρεάσει καλάθι ή ασφαλείς λειτουργίες. Για ερωτήσεις επικοινωνήστε στο ADD_YOUR_PRIVACY_EMAIL." },
  ] },
  en: { eyebrow: "Legal / Cookies", title: "Cookies policy", intro: "Storage technologies used by the store and the choices available to you.", sections: [
    { heading: "What cookies are", content: "Cookies and similar technologies are small records that help a website maintain secure sessions, a cart and preferences or, only with required consent, measure service use." },
    { heading: "Strictly necessary storage", content: "The store uses necessary storage for security, admin sessions, cart operation, language and cookie preference. The final names, providers, purposes and lifetimes are ADD_YOUR_ESSENTIAL_COOKIE_TABLE." },
    { heading: "Optional analytics and marketing", content: "Optional tools remain disabled until valid consent. Approved providers, cookies, purposes and lifetimes are ADD_YOUR_OPTIONAL_COOKIE_TABLE. If none are used, replace the field with NONE." },
    { heading: "Managing consent", content: "Essential only declines optional technologies and Accept all records consent. The approved preference lifetime is ADD_YOUR_CONSENT_DURATION and the withdrawal method is ADD_YOUR_CONSENT_WITHDRAWAL_METHOD." },
    { heading: "Browser settings and contact", content: "You may delete or block cookies in your browser, although blocking necessary storage can affect cart or secure functions. For questions, contact ADD_YOUR_PRIVACY_EMAIL." },
  ] },
};

export const legalDraftsBySlug = {
  terms: termsDraft,
  "privacy-policy": privacyDraft,
  returns: returnsDraft,
  cookies: cookiesDraft,
} as const;
