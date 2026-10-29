import { z } from "zod";

export const returnReason = z.enum(["size_fit", "changed_mind", "damaged", "incorrect_item", "other"]);
export const returnStatus = z.enum(["pending", "approved", "rejected", "received", "closed"]);
export const returnRequestInput = z.object({ email: z.string().trim().email().max(254), reason: returnReason, customerNote: z.string().trim().min(10).max(500) });

const allowed: Record<z.infer<typeof returnStatus>, z.infer<typeof returnStatus>[]> = {
  pending: ["approved", "rejected"], approved: ["received", "closed"], rejected: ["closed"], received: ["closed"], closed: [],
};
export function assertReturnTransition(from: z.infer<typeof returnStatus>, to: z.infer<typeof returnStatus>) {
  if (!allowed[from].includes(to)) throw new Error("Invalid return-request transition.");
  return { from, to };
}
