export type FulfilmentEligibilityInput = {
  orderPaymentStatus: string;
  matchingCapturedPayments: number;
  failedPaymentEvents: number;
};

export type FulfilmentEligibility = {
  eligible: boolean;
  state: "verified" | "review" | "blocked";
  labelEl: string;
  labelEn: string;
  detailEl: string;
  detailEn: string;
};

export function fulfilmentEligibility(input: FulfilmentEligibilityInput): FulfilmentEligibility {
  if (input.orderPaymentStatus !== "paid") {
    return {
      eligible: false,
      state: "blocked",
      labelEl: "Μην αποστείλετε",
      labelEn: "Do not ship",
      detailEl: "Η παραγγελία δεν έχει επαληθευμένη πληρωμή.",
      detailEn: "The order does not have a verified payment.",
    };
  }
  if (input.matchingCapturedPayments !== 1) {
    return {
      eligible: false,
      state: "blocked",
      labelEl: "Μην αποστείλετε",
      labelEn: "Do not ship",
      detailEl: "Δεν υπάρχει ακριβώς μία captured πληρωμή με ίδιο ποσό και νόμισμα.",
      detailEn: "There is not exactly one captured payment matching the order amount and currency.",
    };
  }
  if (input.failedPaymentEvents > 0) {
    return {
      eligible: true,
      state: "review",
      labelEl: "Πληρωμένη · ελέγξτε τα events",
      labelEn: "Paid · review events",
      detailEl: "Η πληρωμή συμφωνεί, αλλά υπάρχει αποτυχημένο provider event στο ιστορικό.",
      detailEn: "The payment matches, but a failed provider event remains in its history.",
    };
  }
  return {
    eligible: true,
    state: "verified",
    labelEl: "Επαληθευμένη · έτοιμη για εκτέλεση",
    labelEn: "Verified · ready to fulfil",
    detailEl: "Η κατάσταση παραγγελίας συμφωνεί με captured πληρωμή ίδιου ποσού και νομίσματος.",
    detailEn: "The order state matches one captured payment for the same amount and currency.",
  };
}

export const fulfilmentTransitions: Record<string, { fulfilmentStatus: string; orderStatus: string; labelEl: string; labelEn: string } | undefined> = {
  unfulfilled: { fulfilmentStatus: "processing", orderStatus: "processing", labelEl: "Έναρξη προετοιμασίας", labelEn: "Start processing" },
  processing: { fulfilmentStatus: "shipped", orderStatus: "shipped", labelEl: "Σήμανση ως απεσταλμένη", labelEn: "Mark shipped" },
  shipped: { fulfilmentStatus: "delivered", orderStatus: "completed", labelEl: "Σήμανση ως παραδομένη", labelEn: "Mark delivered" },
};

export const returnTransitionOptions: Record<string, Array<"approved" | "rejected" | "received" | "closed">> = {
  pending: ["approved", "rejected"],
  approved: ["received", "closed"],
  rejected: ["closed"],
  received: ["closed"],
  closed: [],
};

export function safeStatusLabel(value: string) {
  return value.replaceAll("_", " ");
}
