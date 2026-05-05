/**
 * Head-to-head breakdown for seasons where both players competed
 */
export function ComparisonHeadToHead({ player1, player2, sharedSeasonIds }) {
  if (!sharedSeasonIds?.length) return null;

  // Build lookup for each player's season data
  const p1Seasons = Object.fromEntries(
    (player1.seasons || []).map((s) => [s.season_id, s])
  );
  const p2Seasons = Object.fromEntries(
    (player2.seasons || []).map((s) => [s.season_id, s])
  );

  const sharedRows = sharedSeasonIds
    .map((id) => ({
      seasonId: id,
      season: p1Seasons[id] || p2Seasons[id],
      p1: p1Seasons[id] || {},
      p2: p2Seasons[id] || {},
    }))
    .filter((row) => row.season);

  if (sharedRows.length === 0) return null;

  return (
    <section>
      <h2 className="v2-primary-subheader mb-4">
        Head-to-Head ({sharedRows.length} Shared Season{sharedRows.length > 1 ? "s" : ""})
      </h2>

      <div className="space-y-4">
        {sharedRows.map(({ seasonId, season, p1, p2 }) => (
          <div
            key={seasonId}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            {/* Season header */}
            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-100 dark:border-gray-600">
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                {season.season_name || season.season_abbr || `Season ${seasonId}`}
              </h3>
            </div>

            {/* Stats table */}
            <div className="p-3">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-2 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                <div className="text-right">{player1.first_name || player1.name?.split(" ")[0]}</div>
                <div className="min-w-[80px] text-center">Stat</div>
                <div className="text-left">{player2.first_name || player2.name?.split(" ")[0]}</div>
              </div>

              {/* Stat rows */}
              <H2HRow label="HoH" v1={p1.hoh || 0} v2={p2.hoh || 0} />
              <H2HRow label="PoV" v1={p1.pov || 0} v2={p2.pov || 0} />
              <H2HRow label="Noms" v1={p1.nom || 0} v2={p2.nom || 0} lowerBetter />
              <H2HRow label="Votes" v1={p1.votes_received || 0} v2={p2.votes_received || 0} lowerBetter />
              <H2HRow label="Days" v1={p1.days_in_house || 0} v2={p2.days_in_house || 0} />
              <H2HRow label="Result" v1={p1.result || "—"} v2={p2.result || "—"} isResult />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function H2HRow({ label, v1, v2, lowerBetter, isResult }) {
  let p1Highlight = "";
  let p2Highlight = "";

  if (!isResult && v1 !== v2) {
    const p1Leads = lowerBetter ? v1 < v2 : v1 > v2;
    p1Highlight = p1Leads ? "text-emerald-600 dark:text-emerald-400 font-bold" : "";
    p2Highlight = !p1Leads ? "text-emerald-600 dark:text-emerald-400 font-bold" : "";
  }

  if (isResult) {
    p1Highlight = getResultColor(v1);
    p2Highlight = getResultColor(v2);
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5 border-t border-gray-50 dark:border-gray-700/50 first:border-t-0">
      <div className={`text-right tabular-nums text-sm ${p1Highlight || "text-gray-600 dark:text-gray-400"}`}>
        {v1}
      </div>
      <div className="min-w-[80px] text-center text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className={`text-left tabular-nums text-sm ${p2Highlight || "text-gray-600 dark:text-gray-400"}`}>
        {v2}
      </div>
    </div>
  );
}

function getResultColor(result) {
  if (!result || result === "—") return "";
  const r = result.toLowerCase();
  if (r === "winner") return "text-emerald-600 dark:text-emerald-400 font-bold";
  if (r === "runner up") return "text-sky-500 dark:text-sky-400 font-semibold";
  if (r === "afp") return "text-pink-500 dark:text-pink-400 font-semibold";
  if (r === "jury") return "text-indigo-500 dark:text-indigo-400";
  return "text-gray-500 dark:text-gray-400";
}
