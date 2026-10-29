import "server-only";

import { createHmac } from "node:crypto";
import type { RowDataPacket } from "mysql2";
import { databasePool } from "@/lib/db/connection";

export type CommerceRateLimitScope = "order" | "payment";

export function commerceRateLimitKey(request: Request, scope: CommerceRateLimitScope) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientAddress = request.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
  const userAgent = request.headers.get("user-agent")?.slice(0, 240) || "unknown";
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("Commerce rate limiting is not configured.");
  return createHmac("sha256", secret).update(`rusee-commerce-rate-limit:v1:${scope}:${clientAddress}:${userAgent}`).digest("hex");
}

export async function consumeCommerceRateLimit(scope: CommerceRateLimitScope, key: string, maximum: number, windowMinutes = 10) {
  await databasePool.execute(
    `INSERT INTO commerce_rate_limits (scope, rate_limit_key, window_started_at, submission_count, blocked_count)
     VALUES (?, ?, NOW(), 1, 0)
     ON DUPLICATE KEY UPDATE
       submission_count=IF(window_started_at<=DATE_SUB(NOW(), INTERVAL ? MINUTE),1,submission_count+1),
       blocked_count=IF(window_started_at<=DATE_SUB(NOW(), INTERVAL ? MINUTE),0,blocked_count),
       window_started_at=IF(window_started_at<=DATE_SUB(NOW(), INTERVAL ? MINUTE),NOW(),window_started_at),
       updated_at=NOW()`,
    [scope, key, windowMinutes, windowMinutes, windowMinutes],
  );
  const [rows] = await databasePool.execute<(RowDataPacket & { submission_count: number })[]>("SELECT submission_count FROM commerce_rate_limits WHERE scope=? AND rate_limit_key=? LIMIT 1", [scope, key]);
  const allowed = Number(rows[0]?.submission_count ?? maximum + 1) <= maximum;
  if (!allowed) await databasePool.execute("UPDATE commerce_rate_limits SET blocked_count=blocked_count+1 WHERE scope=? AND rate_limit_key=?", [scope, key]);
  return { allowed, retryAfterSeconds: windowMinutes * 60 };
}

export function commerceRateLimitMessage(request: Request) {
  const locale = request.headers.get("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("rusee_locale="))?.split("=")[1];
  const greek = locale !== "en";
  return greek ? "Έγιναν πολλές προσπάθειες. Δοκιμάστε ξανά σε λίγα λεπτά." : "Too many attempts. Please try again in a few minutes.";
}
