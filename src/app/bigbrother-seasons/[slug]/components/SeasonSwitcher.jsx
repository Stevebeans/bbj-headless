import Link from "next/link";

/**
 * Horizontal season-switcher rail. Shows up to `windowSize` seasons on each side
 * of the current one (by season_number), using each season's real slug.
 */
export function SeasonSwitcher({ seasons, currentSlug, windowSize = 5 }) {
  if (!seasons?.length) return null;

  const sorted = [...seasons]
    .filter((s) => s.slug)
    .sort((a, b) => Number(a.season_number) - Number(b.season_number));

  const idx = sorted.findIndex((s) => s.slug === currentSlug);
  if (idx === -1) return null;

  const lo = Math.max(0, idx - windowSize);
  const hi = Math.min(sorted.length, idx + windowSize + 1);
  const slice = sorted.slice(lo, hi);

  return (
    <div className="switcher">
      <span className="k">Switch season</span>
      <div className="pills">
        {slice.map((s) => (
          <Link key={s.slug} href={`/bigbrother-seasons/${s.slug}`} className={s.slug === currentSlug ? "on" : ""}>
            {s.abbreviation || `BB${s.season_number}`}
          </Link>
        ))}
      </div>
      <Link className="all" href="/bigbrother-seasons/">All seasons →</Link>
    </div>
  );
}
