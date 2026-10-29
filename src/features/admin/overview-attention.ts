export function attentionState(count: number, kind: "operational" | "external" = "operational") {
  if (count <= 0) return { labelEl: "Καθαρό", labelEn: "Clear", tone: "clear" as const };
  return kind === "external"
    ? { labelEl: "Εξωτερική εκκρεμότητα", labelEn: "External blocker", tone: "external" as const }
    : { labelEl: "Χρειάζεται ενέργεια", labelEn: "Action needed", tone: "attention" as const };
}
