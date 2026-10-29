import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { databasePool } from "@/lib/db/connection";
import { getPaymentProvider } from "@/features/payments/registry";
import { signFakePayload } from "@/features/payments/fake-provider";
import { processVerifiedPaymentEvent } from "@/features/payments/process-event";

const input = z.object({ paymentId: z.string().startsWith("fake_").max(190), outcome: z.enum(["captured", "failed", "cancelled"]) });

export async function POST(request: Request) {
  if (process.env.ENABLE_FAKE_PAYMENTS !== "true") return NextResponse.json({ message: "Fake payments are disabled." }, { status: 404 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid simulation request." }, { status: 400 });
  const [rows] = await databasePool.execute(
    `SELECT p.amount_minor, p.currency, o.public_id FROM payments p
     INNER JOIN orders o ON o.id = p.order_id
     WHERE p.provider = 'fake' AND p.provider_payment_id = ? LIMIT 1`,
    [parsed.data.paymentId],
  );
  const payment = (rows as Array<{ amount_minor: number; currency: string; public_id: string }>)[0];
  if (!payment) return NextResponse.json({ message: "Fake payment was not found." }, { status: 404 });
  const type = `payment.${parsed.data.outcome}`;
  const body = JSON.stringify({ eventId: `evt_${randomUUID()}`, paymentId: parsed.data.paymentId, type, status: parsed.data.outcome, amountMinor: payment.amount_minor, currency: payment.currency, occurredAt: new Date().toISOString() });
  const providerRequest = new Request("http://internal/api/payments/fake/webhook", { method: "POST", headers: { "content-type": "application/json", "x-rusee-fake-signature": signFakePayload(body) }, body });
  const event = await getPaymentProvider("fake").verifyWebhook(providerRequest);
  const result = await processVerifiedPaymentEvent(event);
  return NextResponse.json({ ...result, publicId: payment.public_id });
}
