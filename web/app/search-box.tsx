export function SearchBox({ initial = "", autoFocus = false, compact = false }: { initial?: string; autoFocus?: boolean; compact?: boolean }) {
  return (
    <form action="/search" role="search" className={compact ? "search compact" : "search"}>
      <input
        type="search" name="q" defaultValue={initial} autoFocus={autoFocus}
        placeholder="Search a company, product, or shark…" aria-label="Search companies"
        autoComplete="off" minLength={2}
      />
      <button type="submit">Search</button>
    </form>
  );
}
