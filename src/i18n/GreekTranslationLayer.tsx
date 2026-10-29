"use client";

import { useEffect } from "react";
import type { Locale } from "./config";

const exact: Record<string, string> = {
  "The Kimono Study": "Η Σπουδή του Κιμονό",
  "A study in cloth, colour and the freedom of an open silhouette.": "Μια μελέτη στο ύφασμα, το χρώμα και την ελευθερία μιας ανοιχτής σιλουέτας.",
  "Discover the collection": "Ανακαλύψτε τη συλλογή",
  "The kimono study — 01": "Η σπουδή του κιμονό — 01",
  "Not simply worn.": "Δεν φοριέται απλώς.", "Inhabited.": "Κατοικείται.",
  "Ruseè begins with one essential form and lets print, proportion and movement tell the rest of the story.": "Η Ruseè ξεκινά με μία ουσιαστική φόρμα και αφήνει το μοτίβο, την αναλογία και την κίνηση να αφηγηθούν την υπόλοιπη ιστορία.",
  "A line that moves": "Μια γραμμή που κινείται", "Colour with memory": "Χρώμα με μνήμη", "Made for repetition": "Φτιαγμένο για επανάληψη",
  "An unstructured silhouette with enough shape to feel composed and enough ease to remain entirely yours.": "Μια ελεύθερη σιλουέτα με αρκετή δομή για να δείχνει ολοκληρωμένη και αρκετή άνεση για να παραμένει απόλυτα δική σας.",
  "Prints are built like recollections: botanical, mineral and nocturnal, softened by texture and time.": "Τα μοτίβα χτίζονται σαν αναμνήσεις: βοτανικά, ορυκτά και νυχτερινά, απαλά από την υφή και τον χρόνο.",
  "Signature collection": "Χαρακτηριστική συλλογή", "One form.Fifteen designs.": "Μία φόρμα. Δεκαπέντε σχέδια.", "One form.": "Μία φόρμα.", "Fifteen designs.": "Δεκαπέντε σχέδια.",
  "Choose a design, colour and size. Each variation keeps the same easy architecture and changes its atmosphere.": "Επιλέξτε σχέδιο, χρώμα και μέγεθος. Κάθε παραλλαγή διατηρεί την ίδια ανάλαφρη αρχιτεκτονική και αλλάζει ατμόσφαιρα.",
  "Shop the kimono": "Αγοράστε το κιμονό", "The studio note": "Σημείωμα του ατελιέ", "Our point of view": "Η οπτική μας",
  "Choose your atmosphere": "Επιλέξτε την ατμόσφαιρά σας", "Explore the collection": "Εξερευνήστε τη συλλογή",
  "Design studies": "Μελέτες σχεδίων", "Choose an atmosphere.": "Επιλέξτε μια ατμόσφαιρα.", "Ruseè design": "Σχέδιο Ruseè", "View design": "Προβολή σχεδίου", "Previous design": "Προηγούμενο σχέδιο", "Next design": "Επόμενο σχέδιο",
  "Deep florals composed like shadows at the edge of evening.": "Βαθιά άνθη, συντεθειμένα σαν σκιές στην άκρη του δειλινού.",
  "A piece for travelling, hosting, wandering and returning—the garment you reach for without thinking.": "Ένα κομμάτι για ταξίδια, φιλοξενία, περιπλάνηση και επιστροφή—το ένδυμα που επιλέγετε χωρίς δεύτερη σκέψη.",
  "Made in considered runs": "Παραγωγή σε προσεγμένες σειρές", "One shape, many moods.Make it yours.": "Μία γραμμή, πολλές διαθέσεις. Κάντε τη δική σας.", "One shape,": "Μία γραμμή,", "many moods.": "πολλές διαθέσεις.", "Make it": "Κάντε το", "yours.": "δικό σας.",
  "About Ruseè": "Σχετικά με τη Ruseè", "Clothes for the spacebetween occasions.": "Ρούχα για τον χώρο ανάμεσα στις περιστάσεις.",
  "Clothes for the space": "Ρούχα για τον χώρο", "between occasions.": "ανάμεσα στις περιστάσεις.",
  "We believe the most loved garments are not reserved. They enter the rhythm of a life.": "Πιστεύουμε ότι τα πιο αγαπημένα ρούχα δεν κρατιούνται για ειδικές στιγμές. Μπαίνουν στον ρυθμό της ζωής.",
  "Ruseè begins in Greece with an ancient, generous idea: a garment can create shape without restricting the body. We reinterpret the open robe as an everyday editorial piece.": "Η Ruseè ξεκινά στην Ελλάδα από μια αρχαία, γενναιόδωρη ιδέα: ένα ένδυμα μπορεί να δίνει σχήμα χωρίς να περιορίζει το σώμα. Επαναπροσδιορίζουμε την ανοιχτή ρόμπα ως καθημερινό editorial κομμάτι.",
  "Instead of seasons full of noise, we work around one silhouette and explore it through print, colour and feeling. Fewer decisions. Better ones. A wardrobe with memory.": "Αντί για εποχές γεμάτες θόρυβο, δουλεύουμε γύρω από μία σιλουέτα και την εξερευνούμε μέσα από μοτίβο, χρώμα και συναίσθημα. Λιγότερες αποφάσεις. Καλύτερες αποφάσεις. Μια γκαρνταρόμπα με μνήμη.",
  "A soft architecture that follows movement.": "Μια απαλή αρχιτεκτονική που ακολουθεί την κίνηση.", "Prints with atmosphere rather than trend.": "Μοτίβα με ατμόσφαιρα αντί για τάση.", "Pieces designed to be reached for again.": "Κομμάτια σχεδιασμένα για να τα επιλέγετε ξανά.",
  "Our approach": "Η προσέγγισή μας", "Ease": "Άνεση", "Expression": "Έκφραση", "Return": "Επιστροφή", "Find your variation": "Βρείτε την παραλλαγή σας", "Wear the story.": "Φορέστε την ιστορία.",
  "Questions, considered": "Ερωτήσεις, με φροντίδα", "Everything we know so far. Launch policies will be finalized before payments go live.": "Όλα όσα γνωρίζουμε μέχρι τώρα. Οι πολιτικές θα οριστικοποιηθούν πριν ενεργοποιηθούν οι πληρωμές.",
  "The garment": "Το ένδυμα", "Orders & delivery": "Παραγγελίες & παράδοση", "Returns": "Επιστροφές", "Information": "Πληροφορίες", "Shipping": "Αποστολές", "Care & fit": "Φροντίδα & εφαρμογή",
  "How does the kimono fit?": "Πώς εφαρμόζει το κιμονό;", "Are all designs the same shape?": "Έχουν όλα τα σχέδια την ίδια γραμμή;", "How should I care for it?": "Πώς πρέπει να το φροντίζω;",
  "The silhouette is intentionally relaxed. Choose your usual size for an easy fit; measurements and a complete size guide will be available on the product page.": "Η σιλουέτα είναι σκόπιμα άνετη. Επιλέξτε το συνηθισμένο σας μέγεθος για χαλαρή εφαρμογή· οι μετρήσεις και ο πλήρης οδηγός μεγεθών θα εμφανίζονται στη σελίδα προϊόντος.",
  "Yes. The Signature Kimono uses one considered pattern, expressed through different designs and colours.": "Ναι. Το χαρακτηριστικό κιμονό βασίζεται σε ένα μελετημένο πατρόν, που εκφράζεται μέσα από διαφορετικά σχέδια και χρώματα.",
  "Use a cool gentle wash, dry in shade and steam or iron at low temperature. Follow the final care label attached to your garment.": "Πλύνετε απαλά σε χαμηλή θερμοκρασία, στεγνώστε στη σκιά και χρησιμοποιήστε ατμό ή χαμηλή θερμοκρασία σιδερώματος. Ακολουθείτε πάντα την ετικέτα φροντίδας του ενδύματος.",
  "Where do you ship?": "Πού αποστέλλετε;", "Can I change my order?": "Μπορώ να αλλάξω την παραγγελία μου;", "What payment methods will be available?": "Ποιοι τρόποι πληρωμής θα είναι διαθέσιμοι;",
  "We plan to ship throughout Greece and internationally. Exact destinations, delivery times and rates will be shown at checkout.": "Σχεδιάζουμε αποστολές σε όλη την Ελλάδα και διεθνώς. Οι ακριβείς προορισμοί, χρόνοι και χρεώσεις θα εμφανίζονται στο ταμείο.",
  "Contact us as soon as possible. If fulfilment has not started, we will do our best to help.": "Επικοινωνήστε μαζί μας το συντομότερο δυνατό. Αν δεν έχει ξεκινήσει η εκτέλεση, θα κάνουμε το καλύτερο δυνατό για να βοηθήσουμε.",
  "The launch checkout is planned to support secure card payments and selected wallets through contracted payment providers.": "Το ταμείο θα υποστηρίζει ασφαλείς πληρωμές με κάρτα και επιλεγμένα ψηφιακά πορτοφόλια μέσω συμβεβλημένων παρόχων πληρωμών.",
  "Can I return a piece?": "Μπορώ να επιστρέψω ένα τεμάχιο;", "When will I receive a refund?": "Πότε θα λάβω την επιστροφή χρημάτων;",
  "Yes, subject to the final returns policy and applicable consumer law. Items must be unworn, unwashed and returned with their original tags.": "Ναι, σύμφωνα με την τελική πολιτική επιστροφών και την ισχύουσα νομοθεσία καταναλωτή. Τα προϊόντα πρέπει να είναι αφόρετα, άπλυτα και με τις αρχικές τους ετικέτες.",
  "After an accepted return is inspected, the refund will be issued to the original payment method. Bank processing time may vary.": "Μετά τον έλεγχο μιας αποδεκτής επιστροφής, τα χρήματα επιστρέφονται στον αρχικό τρόπο πληρωμής. Ο χρόνος επεξεργασίας της τράπεζας μπορεί να διαφέρει.",
  "Contact the studio": "Επικοινωνήστε με το ατελιέ", "Let's begin a conversation": "Ας ξεκινήσουμε μια συζήτηση", "Sayhello.": "Πείτε μας γεια.", "Say": "Πείτε", "hello.": "γεια.",
  "Questions about fit, an order, press or a future collaboration are always welcome. Tell us what brings you here and the studio will reply shortly.": "Ερωτήσεις για την εφαρμογή, μια παραγγελία, τον Τύπο ή μια μελλοντική συνεργασία είναι πάντα ευπρόσδεκτες. Πείτε μας τι σας φέρνει εδώ και το ατελιέ θα απαντήσει σύντομα.",
  "My name is": "Το όνομά μου είναι", "My email is": "Το email μου είναι", "I'm writing about": "Γράφω σχετικά με", "Order number": "Αριθμός παραγγελίας", "Your message": "Το μήνυμά σας", "Send message": "Αποστολή μηνύματος",
  "Full name": "Ονοματεπώνυμο", "Email address": "Διεύθυνση email", "Optional": "Προαιρετικό", "Tell us a little more": "Πείτε μας λίγα περισσότερα",
  "Order question": "Ερώτηση παραγγελίας", "Fit and sizing": "Εφαρμογή και μεγέθη", "Press": "Τύπος", "Stockist enquiry": "Ερώτηση συνεργάτη λιανικής", "Collaboration": "Συνεργασία",
  "The design index": "Ευρετήριο σχεδίων", "Fifteen moods.One silhouette.": "Δεκαπέντε διαθέσεις. Μία σιλουέτα.", "Fifteen moods.": "Δεκαπέντε διαθέσεις.", "One silhouette.": "Μία σιλουέτα.",
  "Study": "Μελέτη", "Ink": "Μελάνι", "Clay": "Πηλός", "Sage": "Φασκόμηλο", "Find the mood that moves.Make the form your own.": "Βρείτε τη διάθεση που κινείται. Δώστε στη φόρμα τον δικό σας χαρακτήρα.", "Find the mood": "Βρείτε τη διάθεση", "that moves.": "που κινείται.", "Make the form": "Δώστε στη φόρμα", "your own.": "τον δικό σας χαρακτήρα.", "Return to the design index": "Επιστροφή στο ευρετήριο σχεδίων",
  "3 sec autoplay": "Αυτόματη εναλλαγή 3 δευτ.",
  "Hover each study to move from the design detail to the way it lives on the body. Choose one to configure its colour and size.": "Περάστε πάνω από κάθε μελέτη για να δείτε πώς ζει το σχέδιο πάνω στο σώμα. Επιλέξτε μία για χρώμα και μέγεθος.",
  "View": "Προβολή", "DesignIndex": "ΕυρετήριοΣχεδίων", "Design": "Σχέδιο", "Index": "Ευρετήριο",
  "Ruseè design study": "Μελέτη σχεδίου Ruseè", "Signature kimono": "Χαρακτηριστικό κιμονό", "Colour": "Χρώμα", "Size": "Μέγεθος", "Add to bag": "Προσθήκη στην τσάντα", "Unavailable": "Μη διαθέσιμο", "In stock": "Σε απόθεμα", "Out of stock": "Εξαντλημένο", "Checking…": "Έλεγχος…", "Added to your bag.": "Προστέθηκε στην τσάντα σας.",
  "The making of the piece": "Η δημιουργία του κομματιού", "An everyday form,finished with intention.": "Μια καθημερινή φόρμα, ολοκληρωμένη με πρόθεση.", "Manufacturer": "Κατασκευαστής", "Composition": "Σύνθεση", "Care": "Φροντίδα", "Provenance": "Προέλευση",
  "Continue the study": "Συνεχίστε τη μελέτη", "Explore all designs": "Εξερευνήστε όλα τα σχέδια",
  "Your bag": "Η τσάντα σας", "Your bag is waiting.": "Η τσάντα σας περιμένει.", "Continue exploring": "Συνεχίστε την εξερεύνηση", "Subtotal": "Υποσύνολο", "Review bag": "Έλεγχος τσάντας", "Remove": "Αφαίρεση", "Quantity": "Ποσότητα",
  "Secure guest checkout": "Ασφαλής αγορά χωρίς λογαριασμό", "Delivery details": "Στοιχεία παράδοσης", "Contact": "Επικοινωνία", "Delivery in Greece": "Παράδοση στην Ελλάδα", "First name": "Όνομα", "Last name": "Επώνυμο", "Phone": "Τηλέφωνο", "Address": "Διεύθυνση", "Apartment, suite, etc.": "Διαμέρισμα, όροφος κ.λπ.", "City": "Πόλη", "Region": "Περιφέρεια", "Postal code": "Ταχυδρομικός κώδικας", "Country": "Χώρα", "Greece": "Ελλάδα",
  "Order review": "Σύνοψη παραγγελίας", "Delivery": "Παράδοση", "Complimentary": "Δωρεάν", "Total": "Σύνολο", "Pay securely": "Ασφαλής πληρωμή", "Opening secure payment…": "Άνοιγμα ασφαλούς πληρωμής…",
  "You will continue to the secure hosted page of the configured bank or payment provider.": "Θα μεταφερθείτε στην ασφαλή σελίδα της επιλεγμένης τράπεζας ή του παρόχου πληρωμών.",
  "Your bag is empty.": "Η τσάντα σας είναι άδεια.", "Return to the collection": "Επιστροφή στη συλλογή",
  "Cookie preferences": "Προτιμήσεις cookies", "A considered experience.": "Μια προσεγμένη εμπειρία.", "Read the cookies policy": "Διαβάστε την πολιτική cookies", "Accept all": "Αποδοχή όλων", "Essential only": "Μόνο απαραίτητα",
  "Essential storage keeps the site secure and remembers your choice. Optional analytics will only be enabled after consent.": "Η απαραίτητη αποθήκευση διατηρεί τον ιστότοπο ασφαλή και θυμάται την επιλογή σας. Τα προαιρετικά αναλυτικά στοιχεία ενεργοποιούνται μόνο μετά από συγκατάθεση.",
  "Letters from the studio": "Γράμματα από το ατελιέ", "Stories of colour,cloth and movement.": "Ιστορίες χρώματος, υφάσματος και κίνησης.", "Stories of colour,": "Ιστορίες χρώματος,", "cloth and movement.": "υφάσματος και κίνησης.", "Designed in Greece": "Σχεδιασμένο στην Ελλάδα", "Shipping worldwide": "Αποστολές παγκοσμίως", "Cookies": "Cookies", "Terms": "Όροι", "Kimono study Nº 01": "Σπουδή κιμονό Nº 01",
  "Privacy policy": "Πολιτική απορρήτου", "Cookies policy": "Πολιτική cookies", "Terms & conditions": "Όροι & προϋποθέσεις", "Returns policy": "Πολιτική επιστροφών",
  "Who we are": "Ποιοι είμαστε", "Information we collect": "Πληροφορίες που συλλέγουμε", "How we use information": "Πώς χρησιμοποιούμε τις πληροφορίες", "Payments and service providers": "Πληρωμές και πάροχοι υπηρεσιών", "Retention": "Διατήρηση", "Your rights": "Τα δικαιώματά σας", "Contact and complaints": "Επικοινωνία και καταγγελίες",
  "Ruseè is an independent kimono design project based in Greece. The final trading name, registered address and data-controller details must be inserted here before launch.": "Η Ruseè είναι ένα ανεξάρτητο εγχείρημα σχεδιασμού κιμονό με βάση την Ελλάδα. Η τελική εμπορική επωνυμία, η καταχωρισμένη διεύθυνση και τα στοιχεία του υπευθύνου επεξεργασίας πρέπει να προστεθούν πριν από την έναρξη λειτουργίας.",
  "We collect the information needed to answer enquiries and fulfil orders, including your name, contact details, delivery and billing information, order selections, payment status and communications with the studio. We do not store card details.": "Συλλέγουμε τις πληροφορίες που απαιτούνται για την απάντηση ερωτημάτων και την εκτέλεση παραγγελιών, όπως όνομα, στοιχεία επικοινωνίας, παράδοσης και χρέωσης, επιλογές παραγγελίας, κατάσταση πληρωμής και επικοινωνίες με το ατελιέ. Δεν αποθηκεύουμε στοιχεία κάρτας.",
  "Information is used to operate checkout, reserve stock, process and reconcile payments, deliver orders, send transactional updates, provide support, prevent abuse and meet accounting or legal duties.": "Οι πληροφορίες χρησιμοποιούνται για τη λειτουργία του ταμείου, τη δέσμευση αποθέματος, την επεξεργασία και συμφωνία πληρωμών, την παράδοση, τις ενημερώσεις συναλλαγών, την υποστήριξη, την πρόληψη κατάχρησης και την εκπλήρωση λογιστικών ή νομικών υποχρεώσεων.",
  "Payment details are entered on the secure environment of the selected payment provider or acquiring bank. Delivery, hosting, email and payment partners receive only the information required to provide their contracted service.": "Τα στοιχεία πληρωμής εισάγονται στο ασφαλές περιβάλλον του επιλεγμένου παρόχου ή της συνεργαζόμενης τράπεζας. Οι συνεργάτες παράδοσης, φιλοξενίας, email και πληρωμών λαμβάνουν μόνο τα απολύτως απαραίτητα στοιχεία.",
  "Enquiries are retained only while useful for communication. Order, payment and accounting records may be retained for the period required by Greek and EU law. Operational logs are kept for a limited security and troubleshooting period.": "Τα ερωτήματα διατηρούνται μόνο όσο είναι χρήσιμα για την επικοινωνία. Τα αρχεία παραγγελιών, πληρωμών και λογιστικής μπορεί να διατηρούνται για το διάστημα που απαιτεί η ελληνική και ευρωπαϊκή νομοθεσία. Τα λειτουργικά αρχεία καταγραφής διατηρούνται για περιορισμένο διάστημα.",
  "Subject to applicable GDPR limits, you may request access, correction, portability, restriction, objection or erasure. You may also withdraw marketing consent at any time without affecting prior lawful processing.": "Με την επιφύλαξη των ορίων του GDPR, μπορείτε να ζητήσετε πρόσβαση, διόρθωση, φορητότητα, περιορισμό, εναντίωση ή διαγραφή. Μπορείτε επίσης να ανακαλέσετε τη συγκατάθεση εμπορικής επικοινωνίας οποτεδήποτε.",
  "Privacy requests can be sent to the studio email shown in the footer. You may also lodge a complaint with the Hellenic Data Protection Authority. Final contact and controller details require legal review before launch.": "Τα αιτήματα απορρήτου μπορούν να αποστέλλονται στο email του ατελιέ που εμφανίζεται στο υποσέλιδο. Μπορείτε επίσης να υποβάλετε καταγγελία στην Αρχή Προστασίας Δεδομένων Προσωπικού Χαρακτήρα. Τα τελικά στοιχεία απαιτούν νομικό έλεγχο πριν από την έναρξη.",
  "What cookies are": "Τι είναι τα cookies", "Essential storage": "Απαραίτητη αποθήκευση", "Optional analytics": "Προαιρετικά αναλυτικά στοιχεία", "Your preference": "Η προτίμησή σας", "How long choices remain": "Διάρκεια επιλογών", "Browser controls": "Ρυθμίσεις προγράμματος περιήγησης",
  "Cookies and similar browser storage are small records used by websites to maintain secure sessions, remember preferences and, where permitted, understand how a service is used.": "Τα cookies και παρόμοια μέσα αποθήκευσης είναι μικρές εγγραφές που χρησιμοποιούνται για ασφαλείς συνεδρίες, αποθήκευση προτιμήσεων και, όπου επιτρέπεται, κατανόηση της χρήσης μιας υπηρεσίας.",
  "Ruseè uses essential storage for security, administration sessions, cart operation and your cookie preference. These functions are required for the service and cannot be switched off through the consent banner.": "Η Ruseè χρησιμοποιεί απαραίτητη αποθήκευση για ασφάλεια, συνεδρίες διαχείρισης, λειτουργία καλαθιού και την προτίμηση cookies. Αυτές οι λειτουργίες είναι απαραίτητες και δεν απενεργοποιούνται από το πλαίσιο συγκατάθεσης.",
  "Analytics or marketing technologies must remain disabled until you actively accept them. The exact providers, purposes, cookie names and lifetimes must be added here before any such technology is enabled.": "Οι τεχνολογίες αναλυτικών ή εμπορικής προώθησης παραμένουν απενεργοποιημένες μέχρι την ενεργή συγκατάθεσή σας. Οι πάροχοι, σκοποί, ονομασίες και διάρκειες πρέπει να προστεθούν πριν ενεργοποιηθεί οποιαδήποτε τέτοια τεχνολογία.",
  "Choosing ‘Essential only’ records that optional technologies are declined. Choosing ‘Accept all’ records consent. Neither choice should prevent access to the storefront.": "Η επιλογή «Μόνο απαραίτητα» καταγράφει την απόρριψη προαιρετικών τεχνολογιών. Η επιλογή «Αποδοχή όλων» καταγράφει τη συγκατάθεση. Καμία επιλογή δεν εμποδίζει την πρόσβαση στο κατάστημα.",
  "The current banner stores your decision locally in your browser. You can clear site data in your browser to remove that choice and display the banner again.": "Το πλαίσιο αποθηκεύει την απόφασή σας τοπικά στο πρόγραμμα περιήγησης. Μπορείτε να διαγράψετε τα δεδομένα ιστοτόπου για να αφαιρέσετε την επιλογή και να εμφανιστεί ξανά.",
  "You can also block or delete cookies through your browser settings. Blocking essential storage may affect the cart, checkout, administration or other secure functions.": "Μπορείτε επίσης να αποκλείσετε ή να διαγράψετε cookies από τις ρυθμίσεις του προγράμματος περιήγησης. Ο αποκλεισμός απαραίτητης αποθήκευσης μπορεί να επηρεάσει το καλάθι, το ταμείο, τη διαχείριση ή άλλες ασφαλείς λειτουργίες.",
  "About these terms": "Σχετικά με αυτούς τους όρους", "Products and availability": "Προϊόντα και διαθεσιμότητα", "Prices and payment": "Τιμές και πληρωμή", "Order acceptance": "Αποδοχή παραγγελίας", "Intellectual property": "Πνευματική ιδιοκτησία", "Governing terms": "Εφαρμοστέοι όροι",
  "These terms govern purchases from the Ruseè online store. Replace the placeholder merchant identity, registered address, VAT number and contact details with the approved business information before launch.": "Οι παρόντες όροι διέπουν τις αγορές από το ηλεκτρονικό κατάστημα Ruseè. Πριν από την έναρξη, τα προσωρινά στοιχεία εμπόρου, έδρας, ΑΦΜ και επικοινωνίας πρέπει να αντικατασταθούν με τα εγκεκριμένα εταιρικά στοιχεία.",
  "Product imagery and descriptions aim to represent each piece accurately. Natural colour, screen and small-run production variations may occur. An order is subject to stock availability and final acceptance.": "Οι εικόνες και περιγραφές αποσκοπούν στην ακριβή παρουσίαση κάθε τεμαχίου. Ενδέχεται να υπάρχουν φυσικές αποκλίσεις χρώματος, οθόνης και μικρής παραγωγής. Η παραγγελία εξαρτάται από τη διαθεσιμότητα και την τελική αποδοχή.",
  "Prices are displayed in euros and should state whether applicable VAT is included. Payment is processed by the selected bank or payment provider; Ruseè does not store full card details.": "Οι τιμές εμφανίζονται σε ευρώ και πρέπει να αναφέρουν αν περιλαμβάνεται ο ισχύων ΦΠΑ. Η πληρωμή διεκπεραιώνεται από την επιλεγμένη τράπεζα ή πάροχο· η Ruseè δεν αποθηκεύει πλήρη στοιχεία κάρτας.",
  "Checkout acknowledgement does not by itself guarantee acceptance. The order is confirmed after payment is verified and stock is secured. We will contact you if an item cannot be supplied.": "Η επιβεβαίωση υποβολής στο ταμείο δεν εγγυάται από μόνη της την αποδοχή. Η παραγγελία επιβεβαιώνεται μετά την επαλήθευση πληρωμής και τη δέσμευση αποθέματος. Θα επικοινωνήσουμε μαζί σας αν ένα προϊόν δεν μπορεί να διατεθεί.",
  "Available destinations, delivery estimates, charges and any customs responsibilities must be shown before purchase. Delivery dates are estimates unless expressly agreed otherwise.": "Οι διαθέσιμοι προορισμοί, οι εκτιμώμενοι χρόνοι, οι χρεώσεις και τυχόν τελωνειακές υποχρεώσεις πρέπει να εμφανίζονται πριν από την αγορά. Οι ημερομηνίες παράδοσης είναι εκτιμήσεις, εκτός αν συμφωνηθεί ρητά διαφορετικά.",
  "The Ruseè name, designs, photographs, writing and visual material remain protected by applicable intellectual-property law and may not be reproduced commercially without permission.": "Η ονομασία Ruseè, τα σχέδια, οι φωτογραφίες, τα κείμενα και το οπτικό υλικό προστατεύονται από τη νομοθεσία πνευματικής ιδιοκτησίας και δεν επιτρέπεται η εμπορική αναπαραγωγή χωρίς άδεια.",
  "Mandatory consumer rights remain unaffected. The final governing-law, dispute-resolution and alternative-dispute-resolution wording must be reviewed for Greek and EU compliance before live sales.": "Τα υποχρεωτικά δικαιώματα καταναλωτή δεν επηρεάζονται. Η τελική διατύπωση για εφαρμοστέο δίκαιο και επίλυση διαφορών πρέπει να ελεγχθεί ως προς την ελληνική και ευρωπαϊκή συμμόρφωση πριν από τις πωλήσεις.",
  "Your return rights": "Τα δικαιώματα επιστροφής", "Return condition": "Κατάσταση επιστροφής", "Starting a return": "Έναρξη επιστροφής", "Return shipping": "Αποστολή επιστροφής", "Refund timing": "Χρόνος επιστροφής χρημάτων", "Faulty or incorrect pieces": "Ελαττωματικά ή λανθασμένα προϊόντα", "Made-to-order exclusions": "Εξαιρέσεις κατά παραγγελία",
  "Eligible consumers may have a statutory withdrawal right for online purchases. The final return period, process, exclusions and model withdrawal form must be confirmed under Greek and EU consumer law before launch.": "Οι επιλέξιμοι καταναλωτές μπορεί να διαθέτουν νόμιμο δικαίωμα υπαναχώρησης για ηλεκτρονικές αγορές. Η τελική προθεσμία, διαδικασία, εξαιρέσεις και το υπόδειγμα υπαναχώρησης πρέπει να επιβεβαιωθούν σύμφωνα με το ελληνικό και ευρωπαϊκό δίκαιο.",
  "Unless a legal exception applies, returned pieces should be unworn, unwashed, undamaged and accompanied by their original tags and packaging. Trying on a garment should not go beyond what is reasonably necessary to assess it.": "Εκτός αν ισχύει νόμιμη εξαίρεση, τα επιστρεφόμενα τεμάχια πρέπει να είναι αφόρετα, άπλυτα, χωρίς ζημιές και με τις αρχικές ετικέτες και συσκευασία. Η δοκιμή δεν πρέπει να υπερβαίνει ό,τι είναι εύλογα αναγκαίο για την αξιολόγηση.",
  "Contact the studio at the email shown in the footer with your order number and the item you wish to return. We will provide the approved return address and instructions.": "Επικοινωνήστε με το ατελιέ στο email του υποσέλιδου, αναφέροντας τον αριθμό παραγγελίας και το προϊόν που θέλετε να επιστρέψετε. Θα σας αποσταλούν η εγκεκριμένη διεύθυνση και οι οδηγίες.",
  "State clearly before launch who pays return shipping, which service should be used and whether original delivery charges are refundable. Keep proof of postage until the return is completed.": "Πριν από την έναρξη πρέπει να αναφέρεται σαφώς ποιος επιβαρύνεται με τα έξοδα επιστροφής, ποια υπηρεσία χρησιμοποιείται και αν επιστρέφονται τα αρχικά μεταφορικά. Κρατήστε την απόδειξη αποστολής μέχρι την ολοκλήρωση.",
  "Approved refunds are issued to the original payment method after the return is received and inspected, subject to statutory deadlines. Your bank or payment provider may require additional processing time.": "Οι εγκεκριμένες επιστροφές χρημάτων εκδίδονται στον αρχικό τρόπο πληρωμής μετά την παραλαβή και τον έλεγχο, εντός των νόμιμων προθεσμιών. Η τράπεζα ή ο πάροχος μπορεί να χρειαστεί επιπλέον χρόνο.",
  "If an item arrives faulty, damaged or different from the order, contact us promptly with the order number and supporting photographs so the appropriate repair, replacement, reduction or refund remedy can be arranged.": "Αν ένα προϊόν φτάσει ελαττωματικό, κατεστραμμένο ή διαφορετικό από την παραγγελία, επικοινωνήστε άμεσα με τον αριθμό παραγγελίας και φωτογραφίες, ώστε να οργανωθεί η κατάλληλη επισκευή, αντικατάσταση, μείωση ή επιστροφή χρημάτων.",
  "Personalised or genuinely made-to-order goods may be excluded from the standard withdrawal right where the law permits. Any such exclusion must be disclosed clearly before purchase and legally reviewed.": "Τα εξατομικευμένα ή πραγματικά κατά παραγγελία προϊόντα ενδέχεται να εξαιρούνται από το τυπικό δικαίωμα υπαναχώρησης όπου το επιτρέπει ο νόμος. Κάθε εξαίρεση πρέπει να γνωστοποιείται καθαρά πριν από την αγορά και να έχει ελεγχθεί νομικά.",
  "Private operations": "Ιδιωτική διαχείριση", "Catalogue, reservations, orders and payment attention in one protected workspace.": "Κατάλογος, κρατήσεις, παραγγελίες και πληρωμές σε έναν προστατευμένο χώρο.", "Administration": "Διαχείριση", "Welcomeback.": "Καλώς επιστρέψατε.", "Welcome": "Καλώς", "back.": "επιστρέψατε.",
  "Username": "Όνομα χρήστη", "Password": "Κωδικός πρόσβασης", "Enter the studio": "Είσοδος στο ατελιέ", "Admin sign in": "Σύνδεση διαχειριστή",
  "Dashboard": "Πίνακας", "Orders": "Παραγγελίες", "Payments": "Πληρωμές", "Products": "Προϊόντα", "Add product": "Προσθήκη προϊόντος", "Images": "Εικόνες", "Order manager": "Διαχείριση παραγγελιών", "Payment checks": "Έλεγχοι πληρωμών", "Email manager": "Διαχείριση email", "System status": "Κατάσταση συστήματος", "Stock": "Απόθεμα",
  "Store pulse": "Εικόνα καταστήματος", "Overview": "Επισκόπηση", "Latest activity": "Πρόσφατη δραστηριότητα", "Recent orders": "Πρόσφατες παραγγελίες", "View all": "Προβολή όλων", "Verified revenue": "Επιβεβαιωμένα έσοδα", "Reserved": "Δεσμευμένα", "Low stock": "Χαμηλό απόθεμα",
  "Live operational data from MySQL. Revenue counts only orders whose payment status is verified as paid.": "Ζωντανά λειτουργικά δεδομένα από τη MySQL. Στα έσοδα υπολογίζονται μόνο παραγγελίες με επιβεβαιωμένη πληρωμή.", "Units held for pending checkouts": "Μονάδες δεσμευμένες για εκκρεμή ταμεία", "awaiting payment": "αναμένουν πληρωμή", "available units across low-stock variants": "διαθέσιμες μονάδες σε παραλλαγές χαμηλού αποθέματος",
  "Commerce": "Εμπόριο", "Search": "Αναζήτηση", "Customer": "Πελάτης", "Payment": "Πληρωμή", "Fulfilment": "Εκτέλεση", "Created": "Δημιουργήθηκε", "Previous": "Προηγούμενη", "Next": "Επόμενη",
  "Catalogue operations": "Διαχείριση καταλόγου", "Options": "Επιλογές", "Designs": "Σχέδια", "Colours": "Χρώματα", "Sizes": "Μεγέθη", "Variants": "Παραλλαγές", "Save": "Αποθήκευση", "Active": "Ενεργό", "Name": "Όνομα", "Story": "Ιστορία", "Material": "Υλικό", "Sort": "Ταξινόμηση", "Label": "Ετικέτα", "Code": "Κωδικός", "Price": "Τιμή",
  "Edit the current product family and its sellable combinations. Slugs, option codes and SKUs remain stable identifiers; order-item snapshots never change.": "Επεξεργαστείτε την τρέχουσα οικογένεια προϊόντων και τους διαθέσιμους συνδυασμούς. Τα slugs, οι κωδικοί επιλογών και τα SKU παραμένουν σταθερά αναγνωριστικά· τα στιγμιότυπα παραγγελίας δεν αλλάζουν.",
  "Add options.": "Προσθήκη επιλογών.", "Back to editor": "Επιστροφή στην επεξεργασία", "New design": "Νέο σχέδιο", "New colour": "Νέο χρώμα", "New size": "Νέο μέγεθος", "New variant": "Νέα παραλλαγή", "Create design": "Δημιουργία σχεδίου", "Create colour": "Δημιουργία χρώματος", "Create size": "Δημιουργία μεγέθους", "Create variant": "Δημιουργία παραλλαγής", "Sort order": "Σειρά ταξινόμησης", "Initial on-hand": "Αρχικό απόθεμα",
  "Media library": "Βιβλιοθήκη πολυμέσων", "Local path": "Τοπική διαδρομή", "Alternative text": "Εναλλακτικό κείμενο", "Add image": "Προσθήκη εικόνας", "All": "Όλα",
  "Catalogue media": "Πολυμέσα καταλόγου", "Image library.": "Βιβλιοθήκη εικόνων.", "Only files already placed inside": "Μόνο αρχεία που έχουν ήδη τοποθετηθεί μέσα στο", "may be referenced. Every image needs useful alternative text and may be scoped to a design or colour.": "μπορούν να χρησιμοποιηθούν. Κάθε εικόνα χρειάζεται χρήσιμο εναλλακτικό κείμενο και μπορεί να συνδεθεί με σχέδιο ή χρώμα.",
  "Inventory control": "Έλεγχος αποθέματος", "Available": "Διαθέσιμο", "On hand": "Σε απόθεμα", "Change": "Μεταβολή", "Reason": "Αιτία", "Apply": "Εφαρμογή",
  "Available stock is on-hand minus active reservations. Adjustments lock the stock row and create immutable movement and audit records.": "Το διαθέσιμο απόθεμα είναι το φυσικό απόθεμα μείον τις ενεργές δεσμεύσεις. Οι προσαρμογές κλειδώνουν την εγγραφή και δημιουργούν αμετάβλητο ιστορικό κίνησης και ελέγχου.", "Adjustment": "Προσαρμογή", "Immutable history": "Αμετάβλητο ιστορικό", "Recent movements": "Πρόσφατες κινήσεις", "Time": "Χρόνος", "Note": "Σημείωση", "Delta": "Μεταβολή",
  "Order operations": "Διαχείριση παραγγελιών", "Workflow.": "Ροή εργασίας.", "Operational note": "Λειτουργική σημείωση", "Amount": "Ποσό", "Refund": "Επιστροφή χρημάτων", "Start processing": "Έναρξη επεξεργασίας", "Mark shipped": "Σήμανση ως απεσταλμένη", "Mark delivered": "Σήμανση ως παραδομένη", "Mark returned": "Σήμανση ως επιστραφείσα",
  "Fulfilment advances one permitted state at a time. Refund requests reserve an amount for later provider execution and are not presented as completed refunds.": "Η εκτέλεση προχωρά μία επιτρεπόμενη κατάσταση κάθε φορά. Τα αιτήματα επιστροφής δεσμεύουν ποσό για μελλοντική εκτέλεση από τον πάροχο και δεν εμφανίζονται ως ολοκληρωμένα.", "Request provider refund": "Αίτημα επιστροφής στον πάροχο", "This records a pending request only.": "Αυτό καταγράφει μόνο ένα εκκρεμές αίτημα.", "Requested": "Ζητήθηκε",
  "Financial controls": "Οικονομικοί έλεγχοι", "Reconciliation.": "Συμφωνία.", "Investigation note": "Σημείωση διερεύνησης", "Record review": "Καταγραφή ελέγχου", "Matched": "Συμφωνεί",
  "A review acknowledges investigation; it does not alter the payment or order ledger. Corrections must come from a verified provider event or a separately audited operational workflow.": "Ο έλεγχος καταγράφει τη διερεύνηση· δεν αλλάζει το αρχείο πληρωμών ή παραγγελιών. Οι διορθώσεις πρέπει να προέρχονται από επιβεβαιωμένο συμβάν παρόχου ή ξεχωριστά ελεγμένη λειτουργική διαδικασία.", "No reconciliation discrepancies are currently detected.": "Δεν εντοπίζονται αποκλίσεις συμφωνίας.",
  "Customer communication": "Επικοινωνία πελατών", "Email ledger.": "Αρχείο email.", "Deliver queue": "Αποστολή ουράς", "Template": "Πρότυπο", "Recipient": "Παραλήπτης", "Status": "Κατάσταση", "Attempts": "Προσπάθειες", "Result": "Αποτέλεσμα", "Retry": "Επανάληψη",
  "Every transactional message has a unique delivery key. Failed attempts require an explicit retry and stop after five attempts.": "Κάθε μήνυμα συναλλαγής έχει μοναδικό κλειδί παράδοσης. Οι αποτυχημένες προσπάθειες απαιτούν ρητή επανάληψη και σταματούν μετά από πέντε προσπάθειες.", "SMTP configured": "Το SMTP έχει ρυθμιστεί", "SMTP credentials not configured — messages remain queued": "Τα διαπιστευτήρια SMTP δεν έχουν ρυθμιστεί — τα μηνύματα παραμένουν στην ουρά",
  "Deployment diagnostics": "Διαγνωστικά εγκατάστασης", "System health.": "Υγεία συστήματος.", "Ready for traffic": "Έτοιμο για λειτουργία", "Configuration requires attention": "Η ρύθμιση χρειάζεται προσοχή", "Healthy": "Υγιές", "Attention": "Προσοχή",
  "Provider events are compared with the order ledger. Raw webhook payloads and payment credentials are never shown here.": "Τα συμβάντα παρόχου συγκρίνονται με το αρχείο παραγγελιών. Τα ακατέργαστα δεδομένα webhook και τα διαπιστευτήρια πληρωμών δεν εμφανίζονται ποτέ εδώ.", "Provider": "Πάροχος", "Order ledger": "Αρχείο παραγγελίας", "Events": "Συμβάντα", "Reconciliation": "Συμφωνία", "Updated": "Ενημερώθηκε",
  "Items": "Προϊόντα", "Selection": "Επιλογή", "Unit": "Μονάδα", "Qty": "Ποσ.", "Expires": "Λήγει", "Released": "Αποδεσμεύτηκε", "Awaiting provider reference": "Αναμονή αναφοράς παρόχου", "No payment attempt has been created.": "Δεν έχει δημιουργηθεί προσπάθεια πληρωμής.",
  "Menu": "Μενού", "Close": "Κλείσιμο", "Sign out": "Αποσύνδεση", "Operations": "Λειτουργίες", "Email": "Email", "Health": "Υγεία", "Inventory": "Απόθεμα",
  "Legal / Privacy": "Νομικά / Απόρρητο", "Legal / Cookies": "Νομικά / Cookies", "Legal / Store": "Νομικά / Κατάστημα", "Legal / Aftercare": "Νομικά / Μετά την αγορά", "Policy index /": "Ευρετήριο πολιτικής /", "Policy index / 07": "Ευρετήριο πολιτικής / 07", "Policy index / 06": "Ευρετήριο πολιτικής / 06",
  "How Ruseè handles personal information across enquiries, ordering, payment and fulfilment.": "Πώς η Ruseè διαχειρίζεται προσωπικές πληροφορίες στα ερωτήματα, τις παραγγελίες, τις πληρωμές και την εκτέλεση.",
  "A clear account of essential browser storage and any optional technologies used by the Ruseè storefront.": "Μια σαφής περιγραφή της απαραίτητης αποθήκευσης και τυχόν προαιρετικών τεχνολογιών του καταστήματος Ruseè.",
  "The framework for ordering, payment, delivery and use of the Ruseè storefront.": "Το πλαίσιο παραγγελίας, πληρωμής, παράδοσης και χρήσης του καταστήματος Ruseè.",
  "A clear route for returning, inspecting and refunding eligible Ruseè pieces.": "Μια σαφής διαδικασία επιστροφής, ελέγχου και επιστροφής χρημάτων για επιλέξιμα κομμάτια Ruseè.",
};

const phrases: Array<[string, string]> = [
  ["No matching orders.", "Δεν βρέθηκαν παραγγελίες."], ["No orders yet.", "Δεν υπάρχουν ακόμη παραγγελίες."], ["No payment attempts yet.", "Δεν υπάρχουν ακόμη προσπάθειες πληρωμής."], ["No transactional messages have been queued.", "Δεν υπάρχουν μηνύματα στην ουρά."],
  ["Order number or email", "Αριθμός παραγγελίας ή email"], ["What was checked, what was found, and the next action.", "Τι ελέγχθηκε, τι βρέθηκε και ποια είναι η επόμενη ενέργεια."],
  ["Payment verified", "Η πληρωμή επιβεβαιώθηκε"], ["Payment not completed", "Η πληρωμή δεν ολοκληρώθηκε"], ["Payment pending", "Η πληρωμή εκκρεμεί"], ["Thank you.", "Ευχαριστούμε."], ["Not charged.", "Δεν έγινε χρέωση."], ["Almost there.", "Σχεδόν έτοιμο."],
  ["Return home", "Επιστροφή στην αρχική"], ["Return to order status", "Επιστροφή στην κατάσταση παραγγελίας"], ["Complete the study.", "Ολοκληρώστε τη μελέτη."], ["Local sandbox", "Τοπικό δοκιμαστικό περιβάλλον"], ["Not a real charge", "Δεν είναι πραγματική χρέωση"],
  ["First name", "Όνομα"], ["Last name", "Επώνυμο"], ["Postal code", "Ταχυδρομικός κώδικας"], ["Order detail", "Λεπτομέρειες παραγγελίας"], ["Status history", "Ιστορικό κατάστασης"], ["Payment attempts", "Προσπάθειες πληρωμής"], ["Shipping address", "Διεύθυνση αποστολής"], ["Reservation", "Δέσμευση"],
  ["Current state", "Τρέχουσα κατάσταση"], ["Order total", "Σύνολο παραγγελίας"], ["Tax included", "Περιλαμβάνεται φόρος"], ["Discount", "Έκπτωση"], ["Delivery", "Παράδοση"],
  ["Shop", "Κατάστημα"], ["About", "Σχετικά"], ["Checkout", "Ταμείο"], ["Contact", "Επικοινωνία"], ["Order received", "Η παραγγελία ελήφθη"], ["Sandbox payment", "Δοκιμαστική πληρωμή"],
  ["Study", "Μελέτη"], ["Ink", "Μελάνι"], ["Clay", "Πηλός"], ["Sage", "Φασκόμηλο"],
];

function translated(value: string) {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const core = value.trim();
  if (!core) return value;
  let next = exact[core] ?? core;
  for (const [from, to] of phrases) next = next.replaceAll(from, to);
  next = next
    .replace(/\bPage\b/g, "Σελίδα").replace(/\bof\b/g, "από").replace(/\borders\b/g, "παραγγελίες")
    .replace(/\bpaid\b/g, "πληρωμένο").replace(/\bpending\b/g, "εκκρεμεί").replace(/\bfailed\b/g, "απέτυχε")
    .replace(/\bcancelled\b/g, "ακυρώθηκε").replace(/\bprocessing\b/g, "σε επεξεργασία").replace(/\bshipped\b/g, "απεστάλη").replace(/\bdelivered\b/g, "παραδόθηκε")
    .replace(/\boptional\b/gi, "προαιρετικό").replace(/\badministrator\b/g, "διαχειριστή");
  return `${leading}${next}${trailing}`;
}

function translateElement(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    if (node.parentElement?.closest("script,style,[data-no-translate]")) continue;
    const next = translated(node.data);
    if (next !== node.data) node.data = next;
  }
  const elements = root instanceof Element ? [root, ...root.querySelectorAll<HTMLElement>("[placeholder],[title],[aria-label]")] : [...root.querySelectorAll<HTMLElement>("[placeholder],[title],[aria-label]")];
  for (const element of elements) for (const attribute of ["placeholder", "title", "aria-label"]) {
    const value = element.getAttribute(attribute); if (!value) continue;
    const next = translated(value); if (next !== value) element.setAttribute(attribute, next);
  }
}

export function GreekTranslationLayer({ locale }: { locale: Locale }) {
  useEffect(() => {
    if (locale !== "el") return;
    let observer: MutationObserver | undefined;
    let secondFrame = 0;
    // App Router segments can hydrate after a parent passive effect. Waiting
    // for two painted frames prevents this compatibility layer from changing
    // streamed server text while React is still claiming its client islands.
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        translateElement(document.body);
        document.title = translated(document.title);
        observer = new MutationObserver((records) => {
          for (const record of records) for (const node of record.addedNodes) {
            if (node.nodeType === Node.TEXT_NODE) { const text = node as Text; if (text.parentElement?.closest("[data-no-translate]")) continue; const next = translated(text.data); if (next !== text.data) text.data = next; }
            else if (node instanceof Element) translateElement(node);
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      observer?.disconnect();
    };
  }, [locale]);
  return null;
}
