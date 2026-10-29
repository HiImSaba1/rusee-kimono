import { NextResponse } from "next/server";
import { getAdminSession } from "@/features/admin-auth/session";
import { exportPrivacySubject, normalizeSubjectEmail, recordPrivacyExport } from "@/features/privacy/service";
import { logger } from "@/lib/observability/logger";

export async function GET(request: Request) {
  const admin = await getAdminSession();
  if (!admin || !["owner", "manager"].includes(admin.role)) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  try {
    const email = normalizeSubjectEmail(new URL(request.url).searchParams.get("email") ?? "");
    const data = await exportPrivacySubject(email);
    await recordPrivacyExport(admin.id, email);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="rusee-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    logger.error("privacy.export_failed", { error, adminId: admin.id });
    return NextResponse.json({ message: "Η εξαγωγή δεν ολοκληρώθηκε." }, { status: 400 });
  }
}
