"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminRole } from "@/features/admin-auth/session";
import { informationPageSlug, localizedSections, resolveInformationPublication, type InformationPublicationIntent } from "@/features/content/information-pages";
import { databasePool } from "@/lib/db/connection";

const short = (max: number) => z.string().trim().min(2).max(max);
const baseInput = z.object({
  slug: informationPageSlug,
  intent: z.enum(["save_draft", "publish", "withdraw"]),
  eyebrowEl: short(160), eyebrowEn: short(160), titleEl: short(180), titleEn: short(180),
  introEl: short(2000), introEn: short(2000),
});

export async function updateInformationPage(formData: FormData) {
  const admin = await requireAdminRole(["owner", "manager"]);
  const base = baseInput.parse(Object.fromEntries(formData));
  const sections = { el: [] as Array<{ heading: string; content: string }>, en: [] as Array<{ heading: string; content: string }> };
  for (let index = 0; index < 12; index++) {
    const values = ["headingEl", "contentEl", "headingEn", "contentEn"].map((key) => String(formData.get(`${key}${index}`) ?? "").trim());
    if (values.every((value) => !value)) continue;
    if (values.some((value) => !value)) throw new Error(`Section ${index + 1} must be complete in Greek and English.`);
    sections.el.push({ heading: values[0], content: values[1] });
    sections.en.push({ heading: values[2], content: values[3] });
  }
  const parsedSections = localizedSections.parse(sections);
  const confirmation = base.intent === "publish" ? formData.get("publishConfirmation") === "confirmed" : formData.get("withdrawConfirmation") === "confirmed";
  const connection = await databasePool.getConnection();
  let result: { status: "draft" | "published"; auditAction: string } | undefined;
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT status,updated_at FROM store_information_pages WHERE slug=? LIMIT 1 FOR UPDATE", [base.slug]);
    const before = (rows as Array<{ status: "draft" | "published"; updated_at: Date }>)[0];
    if (!before) throw new Error("Information page not found. Run Sprint08OPrepare first.");
    result = resolveInformationPublication(before.status, base.intent as InformationPublicationIntent, confirmation, parsedSections.el.length);
    await connection.execute("UPDATE store_information_pages SET status=?,eyebrow_el=?,eyebrow_en=?,title_el=?,title_en=?,intro_el=?,intro_en=?,sections=?,updated_at=NOW() WHERE slug=?", [result.status, base.eyebrowEl, base.eyebrowEn, base.titleEl, base.titleEn, base.introEl, base.introEn, JSON.stringify(parsedSections), base.slug]);
    await connection.execute("INSERT INTO admin_audit_events (admin_user_id,action,entity_type,entity_id,metadata) VALUES (?,?,'store_information_page',?,?)", [admin.id, result.auditAction, base.slug, JSON.stringify({ previousStatus: before.status, status: result.status, sectionCount: parsedSections.el.length })]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  revalidatePath(`/${base.slug}`);
  revalidatePath("/information");
  revalidatePath("/admin/information");
  revalidatePath(`/admin/information/${base.slug}`);
  revalidatePath(`/admin/information/${base.slug}/preview`);
  redirect(`/admin/information/${base.slug}?saved=${base.intent}`);
}
