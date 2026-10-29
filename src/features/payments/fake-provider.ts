import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { PaymentProviderError, type CheckoutOrder, type PaymentProvider, type ProviderPaymentStatus, type VerifiedProviderEvent } from "./provider";

const fakeEvent = z.object({
  eventId: z.string().min(8).max(190),
  paymentId: z.string().startsWith("fake_").max(190),
  type: z.enum(["payment.pending", "payment.captured", "payment.failed", "payment.cancelled"]),
  status: z.enum(["pending", "captured", "failed", "cancelled"]),
  amountMinor: z.number().int().positive(),
  currency: z.literal("EUR"),
  occurredAt: z.string().datetime(),
});

function fakeSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new PaymentProviderError("Fake provider secret is unavailable.", "fake_not_configured");
  return secret;
}

export function signFakePayload(body: string) { return createHmac("sha256", fakeSecret()).update(body).digest("hex"); }

export class FakePaymentProvider implements PaymentProvider {
  readonly name = "fake" as const;

  async createCheckout(order: CheckoutOrder) {
    const providerPaymentId = `fake_${order.publicId}`;
    const base = process.env.APP_URL ?? "http://localhost:3000";
    return { provider: this.name, providerPaymentId, redirectUrl: `${base}/payment/fake/${providerPaymentId}`, expiresAt: new Date(Date.now() + 30 * 60 * 1000) };
  }

  async verifyWebhook(request: Request): Promise<VerifiedProviderEvent> {
    const body = await request.text();
    const supplied = request.headers.get("x-rusee-fake-signature") ?? "";
    const expected = signFakePayload(body);
    const suppliedBuffer = Buffer.from(supplied, "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) throw new PaymentProviderError("Webhook signature was rejected.", "invalid_signature");
    let json: unknown;
    try { json = JSON.parse(body); } catch { throw new PaymentProviderError("Webhook payload was rejected.", "invalid_payload"); }
    const parsed = fakeEvent.safeParse(json);
    if (!parsed.success) throw new PaymentProviderError("Webhook payload was rejected.", "invalid_payload");
    return { provider: this.name, providerEventId: parsed.data.eventId, providerPaymentId: parsed.data.paymentId, type: parsed.data.type, status: parsed.data.status, amountMinor: parsed.data.amountMinor, currency: parsed.data.currency, occurredAt: new Date(parsed.data.occurredAt), payloadHash: createHash("sha256").update(body).digest("hex"), sanitizedPayload: { type: parsed.data.type, status: parsed.data.status } };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<ProviderPaymentStatus> { void providerPaymentId; return "pending"; }

  async refund(providerPaymentId: string, amountMinor: number): Promise<{ providerRefundId: string; status: "pending" | "succeeded" }> {
    void providerPaymentId; void amountMinor;
    throw new PaymentProviderError("Fake refunds are not implemented yet.", "unsupported_operation");
  }
}
