/**
 * Season profile · week-by-week recap. Renders only weeks that have a
 * written summary. Returns null if no week has summary text.
 */
export function SeasonWeeks({ weeks }) {
  if (!weeks?.length) return null;

  const recap = weeks.filter((w) => w.summary);
  if (!recap.length) return null;

  return (
    <section id="week-recap">
      <div className="sech"><h2>Week-by-week Recap</h2><span className="sub">{recap.length} weeks</span></div>
      <div className="space-y-3">
        {recap.map((w) => (
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
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{w.summary}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
