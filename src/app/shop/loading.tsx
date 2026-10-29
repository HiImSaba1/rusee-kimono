export default function ShopLoading() {
  return <main className="section-shell min-h-[75svh] pt-32" aria-busy="true" aria-label="Loading collection">
    <div className="h-4 w-28 animate-pulse bg-ink/10" />
    <div className="mt-8 h-24 max-w-3xl animate-pulse bg-ink/10" />
    <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="aspect-[3/4] animate-pulse border border-ink/10 bg-ink/5" />)}</div>
    <span className="sr-only">Loading the Ruseè collection…</span>
  </main>;
}
