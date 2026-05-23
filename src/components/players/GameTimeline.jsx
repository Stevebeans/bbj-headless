/**
 * Player profile · week-by-week power map for one season.
 * Consumes a season's `weekly_timeline` from the player endpoint.
 * Renders nothing when the season isn't weekly-tracked or has no activity.
 */
const CELL = {
  hoh: "bg-emerald-600 text-white",
  pov: "bg-yellow-500 text-primary-500",
  nom: "bg-red-500/15 text-red-600 dark:text-red-400 border border-dashed border-red-500",
  winner: "bg-gradient-to-r from-yellow-300 to-amber-500 text-primary-500 ring-2 ring-yellow-400/30",
  runnerup: "bg-slate-300 text-primary-500",
  afp: "bg-gradient-to-r from-yellow-300 to-amber-500 text-primary-500 ring-2 ring-yellow-400/30",
};

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

  return (
    <section className="mt-6">
      <div className="mb-2">
        <h3 className="font-display text-xl text-gray-900 dark:text-white">
          Game Timeline{seasonLabel ? <span className="text-gray-400 text-base"> — {seasonLabel}</span> : null}
        </h3>
        <span className="text-xs uppercase tracking-wide text-gray-400">Week-by-week power map</span>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 overflow-x-auto">
        {/* Ruler */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-16 shrink-0" />
          <div className="grid flex-1 gap-1 text-[10px] font-mono uppercase text-gray-400" style={gridStyle}>
            {Array.from({ length: maxWeek }, (_, i) => (
              <span key={i} className="text-center">W{i + 1}</span>
            ))}
            <span className="text-center">Fin</span>
          </div>
        </div>

        {ROWS.map((row) => (
          <div key={row.key} className="flex items-center gap-2 mb-1">
            <div className="w-16 shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">{row.label}</div>
            <div className="grid flex-1 gap-1 h-6" style={gridStyle}>
              {(timeline.cells[row.key] || []).map((wn) => (
                <div
                  key={wn}
                  className={`flex items-center justify-center rounded text-[10px] font-bold ${CELL[row.key]}`}
                  style={{ gridColumnStart: wn }}
                >
                  W{wn}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Finale */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-16 shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">Finale</div>
          <div className="grid flex-1 gap-1 h-6" style={gridStyle}>
            {timeline.finale ? (
              <div
                className={`flex items-center justify-center rounded text-[10px] font-bold ${CELL[timeline.finale.class]}`}
                style={{ gridColumnStart: totalCols }}
              >
                {timeline.finale.label}
              </div>
            ) : null}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-emerald-600 inline-block" />HoH week</span>
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" />Veto win</span>
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm border border-dashed border-red-500 inline-block" />On the block</span>
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded-sm bg-gradient-to-r from-yellow-300 to-amber-500 inline-block" />Winner / AFP</span>
        </div>
      </div>
    </section>
  );
}
