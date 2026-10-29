export function MetricCard({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return <article className="min-h-48 border border-ink/20 bg-paper-deep p-5"><p className="text-[0.62rem] uppercase tracking-[0.16em] text-ink/75">{label}</p><p className="mt-8 font-display text-6xl leading-none tracking-[-0.055em]">{value}</p>{note && <p className="mt-5 text-xs text-ink/75">{note}</p>}</article>;
}
