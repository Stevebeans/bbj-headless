import Link from "next/link";

/**
 * Build the visible page list with ellipses.
 * Always shows first, last, and current ± 1.
 */
function buildPageList(current, total) {
  const pages = new Set([1, total]);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({ currentPage, totalPages, basePath = "/page" }) {
  if (!totalPages || totalPages <= 1) return null;

  const hrefFor = (n) => (n === 1 ? "/" : `${basePath}/${n}`);
  const pages = buildPageList(currentPage, totalPages);

  const linkBase =
    "inline-flex items-center justify-center min-w-[2.25rem] h-9 px-3 rounded-md text-sm font-osw uppercase tracking-wide transition-colors";
  const inactive =
    "text-primary-500 hover:bg-primary-500/10 dark:text-secondary-500 dark:hover:bg-secondary-500/10";
  const active =
    "bg-primary-500 text-white dark:bg-secondary-500 dark:text-primary-700";
  const disabled =
    "text-gray-400 dark:text-gray-600 cursor-not-allowed select-none";

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1 mt-6"
      aria-label="Pagination"
    >
      {currentPage > 1 ? (
        <Link
          href={hrefFor(currentPage - 1)}
          rel="prev"
          className={`${linkBase} ${inactive}`}
        >
          ← Prev
        </Link>
      ) : (
        <span className={`${linkBase} ${disabled}`}>← Prev</span>
      )}

      {pages.map((p, i) =>
        p === "…" ? (
          <span
            key={`e${i}`}
            className={`${linkBase} ${disabled}`}
            aria-hidden="true"
          >
            …
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            aria-current="page"
            className={`${linkBase} ${active}`}
          >
            {p}
          </span>
        ) : (
          <Link key={p} href={hrefFor(p)} className={`${linkBase} ${inactive}`}>
            {p}
          </Link>
        )
      )}

      {currentPage < totalPages ? (
        <Link
          href={hrefFor(currentPage + 1)}
          rel="next"
          className={`${linkBase} ${inactive}`}
        >
          Next →
        </Link>
      ) : (
        <span className={`${linkBase} ${disabled}`}>Next →</span>
      )}
    </nav>
  );
}
