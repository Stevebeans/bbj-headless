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
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white ${RING}`}
    >
      {initials(person.name)}
    </span>
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
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-[10px] font-bold text-primary-500 ${RING}`}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

export function SeasonPowerMap({ weeks, seasonLabel = "" }) {
  if (!weeks?.length) return null;

  const maxWeek = weeks.reduce((m, w) => Math.max(m, Number(w.week_num) || 0), 0);
  if (maxWeek <= 0) return null;

  const byWeek = new Map();
  let hasAnyFace = false;
  for (const w of weeks) {
    const f = w.faces || {};
    byWeek.set(Number(w.week_num), f);
    if (f.hoh?.length || f.pov?.length || f.noms?.length || f.evicted?.length) {
      hasAnyFace = true;
    }
  }
  if (!hasAnyFace) return null;

  const gridStyle = { gridTemplateColumns: `repeat(${maxWeek}, minmax(44px, 1fr))` };

  return (
    <section className="mt-6">
      <div className="mb-2">
        <h3 className="font-display text-xl text-gray-900 dark:text-white">
          Power Map
          {seasonLabel ? <span className="text-gray-400 text-base"> — {seasonLabel}</span> : null}
        </h3>
        <span className="text-xs uppercase tracking-wide text-gray-400">Week-by-week house power</span>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 overflow-x-auto">
        {/* Ruler — supplies week numbers */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-16 shrink-0" />
          <div className="grid flex-1 gap-1 text-[10px] font-mono uppercase text-gray-400" style={gridStyle}>
            {Array.from({ length: maxWeek }, (_, i) => (
              <span key={i} className="text-center">W{i + 1}</span>
            ))}
          </div>
        </div>

        {/* Rows */}
        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center gap-2 mb-1">
            <div className="w-16 shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">{row.label}</div>
            <div className="grid flex-1 gap-1 items-center" style={gridStyle}>
              {Array.from({ length: maxWeek }, (_, i) => {
                const col = i + 1;
                const people = byWeek.get(col)?.[row.key] || [];
                return (
                  <div key={col} className="flex min-h-[2.25rem] items-center justify-center">
                    <Cell people={people} grayscale={row.grayscale} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
          {ROWS.map((row) => (
            <span key={row.key} className="flex items-center gap-1">
              <i className={`w-3 h-3 rounded-sm inline-block ${row.dot}`} />
              {row.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
