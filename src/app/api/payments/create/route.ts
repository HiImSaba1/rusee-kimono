import { NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentAttempt } from "@/features/payments/attempts";
import { PaymentProviderError } from "@/features/payments/provider";
import { commerceRateLimitKey, commerceRateLimitMessage, consumeCommerceRateLimit } from "@/features/commerce/rate-limit";
import { logger } from "@/lib/observability/logger";

const input = z.object({ publicId: z.string().uuid() });

export async function POST(request: Request) {
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Invalid order reference." }, { status: 400 });
  try {
    const limit = await consumeCommerceRateLimit("payment", commerceRateLimitKey(request, "payment"), 8);
    if (!limit.allowed) return NextResponse.json({ message: commerceRateLimitMessage(request), code: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    const checkout = await createPaymentAttempt(parsed.data.publicId);
    return NextResponse.json({ redirectUrl: checkout.redirectUrl, provider: checkout.provider });
  } catch (error) {
    if (!(error instanceof PaymentProviderError)) logger.error("payment.start_failed", { error });
    const message = error instanceof PaymentProviderError ? error.message : "Payment is temporarily unavailable.";
    const status = error instanceof PaymentProviderError ? (error.code === "order_not_found" ? 404 : 409) : 503;
    return NextResponse.json({ message }, { status });
  }
}
