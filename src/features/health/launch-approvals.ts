export type LaunchApproval = {
  key: string;
  approved: boolean;
  labelEl: string;
  labelEn: string;
  ownerEl: string;
  ownerEn: string;
  waitingEl: string;
  waitingEn: string;
  implementationEl: string;
  implementationEn: string;
};

const definitions = [
  ["LAUNCH_HOSTING_APPROVED", "Papaki Node.js, MySQL και HTTPS", "Papaki Node.js, MySQL and HTTPS", "Papaki / τεχνικός διαχειριστής", "Papaki / technical operator", "Ενεργό Node.js app, domain και πρόσβαση Plesk.", "Active Node.js app, domain and Plesk access.", "Έλεγχος runtime, environment, HTTPS, health endpoint και production start.", "Verify runtime, environment, HTTPS, health endpoint and production start."],
  ["LAUNCH_EMAIL_DNS_APPROVED", "SMTP, SPF, DKIM και DMARC", "SMTP, SPF, DKIM and DMARC", "Ιδιοκτήτης domain", "Domain owner", "Τελικό mailbox αποστολής και παραλήπτης ειδοποιήσεων.", "Final sender mailbox and notification recipient.", "Σύνδεση SMTP, έλεγχος SPF/DKIM/DMARC και δοκιμή συναλλακτικών email.", "Connect SMTP, verify SPF/DKIM/DMARC and test transactional email."],
  ["LAUNCH_TAX_SHIPPING_APPROVED", "ΦΠΑ, στρογγυλοποίηση και χρεώσεις αποστολής", "VAT, rounding and shipping charges", "Επιχείρηση / λογιστής", "Business / accountant", "Τελικός ΦΠΑ, χώρες πώλησης, δωρεάν όριο και χρεώσεις ανά ζώνη.", "Final VAT, selling countries, free-shipping threshold and zone charges.", "Εφαρμογή εγκεκριμένων κανόνων στον server και έλεγχος συνόλων checkout.", "Implement approved server rules and verify checkout totals."],
  ["LAUNCH_LEGAL_APPROVED", "Όροι, ιδιωτικότητα, επιστροφές και cookies", "Terms, privacy, returns and cookies", "Επιχείρηση / νομικός", "Business / legal adviser", "Στοιχεία επιχείρησης, διεύθυνση, ΑΦΜ, επιστροφές, δεδομένα και εγκεκριμένα κείμενα.", "Business identity, address, VAT number, returns, data handling and approved wording.", "Αντικατάσταση όλων των ADD_YOUR placeholders, δίγλωσση προεπισκόπηση και δημοσίευση.", "Replace every ADD_YOUR placeholder, review both languages and publish."],
  ["LAUNCH_PRODUCT_DATA_APPROVED", "Σύνθεση, μετρήσεις, φροντίδα και προέλευση", "Composition, measurements, care and provenance", "Ruseè / παραγωγή", "Ruseè / production", "Επιβεβαιωμένα στοιχεία ανά σχέδιο από δείγμα, ετικέτα ή προμηθευτή.", "Confirmed facts per design from the sample, label or supplier.", "Καταχώριση στοιχείων και κλείσιμο εκκρεμών εγκρίσεων καταλόγου.", "Enter facts and close pending catalogue approvals."],
  ["LAUNCH_FULFILMENT_APPROVED", "Courier, tracking και διαδικασία εκπλήρωσης", "Courier, tracking and fulfilment workflow", "Ruseè / courier", "Ruseè / courier", "Courier, περιοχές, χρόνοι, κόστος, επιστροφές και στοιχεία αποστολέα.", "Courier, regions, timing, cost, returns and sender details.", "Ρύθμιση αποστολής και tracking και δοκιμή πλήρους ροής.", "Configure shipping and tracking, then test the full workflow."],
  ["LAUNCH_PAYMENT_PROVIDER_APPROVED", "Συμβεβλημένος πάροχος και δοκιμή επιστροφής", "Contracted provider and refund test", "Ruseè / πάροχος πληρωμών", "Ruseè / payment provider", "Σύμβαση, επίσημα sandbox στοιχεία και τεχνική τεκμηρίωση.", "Agreement, official sandbox credentials and technical documentation.", "Hosted checkout, webhook verification, reconciliation και low-value payment/refund test.", "Hosted checkout, webhook verification, reconciliation and a low-value payment/refund test."],
] as const;

export function approvalFlag(value: string | undefined) {
  return value?.trim().toLowerCase() === "true";
}

type ApprovalEnvironment = Readonly<Record<string, string | undefined>>;

export function launchApprovals(environment: ApprovalEnvironment = process.env): LaunchApproval[] {
  return definitions.map(([key, labelEl, labelEn, ownerEl, ownerEn, waitingEl, waitingEn, implementationEl, implementationEn]) => ({
    key,
    approved: approvalFlag(environment[key]),
    labelEl,
    labelEn,
    ownerEl,
    ownerEn,
    waitingEl,
    waitingEn,
    implementationEl,
    implementationEn,
  }));
}

export function launchApprovalsComplete(environment: ApprovalEnvironment = process.env) {
  return launchApprovals(environment).every((approval) => approval.approved);
}
