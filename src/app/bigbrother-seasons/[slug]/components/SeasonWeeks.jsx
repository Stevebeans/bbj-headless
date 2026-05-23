/**
 * Season profile · week-by-week breakdown. Consumes the `weeks` array
 * from the season-by-slug endpoint. Renders nothing if no weekly data.
 */
function NameList({ label, names, className = "" }) {
  if (!names?.length) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-1">
      <span className={`text-xs font-semibold uppercase tracking-wide ${className}`}>{label}:</span>
      <span className="text-sm text-gray-700 dark:text-gray-300">{names.join(", ")}</span>
    </div>
  );
}

export function SeasonWeeks({ weeks }) {
  if (!weeks?.length) return null;

  return (
    <section id="weeks" aria-labelledby="season-weeks-heading" className="my-8">
      <h2 id="season-weeks-heading" className="font-display text-2xl text-gray-900 dark:text-white mb-3">Week by Week</h2>
      <div className="space-y-3">
        {weeks.map((w) => (
          <div
            key={w.week_num}
            className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-lg text-primary-500">Week {w.week_num}</h3>
              {w.start_date ? (
                <span className="text-xs text-gray-400" data-nosnippet>
                  {w.start_date}{w.end_date && w.end_date !== w.start_date ? ` – ${w.end_date}` : ""}
                </span>
              ) : null}
            </div>
            <div className="space-y-1">
              <NameList label="HoH" names={w.hoh} className="text-emerald-600 dark:text-emerald-400" />
              <NameList label="Veto" names={w.pov} className="text-yellow-600 dark:text-yellow-500" />
              <NameList label="Noms" names={w.noms} className="text-red-600 dark:text-red-400" />
              <NameList label="Evicted" names={w.evicted} className="text-slate-500" />
            </div>
            {w.summary ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{w.summary}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
