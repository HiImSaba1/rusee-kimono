import { Suspense } from "react";
import { AdminPageTransition } from "@/components/admin/AdminPageTransition";
import { AdminNav } from "@/components/admin/AdminNav";
import { requireAdmin } from "@/features/admin-auth/session";
import { listAdminNotifications } from "@/features/admin/notifications";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const notifications = await listAdminNotifications(admin);
  return <div data-admin-shell className="min-h-svh bg-paper text-ink">
    <AdminNav admin={admin} notifications={notifications} />
    {children}
    <Suspense fallback={null}><AdminPageTransition /></Suspense>
  </div>;
}
