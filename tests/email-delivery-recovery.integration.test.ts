import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { databasePool } from "@/lib/db/connection";
import {
  recoverStaleEmailDeliveries,
  sanitizeEmailDeliveryError,
} from "@/features/email/delivery";

const marker = randomUUID().replaceAll("-", "").slice(0, 16);
const idempotencyPrefix = `test:email-recovery:${marker}:`;
const keys = ["stale-retry", "stale-exhausted", "fresh"].map(
  (label) => `${idempotencyPrefix}${label}`,
);

beforeAll(async () => {
  await databasePool.execute(
    `INSERT INTO email_deliveries
      (template, recipient, idempotency_key, status, attempt_count, updated_at)
     VALUES
      ('payment_confirmation', ?, ?, 'sending', 2, DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
      ('payment_confirmation', ?, ?, 'sending', 5, DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
      ('payment_confirmation', ?, ?, 'sending', 1, NOW())`,
    [
      `retry-${marker}@example.invalid`, keys[0],
      `exhausted-${marker}@example.invalid`, keys[1],
      `fresh-${marker}@example.invalid`, keys[2],
    ],
  );
});

afterAll(async () => {
  await databasePool.execute(
    "DELETE FROM email_deliveries WHERE idempotency_key IN (?, ?, ?)",
    keys,
  );
  await databasePool.end();
});

describe("email delivery lease recovery", () => {
  it("requeues only stale leases with attempts remaining", async () => {
    await expect(
      recoverStaleEmailDeliveries({ idempotencyPrefix }),
    ).resolves.toEqual({ retried: 1, failed: 1 });

    const [rows] = await databasePool.execute(
      `SELECT idempotency_key, status, attempt_count, last_error
       FROM email_deliveries
       WHERE idempotency_key IN (?, ?, ?)
       ORDER BY idempotency_key`,
      keys,
    );
    const byKey = Object.fromEntries(
      (rows as Array<{
        idempotency_key: string;
        status: string;
        attempt_count: number;
        last_error: string | null;
      }>).map((row) => [row.idempotency_key, row]),
    );

    expect(byKey[keys[0]]).toMatchObject({
      status: "queued",
      attempt_count: 2,
      last_error: "Delivery lease expired; queued for safe retry",
    });
    expect(byKey[keys[1]]).toMatchObject({
      status: "failed",
      attempt_count: 5,
      last_error: "Maximum delivery attempts reached",
    });
    expect(byKey[keys[2]]).toMatchObject({
      status: "sending",
      attempt_count: 1,
      last_error: null,
    });
  });

  it("redacts secret-shaped SMTP failures", () => {
    const value = sanitizeEmailDeliveryError(
      new Error(
        "SMTP password=hunter2 authorization:Bearer-private mysql://user:pass@host/shop\nfailed",
      ),
    );

    expect(value).not.toMatch(/hunter2|Bearer-private|user:pass/);
    expect(value).toContain("[redacted]");
  });
});
