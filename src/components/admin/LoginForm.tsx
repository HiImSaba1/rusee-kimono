"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/app/admin/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, initialState);
  return (
    <form action={action} className="mt-12 grid gap-7">
      <label className="grid gap-2 text-[clamp(12px,1vw,14px)] uppercase tracking-[0.14em] text-ink/65">
        Username
        <input data-testid="admin-login-username" name="username" autoComplete="username" required className="admin-login-username border-b border-ink/30 bg-transparent py-4 leading-none normal-case tracking-normal text-ink outline-none transition-colors focus:border-ink" />
      </label>
      <label className="grid gap-2 text-[clamp(12px,1vw,14px)] uppercase tracking-[0.14em] text-ink/65">
        Password
        <input data-testid="admin-login-password" name="password" type="password" autoComplete="current-password" required className="admin-login-password border-b border-ink/30 bg-transparent py-4 leading-none normal-case tracking-[0.16em] text-ink outline-none transition-colors focus:border-ink" />
      </label>
      {state.message && <p role="alert" className="border-l-2 border-red-800 pl-4 text-sm text-red-900">{state.message}</p>}
      <button disabled={pending} className="mt-2 bg-ink px-6 py-5 text-xs uppercase tracking-[0.18em] text-paper disabled:opacity-45">
        {pending ? "Checking…" : "Enter the studio"}
      </button>
    </form>
  );
}
