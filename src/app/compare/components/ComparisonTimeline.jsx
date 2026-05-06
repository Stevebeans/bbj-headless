import { ResultCell } from "@/components/shared";

/**
 * Combined season timeline showing all seasons from both players
 * Merged chronologically with indicators for who played in each
 */
export function ComparisonTimeline({ player1, player2 }) {
  const seasons1 = player1.seasons || [];
  const seasons2 = player2.seasons || [];

  if (seasons1.length === 0 && seasons2.length === 0) return null;

  // Merge all seasons and deduplicate by season_id
  const allSeasons = new Map();

  for (const s of seasons1) {
    allSeasons.set(s.season_id, { ...allSeasons.get(s.season_id), seasonId: s.season_id, season: s, p1: s });
  }
  for (const s of seasons2) {
    const existing = allSeasons.get(s.season_id) || { seasonId: s.season_id, season: s };
    allSeasons.set(s.season_id, { ...existing, p2: s });
  }

  // Sort by season_id ascending (chronological)
  const timeline = Array.from(allSeasons.values()).sort((a, b) => a.seasonId - b.seasonId);

  const p1Name = player1.first_name || player1.name?.split(" ")[0];
  const p2Name = player2.first_name || player2.name?.split(" ")[0];

  return (
    <section>
      <h2 className="v2-primary-subheader mb-4">Season Timeline</h2>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-600">
              <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Season</th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700 dark:text-gray-300" colSpan={3}>
                {p1Name}
              </th>
              <th className="text-center py-2 px-2 font-semibold text-gray-700 dark:text-gray-300" colSpan={3}>
                {p2Name}
              </th>
            </tr>
            <tr className="border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              <th />
              <th className="py-1 px-2">Days</th>
              <th className="py-1 px-2">HoH/PoV</th>
              <th className="py-1 px-2">Result</th>
              <th className="py-1 px-2">Days</th>
              <th className="py-1 px-2">HoH/PoV</th>
              <th className="py-1 px-2">Result</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map(({ seasonId, season, p1, p2 }) => (
              <tr
                key={seasonId}
                className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30"
              >
                <td className="py-2 px-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {season.season_abbr || season.season_name || `S${seasonId}`}
                </td>
                {/* Player 1 */}
                {p1 ? (
                  <>
                    <td className="py-2 px-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                      {p1.days_in_house || "—"}
                    </td>
                    <td className="py-2 px-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                      {p1.hoh || 0}/{p1.pov || 0}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <ResultCell result={p1.result} />
                    </td>
                  </>
                ) : (
                  <td colSpan={3} className="py-2 px-2 text-center text-gray-300 dark:text-gray-600">—</td>
                )}
                {/* Player 2 */}
                {p2 ? (
                  <>
                    <td className="py-2 px-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                      {p2.days_in_house || "—"}
                    </td>
                    <td className="py-2 px-2 text-center tabular-nums text-gray-600 dark:text-gray-400">
                      {p2.hoh || 0}/{p2.pov || 0}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <ResultCell result={p2.result} />
                    </td>
                  </>
                ) : (
                  <td colSpan={3} className="py-2 px-2 text-center text-gray-300 dark:text-gray-600">—</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {timeline.map(({ seasonId, season, p1, p2 }) => (
          <div
            key={seasonId}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3"
          >
            <div className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">
              {season.season_abbr || season.season_name || `S${seasonId}`}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <MobilePlayerSeason label={p1Name} data={p1} />
              <MobilePlayerSeason label={p2Name} data={p2} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobilePlayerSeason({ label, data }) {
  if (!data) {
    return (
      <div>
        <div className="font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
        <div className="text-gray-300 dark:text-gray-600">Did not play</div>
      </div>
    );
  }

  return (
    <div>
      <div className="font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="space-y-0.5 text-gray-600 dark:text-gray-400">
        <div>{data.days_in_house || 0} days</div>
        <div>HoH: {data.hoh || 0} | PoV: {data.pov || 0}</div>
        <div>
          <ResultCell result={data.result} />
        </div>
      </div>
    </div>
  );
}
