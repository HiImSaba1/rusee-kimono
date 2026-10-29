"use client";

import { useState } from "react";

export function FakePaymentControls({ paymentId, publicId }: { paymentId: string; publicId: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function simulate(outcome: "captured" | "failed" | "cancelled") {
    setPending(outcome); setError("");
    try {
      const response = await fetch("/api/payments/fake/simulate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ paymentId, outcome }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Simulation failed.");
      window.location.assign(`/order/${publicId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Simulation failed.");
      setPending(null);
    }
  }
  return <div className="mt-10 grid gap-3"><button disabled={Boolean(pending)} onClick={() => simulate("captured")} className="bg-ink px-6 py-5 text-xs uppercase tracking-[0.17em] text-paper disabled:opacity-40">{pending === "captured" ? "Sending verified capture…" : "Simulate successful payment"}</button><div className="grid grid-cols-2 gap-3"><button disabled={Boolean(pending)} onClick={() => simulate("failed")} className="border border-ink/25 px-4 py-4 text-xs uppercase tracking-[0.13em] disabled:opacity-40">Decline</button><button disabled={Boolean(pending)} onClick={() => simulate("cancelled")} className="border border-ink/25 px-4 py-4 text-xs uppercase tracking-[0.13em] disabled:opacity-40">Cancel</button></div>{error && <p role="alert" className="text-sm text-red-900">{error}</p>}</div>;
}
