import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { databasePool } from "@/lib/db/connection";
import { runAutomationWorker } from "@/features/automation/queue";

const marker = `test:automation:${randomUUID()}:`;

async function insertJob(suffix: string, values = "'queued',NOW(),0,NULL,NULL") {
  await databasePool.execute(
    `INSERT INTO automation_jobs (public_id,deduplication_key,kind,status,run_at,attempt_count,locked_at,locked_by,max_attempts)
     VALUES (?,?,'notification_sync',${values},5)`,
    [randomUUID(), `${marker}${suffix}`],
  );
}

beforeAll(async () => {
  await Promise.all([insertJob("parallel-1"), insertJob("parallel-2"), insertJob("parallel-3"), insertJob("parallel-4")]);
});

afterAll(async () => {
  await databasePool.execute("DELETE FROM automation_jobs WHERE deduplication_key LIKE ?", [`${marker}%`]);
  await databasePool.end();
});

describe("durable automation queue", () => {
  it("allows concurrent workers to execute each due job exactly once", async () => {
    const calls: string[] = [];
    const executor = async () => { calls.push(randomUUID()); };
    await Promise.all([
      runAutomationWorker(10, "test-worker-a", { deduplicationPrefix: marker, executor }),
      runAutomationWorker(10, "test-worker-b", { deduplicationPrefix: marker, executor }),
    ]);
    const [rows] = await databasePool.execute("SELECT status,attempt_count FROM automation_jobs WHERE deduplication_key LIKE ? AND deduplication_key LIKE '%parallel-%'", [`${marker}%`]);
    expect(rows).toHaveLength(4);
    expect((rows as Array<{ status:string; attempt_count:number }>).every(row => row.status === "completed" && row.attempt_count === 1)).toBe(true);
    expect(calls).toHaveLength(4);
  });

  it("recovers a stale lock before one safe retry", async () => {
    await insertJob("stale", "'processing',NOW(),1,DATE_SUB(NOW(),INTERVAL 20 MINUTE),'stopped-worker'");
    const result = await runAutomationWorker(5, "recovery-worker", { deduplicationPrefix: `${marker}stale`, executor: async () => undefined });
    expect(result.completed).toBe(1);
    const [rows] = await databasePool.execute("SELECT status,attempt_count,locked_at,locked_by FROM automation_jobs WHERE deduplication_key=?", [`${marker}stale`]);
    expect((rows as Array<Record<string, unknown>>)[0]).toMatchObject({ status: "completed", attempt_count: 2, locked_at: null, locked_by: null });
  });

  it("queues a bounded retry and stores only a sanitized error", async () => {
    await insertJob("failure");
    const result = await runAutomationWorker(5, "failure-worker", {
      deduplicationPrefix: `${marker}failure`,
      executor: async () => { throw new Error("password=hunter2 token=private mysql://user:pass@localhost/shop failed"); },
    });
    expect(result.retried).toBe(1);
    const [rows] = await databasePool.execute("SELECT status,attempt_count,last_error,run_at>NOW() AS is_delayed FROM automation_jobs WHERE deduplication_key=?", [`${marker}failure`]);
    const row = (rows as Array<{ status:string; attempt_count:number; last_error:string; is_delayed:number }>)[0];
    expect(row).toMatchObject({ status: "retry_wait", attempt_count: 1 });
    expect(Boolean(row.is_delayed)).toBe(true);
    expect(row.last_error).not.toMatch(/hunter2|private|user:pass/);
    expect(row.last_error).toContain("[redacted]");
  });
});
