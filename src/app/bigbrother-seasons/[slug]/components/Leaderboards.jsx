import Link from "next/link";

/**
 * Season leaderboards showing top players in each category
 */
export function Leaderboards({ stats }) {
  const categories = [
    { key: "hoh", title: "Most HOH Wins", statKey: "hoh", color: "green" },
    { key: "pov", title: "Most POV Wins", statKey: "pov", color: "amber" },
    { key: "nom", title: "Most Nominations", statKey: "nom", color: "rose" },
    { key: "votes", title: "Most Votes Received", statKey: "votes_received", color: "purple" },
  ];

  const colorClasses = {
    green: { track: "bg-green-100 dark:bg-green-900/30", bar: "bg-green-500" },
    amber: { track: "bg-amber-100 dark:bg-amber-900/30", bar: "bg-amber-500" },
    rose: { track: "bg-rose-100 dark:bg-rose-900/30", bar: "bg-rose-500" },
    purple: { track: "bg-purple-100 dark:bg-purple-900/30", bar: "bg-purple-500" },
  };

  return (
    <div className="v2-primary-container-inner p-4 rounded-lg">
      <h2 className="v2-primary-subheader mb-4">Leaderboards</h2>

      {categories.map(({ key, title, statKey, color }) => {
        const players = stats[key] || [];
        const maxValue = players[0]?.stats[statKey] || 1;
        const colors = colorClasses[color];

        return (
          <div key={key} className="mb-4 last:mb-0">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
              {title}
            </div>

            {players.length > 0 ? (
              <ol className="space-y-1.5">
                {players.map((player) => {
                  const value = player.stats[statKey] || 0;
                  const pct = Math.round((value / maxValue) * 100);

                  return (
                    <li key={player.id} className="flex items-center gap-2">
                      <Link
                        href={player.permalink || "#"}
                        className="truncate text-sm hover:underline flex-shrink-0"
                        style={{ minWidth: "80px", maxWidth: "100px" }}
                      >
                        {player.name}
                      </Link>
                      <div className="flex-grow flex items-center gap-2">
                        <div className={`h-2 flex-grow overflow-hidden rounded ${colors.track}`}>
                          <div
                            className={`h-full ${colors.bar} transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-xs tabular-nums flex-shrink-0">
                          {value}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-xs text-slate-500 italic">No data yet</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
