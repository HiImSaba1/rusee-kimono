import "server-only";
import { z } from "zod";
import { databasePool } from "@/lib/db/connection";

export const staffRole = z.enum(["manager", "fulfilment", "viewer"]);
export type StaffRole = z.infer<typeof staffRole>;

export const staffRoleLabels: Record<StaffRole | "owner", { el: string; en: string; description: string }> = {
  owner: { el: "Ιδιοκτήτης", en: "Owner", description: "Πλήρης πρόσβαση και διαχείριση ομάδας." },
  manager: { el: "Διαχειριστής", en: "Manager", description: "Κατάλογος, απόθεμα, παραγγελίες και περιεχόμενο." },
  fulfilment: { el: "Εκτέλεση", en: "Fulfilment", description: "Ροή πληρωμένων παραγγελιών και αποστολών." },
  viewer: { el: "Προβολή", en: "Viewer", description: "Ανάγνωση λειτουργικών δεδομένων χωρίς αλλαγές." },
};

export const staffUsername = z.string().trim().min(3).max(100).regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores only.").refine((value) => !value.startsWith("__rusee_"), "This username prefix is reserved.");
export const staffPassword = z.string().min(14).max(128)
  .refine((value) => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^a-zA-Z0-9]/.test(value), "Use upper/lowercase letters, a number and a symbol.");

export type AdminTeamMember = { id: number; username: string; email: string | null; role: "owner" | StaffRole; active: number | boolean; last_login_at: Date | null; created_at: Date };

export async function listAdminTeam() {
  const [rows] = await databasePool.execute("SELECT id,username,email,role,active,last_login_at,created_at FROM admin_users ORDER BY FIELD(role,'owner','manager','fulfilment','viewer'), username");
  return rows as AdminTeamMember[];
}
