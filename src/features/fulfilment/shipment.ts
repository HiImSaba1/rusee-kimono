import { z } from "zod";

const optionalHttpsUrl = z.string().trim().max(500).transform((value) => value || null).refine((value) => {
  if (!value) return true;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}, "Tracking link must be a valid HTTPS URL.");

export const shipmentInput = z.object({
  carrierName: z.string().trim().min(2).max(120),
  trackingCode: z.string().trim().min(3).max(120).regex(/^[\p{L}\p{N}._\/-]+$/u),
  trackingUrl: optionalHttpsUrl,
});
