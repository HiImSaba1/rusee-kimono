import { redirect } from "next/navigation";
import { AdminLoginVisual } from "@/components/admin/AdminLoginVisual";
import { LoginForm } from "@/components/admin/LoginForm";
import { getAdminSession } from "@/features/admin-auth/session";

export const metadata = { title: "Admin sign in" };

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin/overview");
  return (
    <section className="grid min-h-svh bg-paper lg:grid-cols-[1.15fr_.85fr]">
      <AdminLoginVisual />
      <div className="flex items-center p-[var(--gutter)] py-16"><div className="mx-auto w-full max-w-md"><p className="eyebrow">Administration</p><h2 className="mt-6 font-display text-7xl leading-[0.85] tracking-[-0.055em]">Welcome<br />back.</h2><LoginForm /></div></div>
    </section>
  );
}
