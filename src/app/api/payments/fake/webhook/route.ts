import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/features/payments/registry";
import { PaymentProviderError } from "@/features/payments/provider";
import { processVerifiedPaymentEvent } from "@/features/payments/process-event";
import { deliverQueuedEmails } from "@/features/email/delivery";
import { logger } from "@/lib/observability/logger";

export async function POST(request: Request) {
  try {
    const event = await getPaymentProvider("fake").verifyWebhook(request);
    const result = await processVerifiedPaymentEvent(event);
    if (result.outcome === "processed") await deliverQueuedEmails(5);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof PaymentProviderError) return NextResponse.json({ message: "Webhook rejected.", code: error.code }, { status: 401 });
    logger.error("payment.webhook_failed", { provider: "fake", error });
    return NextResponse.json({ message: "Webhook processing failed." }, { status: 500 });
  }
}
