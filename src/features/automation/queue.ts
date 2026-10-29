import "server-only";

import crypto from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { databasePool } from "@/lib/db/connection";
import { deliverQueuedEmails } from "@/features/email/delivery";
import { releaseExpiredReservations } from "@/features/inventory/release-expired-reservations";
import { AUTOMATION_MAX_ATTEMPTS, AUTOMATION_STALE_LOCK_MINUTES, automationBackoffSeconds, sanitizeAutomationError } from "./policy";

export type AutomationKind = "email_dispatch" | "notification_sync" | "reservation_release";
export type AutomationStatus = "queued" | "processing" | "retry_wait" | "completed" | "failed" | "cancelled";
type ClaimedJob = RowDataPacket & { id: number; public_id: string; kind: AutomationKind; attempt_count: number; max_attempts: number };

export async function enqueueAutomationJob(input: { kind: AutomationKind; deduplicationKey: string; runAt?: Date; payload?: Record<string, string | number | boolean | null> }) {
  await databasePool.execute(
    "INSERT IGNORE INTO automation_jobs (public_id,deduplication_key,kind,payload,run_at,max_attempts) VALUES (?,?,?,?,?,?)",
    [crypto.randomUUID(), input.deduplicationKey.slice(0, 190), input.kind, JSON.stringify(input.payload ?? {}), input.runAt ?? new Date(), AUTOMATION_MAX_ATTEMPTS],
  );
}

export async function enqueueRoutineAutomationJobs(now = new Date()) {
  const bucket = Math.floor(now.getTime() / 300000);
  await Promise.all([
    enqueueAutomationJob({ kind: "email_dispatch", deduplicationKey: `routine:${bucket}:email` }),
    enqueueAutomationJob({ kind: "notification_sync", deduplicationKey: `routine:${bucket}:notifications` }),
    enqueueAutomationJob({ kind: "reservation_release", deduplicationKey: `routine:${bucket}:reservations` }),
  ]);
}

async function synchronizeNotifications() {
  const statements = [
    "INSERT IGNORE INTO admin_notifications (deduplication_key,kind,severity,audience,entity_type,entity_id,href) SELECT CONCAT('payment:',p.id,':',p.status),'payment_attention','critical','owner_manager','payment',CAST(p.id AS CHAR),'/admin/reconciliation' FROM payments p WHERE p.status='failed'",
    "INSERT IGNORE INTO admin_notifications (deduplication_key,kind,severity,audience,entity_type,entity_id,href) SELECT CONCAT('email:',e.id,':failed'),'email_failed','critical','owner_manager','email_delivery',CAST(e.id AS CHAR),'/admin/email' FROM email_deliveries e WHERE e.status='failed'",
  ];
  for (const sql of statements) await databasePool.execute(sql);
}

async function executeJob(kind: AutomationKind) {
  if (kind === "email_dispatch") return deliverQueuedEmails(10);
  if (kind === "reservation_release") return releaseExpiredReservations();
  return synchronizeNotifications();
}

type AutomationWorkerOptions = {
  deduplicationPrefix?: string;
  executor?: (kind: AutomationKind) => Promise<unknown>;
};

export async function runAutomationWorker(limit = 10, workerId: string = crypto.randomUUID(), options: AutomationWorkerOptions = {}) {
  const safeLimit = Math.max(1, Math.min(25, Math.trunc(limit)));
  const prefix = options.deduplicationPrefix?.slice(0, 120);
  const scopeSql = prefix ? " AND deduplication_key LIKE ?" : "";
  const scopeValues = prefix ? [`${prefix}%`] : [];
  await databasePool.execute(
    `UPDATE automation_jobs SET status='retry_wait',locked_at=NULL,locked_by=NULL,last_error='Worker lock expired; queued for safe retry',run_at=NOW()
     WHERE status='processing' AND locked_at<DATE_SUB(NOW(),INTERVAL ${AUTOMATION_STALE_LOCK_MINUTES} MINUTE) AND attempt_count<max_attempts${scopeSql}`,
    scopeValues,
  );
  await databasePool.execute(
    `UPDATE automation_jobs SET status='failed',locked_at=NULL,locked_by=NULL,last_error='Maximum automatic attempts reached' WHERE status IN ('queued','retry_wait','processing') AND attempt_count>=max_attempts${scopeSql}`,
    scopeValues,
  );
  const [candidates] = await databasePool.query<(RowDataPacket & { id: number })[]>(
    `SELECT id FROM automation_jobs WHERE status IN ('queued','retry_wait') AND run_at<=NOW() AND attempt_count<max_attempts${scopeSql} ORDER BY run_at,id LIMIT ${safeLimit}`,
    scopeValues,
  );
  let completed = 0, failed = 0, retried = 0;
  for (const candidate of candidates) {
    const [claim] = await databasePool.execute<ResultSetHeader>(
      "UPDATE automation_jobs SET status='processing',locked_at=NOW(),locked_by=?,attempt_count=attempt_count+1,last_error=NULL WHERE id=? AND status IN ('queued','retry_wait') AND run_at<=NOW()",
      [workerId.slice(0, 100), candidate.id],
    );
    if (!claim.affectedRows) continue;
    const [rows] = await databasePool.query<ClaimedJob[]>("SELECT id,public_id,kind,attempt_count,max_attempts FROM automation_jobs WHERE id=? LIMIT 1", [candidate.id]);
    const job = rows[0];
    if (!job) continue;
    try {
      await (options.executor ?? executeJob)(job.kind);
      await databasePool.execute("UPDATE automation_jobs SET status='completed',completed_at=NOW(),locked_at=NULL,locked_by=NULL WHERE id=? AND status='processing' AND locked_by=?", [job.id, workerId.slice(0, 100)]);
      completed++;
    } catch (error) {
      const exhausted = job.attempt_count >= job.max_attempts;
      const nextStatus = exhausted ? "failed" : "retry_wait";
      const delay = automationBackoffSeconds(job.attempt_count);
      await databasePool.execute(
        `UPDATE automation_jobs SET status=?,last_error=?,run_at=DATE_ADD(NOW(),INTERVAL ${delay} SECOND),locked_at=NULL,locked_by=NULL WHERE id=? AND status='processing' AND locked_by=?`,
        [nextStatus, sanitizeAutomationError(error), job.id, workerId.slice(0, 100)],
      );
      if (exhausted) failed++;
      else retried++;
    }
  }
  return { claimed: completed + failed + retried, completed, failed, retried };
}

export async function listAutomationJobs() {
  const [rows] = await databasePool.query<(RowDataPacket & { id:number; public_id:string; kind:AutomationKind; status:AutomationStatus; run_at:Date; attempt_count:number; max_attempts:number; last_error:string|null; completed_at:Date|null; created_at:Date })[]>(
    "SELECT id,public_id,kind,status,run_at,attempt_count,max_attempts,last_error,completed_at,created_at FROM automation_jobs ORDER BY FIELD(status,'failed','processing','retry_wait','queued','completed','cancelled'),run_at DESC LIMIT 150",
  );
  return rows;
}
