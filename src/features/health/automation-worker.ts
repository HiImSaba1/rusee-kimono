import "server-only";
import { databasePool } from "@/lib/db/connection";
import { AUTOMATION_STALE_LOCK_MINUTES } from "@/features/automation/policy";

export const AUTOMATION_WORKER_FRESH_MINUTES = 15;

export type AutomationWorkerHealth = {
  state: "healthy" | "delayed" | "attention" | "stale" | "never_run";
  lastCompletedAt: Date | null;
  oldestDueAt: Date | null;
  dueJobs: number;
  failedJobs: number;
  staleLocks: number;
  lastCompletedAgeMinutes: number | null;
  oldestDueAgeMinutes: number | null;
};

export function classifyAutomationWorkerHealth(input: Omit<AutomationWorkerHealth, "state">): AutomationWorkerHealth {
  let state: AutomationWorkerHealth["state"] = "healthy";
  if (input.failedJobs > 0 || input.staleLocks > 0) state = "attention";
  else if ((input.oldestDueAgeMinutes ?? 0) > AUTOMATION_WORKER_FRESH_MINUTES) state = "delayed";
  else if (!input.lastCompletedAt) state = "never_run";
  else if ((input.lastCompletedAgeMinutes ?? 0) > AUTOMATION_WORKER_FRESH_MINUTES) state = "stale";
  return { ...input, state };
}

export async function getAutomationWorkerHealth(options: { deduplicationPrefix?: string } = {}) {
  const prefix = options.deduplicationPrefix?.slice(0, 120);
  const scopeSql = prefix ? "WHERE deduplication_key LIKE ?" : "";
  const values = prefix ? [`${prefix}%`] : [];
  const [rows] = await databasePool.execute(
    `SELECT
       MAX(CASE WHEN status='completed' THEN completed_at END) AS last_completed_at,
       MIN(CASE WHEN status IN ('queued','retry_wait') AND run_at<=NOW() THEN run_at END) AS oldest_due_at,
       TIMESTAMPDIFF(MINUTE,MAX(CASE WHEN status='completed' THEN completed_at END),NOW()) AS last_completed_age_minutes,
       TIMESTAMPDIFF(MINUTE,MIN(CASE WHEN status IN ('queued','retry_wait') AND run_at<=NOW() THEN run_at END),NOW()) AS oldest_due_age_minutes,
       COALESCE(SUM(status IN ('queued','retry_wait') AND run_at<=NOW()),0) AS due_jobs,
       COALESCE(SUM(status='failed'),0) AS failed_jobs,
       COALESCE(SUM(status='processing' AND locked_at<DATE_SUB(NOW(),INTERVAL ${AUTOMATION_STALE_LOCK_MINUTES} MINUTE)),0) AS stale_locks
     FROM automation_jobs ${scopeSql}`,
    values,
  );
  const row = (rows as Array<{
    last_completed_at: Date | null;
    oldest_due_at: Date | null;
    last_completed_age_minutes: number | string | null;
    oldest_due_age_minutes: number | string | null;
    due_jobs: number | string;
    failed_jobs: number | string;
    stale_locks: number | string;
  }>)[0];
  return classifyAutomationWorkerHealth({
    lastCompletedAt: row?.last_completed_at ?? null,
    oldestDueAt: row?.oldest_due_at ?? null,
    dueJobs: Number(row?.due_jobs ?? 0),
    failedJobs: Number(row?.failed_jobs ?? 0),
    staleLocks: Number(row?.stale_locks ?? 0),
    lastCompletedAgeMinutes: row?.last_completed_age_minutes == null ? null : Number(row.last_completed_age_minutes),
    oldestDueAgeMinutes: row?.oldest_due_age_minutes == null ? null : Number(row.oldest_due_age_minutes),
  });
}
