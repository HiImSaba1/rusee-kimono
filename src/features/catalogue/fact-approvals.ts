export const factApprovalCategories = ["composition", "measurements_fit", "opacity", "care", "provenance", "final_media"] as const;
export type FactApprovalCategory = (typeof factApprovalCategories)[number];
export type FactApprovalStatus = "pending" | "approved";

export const factApprovalLabels: Record<FactApprovalCategory, { el: string; en: string }> = {
  composition: { el: "Ύφασμα & σύνθεση", en: "Fabric & composition" },
  measurements_fit: { el: "Μετρήσεις & εφαρμογή", en: "Measurements & fit" },
  opacity: { el: "Αδιαφάνεια", en: "Opacity" },
  care: { el: "Φροντίδα", en: "Care" },
  provenance: { el: "Προέλευση", en: "Provenance" },
  final_media: { el: "Τελικές εικόνες", en: "Final imagery" },
};

export function approvalMutation(status: FactApprovalStatus, confirmed: boolean) {
  if (!confirmed) throw new Error("Explicit confirmation is required.");
  return status === "approved"
    ? { status, action: "catalogue.fact_approved" as const }
    : { status, action: "catalogue.fact_returned_pending" as const };
}
