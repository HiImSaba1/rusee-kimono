"use client";

import { useActionState } from "react";
import { adjustInventory, type InventoryActionState } from "@/app/admin/(protected)/inventory/actions";

const initial: InventoryActionState = {};

export function InventoryAdjustmentForm({ variantId, sku }: { variantId: number; sku: string }) {
  const [state, action, pending] = useActionState(adjustInventory, initial);
  return <form action={action} className="grid min-w-[19rem] grid-cols-[5rem_1fr_auto] items-end gap-2"><input type="hidden" name="variantId" value={variantId} /><label className="grid gap-1 text-[0.55rem] uppercase tracking-[0.12em] text-ink/45">Change<input name="delta" type="number" min={-100} max={100} required placeholder="+2" className="border-b border-ink/25 bg-transparent py-2 text-sm text-ink outline-none focus:border-ink" /></label><label className="grid gap-1 text-[0.55rem] uppercase tracking-[0.12em] text-ink/45">Reason<input name="note" required minLength={5} maxLength={300} placeholder={`Stocktake ${sku}`} className="border-b border-ink/25 bg-transparent py-2 text-sm normal-case tracking-normal text-ink outline-none focus:border-ink" /></label><button disabled={pending} className="bg-ink px-3 py-2.5 text-[0.58rem] uppercase tracking-[0.12em] text-paper disabled:opacity-40">{pending ? "…" : "Apply"}</button>{state.message && <p role="status" className={`col-span-3 text-xs ${state.ok ? "text-green-800" : "text-red-900"}`}>{state.message}</p>}</form>;
}
