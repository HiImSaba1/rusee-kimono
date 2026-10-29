import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { databasePool } from "@/lib/db/connection";
import { getAutomationWorkerHealth } from "@/features/health/automation-worker";

const marker = `test:worker-health:${randomUUID()}:`;

beforeAll(async () => {
  await databasePool.execute(
    `INSERT INTO automation_jobs
      (public_id,deduplication_key,kind,status,run_at,completed_at,max_attempts)
     VALUES
      (?,?,'notification_sync','completed',DATE_SUB(NOW(),INTERVAL 6 MINUTE),DATE_SUB(NOW(),INTERVAL 5 MINUTE),5),
      (?,?,'email_dispatch','queued',DATE_SUB(NOW(),INTERVAL 20 MINUTE),NULL,5),
      (?,?,'reservation_release','failed',DATE_SUB(NOW(),INTERVAL 3 MINUTE),NULL,5)`,
    [
      randomUUID(), `${marker}healthy`,
      randomUUID(), `${marker}delayed`,
      randomUUID(), `${marker}failed`,
    ],
  );
});

afterAll(async () => {
  await databasePool.execute("DELETE FROM automation_jobs WHERE deduplication_key LIKE ?", [`${marker}%`]);
  await databasePool.end();
});

describe("Plesk worker health", () => {
  it("reports recent isolated completion as healthy", async () => {
    await expect(getAutomationWorkerHealth({ deduplicationPrefix: `${marker}healthy` })).resolves.toMatchObject({
      state: "healthy",
      dueJobs: 0,
      failedJobs: 0,
      staleLocks: 0,
      lastCompletedAt: expect.any(Date),
    });
  });

  it("reports an ageing due job as delayed", async () => {
    await expect(getAutomationWorkerHealth({ deduplicationPrefix: `${marker}delayed` })).resolves.toMatchObject({
      state: "delayed",
      dueJobs: 1,
      failedJobs: 0,
      oldestDueAt: expect.any(Date),
    });
  });

  it("prioritizes failed work as needing attention", async () => {
    await expect(getAutomationWorkerHealth({ deduplicationPrefix: `${marker}failed` })).resolves.toMatchObject({
      state: "attention",
      failedJobs: 1,
    });
  });

  it("does not confuse an empty scoped history with a configured production cron", async () => {
    await expect(getAutomationWorkerHealth({ deduplicationPrefix: `${marker}missing` })).resolves.toMatchObject({
      state: "never_run",
      dueJobs: 0,
      failedJobs: 0,
    });
  });
});
