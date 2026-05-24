import Link from "next/link";

export function MoreSeasons({ seasons, currentSlug, limit = 4 }) {
  if (!seasons?.length) return null;
  const more = [...seasons]
    .filter((s) => s.slug && s.slug !== currentSlug)
    .sort((a, b) => Number(b.season_number) - Number(a.season_number))
    .slice(0, limit);
  if (!more.length) return null;
  return (
    <div className="card">
      <h4>More Seasons</h4>
      <div className="seas-mini">
        {more.map((s) => (
          <Link key={s.slug} href={`/bigbrother-seasons/${s.slug}`}>
            <span className="num">{s.season_number}</span>
            <span className="win">Season<b>{s.abbreviation || `BB${s.season_number}`}</b></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
