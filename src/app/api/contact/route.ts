import { NextResponse } from "next/server";
import { contactRateLimitKey, persistContactEnquiry } from "@/features/contact/service";
import { validateContactEnquiry } from "@/features/contact/schema";
import { deliverQueuedEmails } from "@/features/email/delivery";
import { logger } from "@/lib/observability/logger";

const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return NextResponse.json({ code: "forbidden" }, { status: 403 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ code: "invalid" }, { status: 413 });
  }

  const body = await request.text().catch(() => "");
  if (!body || Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ code: "invalid" }, { status: body ? 413 : 400 });
  }

  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return NextResponse.json({ code: "invalid" }, { status: 400 });
  }

  const parsed = validateContactEnquiry(value);
  if (!parsed.success) {
    const quietSpamResponse = parsed.code === "spam";
    return NextResponse.json(
      { code: quietSpamResponse ? "accepted" : parsed.code },
      { status: quietSpamResponse ? 202 : 400 },
    );
  }

  try {
    const result = await persistContactEnquiry(parsed.data, contactRateLimitKey(request));
    if (result.outcome === "rate_limited") {
      return NextResponse.json(
        { code: "rate_limited" },
        { status: 429, headers: { "Retry-After": "900" } },
      );
    }
    if (result.outcome === "created") {
      try {
        await deliverQueuedEmails(5);
      } catch (error) {
        logger.error("contact.notification_dispatch_failed", { error, publicId: result.publicId });
      }
    }
    return NextResponse.json(
      { code: "accepted", publicId: result.publicId },
      { status: result.outcome === "created" ? 201 : 200 },
    );
  } catch (error) {
    logger.error("contact.persistence_failed", { error });
    return NextResponse.json({ code: "unavailable" }, { status: 503 });
  }
}
