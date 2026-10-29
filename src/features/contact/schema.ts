import { z } from "zod";

export const contactSubjects = ["order_question", "fit_sizing", "press", "stockist", "collaboration"] as const;

const collapseWhitespace = (value: string) => value.trim().replace(/\s+/g, " ");

export const contactEnquirySchema = z.object({
  submissionId: z.string().uuid(),
  name: z.string().transform(collapseWhitespace).pipe(z.string().min(2).max(140)),
  email: z.string().trim().toLowerCase().pipe(z.string().email().max(254)),
  subject: z.enum(contactSubjects),
  orderNumber: z.string().transform(collapseWhitespace).pipe(z.string().max(40)).optional().default(""),
  message: z.string().trim().min(10).max(4_000),
  locale: z.enum(["el", "en"]),
  website: z.string().max(0),
  startedAt: z.number().int().positive(),
});

export type ContactEnquiryInput = z.infer<typeof contactEnquirySchema>;

export type ContactValidationResult =
  | { success: true; data: ContactEnquiryInput }
  | { success: false; code: "invalid" | "too_fast" | "expired" | "spam" };

export function validateContactEnquiry(value: unknown, now = Date.now()): ContactValidationResult {
  const parsed = contactEnquirySchema.safeParse(value);
  if (!parsed.success) {
    const website = typeof value === "object" && value !== null && "website" in value
      ? String((value as { website?: unknown }).website ?? "")
      : "";
    return { success: false, code: website ? "spam" : "invalid" };
  }

  const elapsed = now - parsed.data.startedAt;
  if (elapsed < 800) return { success: false, code: "too_fast" };
  if (elapsed > 24 * 60 * 60 * 1_000) return { success: false, code: "expired" };
  return { success: true, data: parsed.data };
}
