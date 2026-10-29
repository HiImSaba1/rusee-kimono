import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { enqueueRoutineAutomationJobs, runAutomationWorker } from "@/features/automation/queue";

export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const expected = process.env.AUTOMATION_SECRET ?? "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (expected.length < 32 || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  await enqueueRoutineAutomationJobs();
  const result = await runAutomationWorker(10);
  return NextResponse.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}
