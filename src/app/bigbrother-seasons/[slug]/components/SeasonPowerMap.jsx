import Image from "next/image";
import Link from "next/link";

/**
 * Season profile · week-by-week power map with player faces.
 * Consumes the season `weeks` array, where each week carries `faces`:
 * { hoh, pov, noms, evicted } — each an array of { id, name, slug, photo }.
 * Mirrors the player GameTimeline grid, but cells hold avatar(s).
 * Renders nothing when the season has no weekly face data.
 */
const ROWS = [
  { key: "hoh", label: "HoH", dot: "bg-emerald-600" },
  { key: "pov", label: "Veto", dot: "bg-yellow-500" },
  { key: "noms", label: "Noms", dot: "bg-red-500" },
  { key: "evicted", label: "Evicted", dot: "bg-slate-400", grayscale: true },
];

const GUIDE = "bg-slate-100 dark:bg-gray-700/30";
const MAX_FACES = 3;
const RING = "ring-2 ring-white dark:ring-gray-800";

function initials(name = "") {
  return name.trim().slice(0, 2).toUpperCase() || "—";
}

/** Round 32px badge — shared by the initials fallback and the +N overflow count. */
function Chip({ className = "", title, children }) {
  return (
    <span
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold ${RING} ${className}`}
    >
      {children}
    </span>
  );
}

function Face({ person, grayscale }) {
  const inner = person.photo ? (
    <Image
      src={person.photo}
      alt={person.name}
      width={32}
      height={32}
      className={`h-8 w-8 rounded-full object-cover ${RING} ${grayscale ? "grayscale" : ""}`}
    />
  ) : (
    <Chip className="bg-primary-500 text-white">{initials(person.name)}</Chip>
  );

  if (person.slug) {
    return (
      <Link href={`/bigbrother-players/${person.slug}`} title={person.name} className="block">
        {inner}
      </Link>
    );
  }
  return <span title={person.name}>{inner}</span>;
}

function Cell({ people, grayscale }) {
  if (!people?.length) {
    return <div className={`h-1.5 w-full rounded-full ${GUIDE}`} />;
  }
  const shown = people.slice(0, MAX_FACES);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center justify-center -space-x-2">
      {shown.map((p) => (
        <Face key={p.id} person={p} grayscale={grayscale} />
      ))}
      {extra > 0 ? (
        <Chip title={`+${extra} more`} className="bg-gray-300 text-primary-500">
          +{extra}
        </Chip>
      ) : null}
    </div>
  );
}

export function SeasonPowerMap({ weeks, seasonLabel = "" }) {
  if (!weeks?.length) return null;

  // Latest week first.
  const sorted = [...weeks].sort(
    (a, b) => (Number(b.week_num) || 0) - (Number(a.week_num) || 0)
  );
  const hasAnyFace = sorted.some((w) => {
    const f = w.faces || {};
    return ROWS.some(({ key }) => f[key]?.length);
  });
  if (!hasAnyFace) return null;

  // Week label column + the 4 role columns.
  const gridStyle = { gridTemplateColumns: "2.75rem repeat(4, minmax(58px, 1fr))" };

  return (
    <section id="weekly-results">
      <div className="sech"><h2>Weekly Results</h2><span className="sub">Week-by-week house power</span></div>

      <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 overflow-x-auto">
        {/* Column headers — the 4 roles */}
        <div
          className="grid gap-1 mb-1 pb-2 border-b-2 border-slate-200 dark:border-gray-700"
          style={gridStyle}
        >
          <span className="text-[10px] font-mono uppercase text-gray-400 self-end">Wk</span>
          {ROWS.map((row) => (
            <span
              key={row.key}
              className="flex items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
            >
              <i className={`w-2 h-2 rounded-full inline-block ${row.dot}`} />
              {row.label}
            </span>
          ))}
        </div>

        {/* One row per week */}
        {sorted.map((w) => {
          const f = w.faces || {};
          return (
            <div
              key={w.week_num}
              className="grid gap-1 items-center py-1 border-b border-slate-100 dark:border-gray-700/40 last:border-0"
              style={gridStyle}
            >
              <span className="text-[11px] font-mono font-semibold text-gray-500 dark:text-gray-400">
                W{w.week_num}
              </span>
              {ROWS.map((row) => (
                <div key={row.key} className="flex min-h-[2.25rem] items-center justify-center">
                  <Cell people={f[row.key] || []} grayscale={row.grayscale} />
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}
