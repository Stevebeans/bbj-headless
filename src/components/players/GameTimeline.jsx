/**
 * Player profile · week-by-week power map for one season.
 * Consumes a season's `weekly_timeline` from the player endpoint.
 *
 * Cells are textless colored boxes positioned by week column (the ruler above
 * supplies the week numbers); empty weeks show a faint guide box. The On-block
 * box carries the eviction-vote count for that week (omitted when 0).
 * Renders nothing when the season isn't weekly-tracked or has no activity.
 */
const CELL = {
  hoh: "bg-emerald-600 text-white",
  pov: "bg-yellow-500 text-primary-500",
  nom: "bg-red-500/15 border border-dashed border-red-500 text-red-600 dark:text-red-400",
  winner: "bg-gradient-to-r from-yellow-300 to-amber-500 text-primary-500 ring-2 ring-yellow-400/30",
  runnerup: "bg-slate-300 text-primary-500",
  afp: "bg-gradient-to-r from-yellow-300 to-amber-500 text-primary-500 ring-2 ring-yellow-400/30",
};

const GUIDE = "bg-slate-100 dark:bg-gray-700/30";

const ROWS = [
  { label: "HoH", key: "hoh" },
  { label: "Veto", key: "pov" },
  { label: "On block", key: "nom" },
];

export function GameTimeline({ timeline, seasonLabel = "" }) {
  if (!timeline?.tracked || !timeline?.has_activity || timeline.max_week <= 0) {
    return null;
  }

  const maxWeek = timeline.max_week;
  const totalCols = maxWeek + 1; // weeks + finale
  const gridStyle = { gridTemplateColumns: `repeat(${totalCols}, minmax(0, 1fr))` };
  const votes = timeline.votes || {};
  const finale = timeline.finale;

  return (
    <section className="mt-6">
      <div className="mb-2">
        <h3 className="font-display text-xl text-gray-900 dark:text-white">
          Game Timeline{seasonLabel ? <span className="text-gray-400 text-base"> — {seasonLabel}</span> : null}
        </h3>
        <span className="text-xs uppercase tracking-wide text-gray-400">Week-by-week power map</span>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 overflow-x-auto">
        {/* Ruler — supplies the week numbers so the cells can stay textless */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-16 shrink-0" />
          <div className="grid flex-1 gap-1 text-[10px] font-mono uppercase text-gray-400" style={gridStyle}>
            {Array.from({ length: maxWeek }, (_, i) => (
              <span key={i} className="text-center">W{i + 1}</span>
            ))}
            <span className="text-center">Fin</span>
          </div>
        </div>

        {/* Event rows — solid boxes positioned by column, empty weeks are faint guides */}
        {ROWS.map((row) => {
          const active = new Set(timeline.cells[row.key] || []);
          return (
            <div key={row.key} className="flex items-center gap-2 mb-1">
              <div className="w-16 shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">{row.label}</div>
              <div className="grid flex-1 gap-1 h-6" style={gridStyle}>
                {Array.from({ length: totalCols }, (_, i) => {
                  const col = i + 1;
                  const isFinaleCol = col === totalCols;
                  if (isFinaleCol || !active.has(col)) {
                    return <div key={col} className={`rounded-sm ${GUIDE}`} />;
                  }
                  const voteCount = row.key === "nom" ? votes[col] : null;
                  return (
                    <div
                      key={col}
                      title={`Week ${col}${voteCount > 0 ? ` · ${voteCount} votes to evict` : ""}`}
                      className={`rounded-sm flex items-center justify-center text-[10px] font-bold ${CELL[row.key]}`}
                    >
                      {voteCount > 0 ? voteCount : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Finale row — label lives only in the Fin column */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-16 shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">Finale</div>
          <div className="grid flex-1 gap-1 h-6" style={gridStyle}>
            {Array.from({ length: totalCols }, (_, i) => {
              const col = i + 1;
              if (col === totalCols && finale) {
                return (
                  <div
                    key={col}
                    className={`rounded-sm flex items-center justify-center text-[10px] font-bold ${CELL[finale.class] ?? CELL.runnerup}`}
                  >
                    {finale.label}
                  </div>
                );
              }
              return <div key={col} className={`rounded-sm ${GUIDE}`} />;
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />HoH</span>
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" />Veto</span>
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-red-500/15 border border-dashed border-red-500 inline-block" />On the block (# = votes to evict)</span>
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-gradient-to-r from-yellow-300 to-amber-500 inline-block" />Winner / AFP</span>
        </div>
      </div>
    </section>
  );
}
