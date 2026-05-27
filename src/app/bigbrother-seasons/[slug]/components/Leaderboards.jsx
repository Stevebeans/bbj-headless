import Image from "next/image";
import Link from "next/link";
import { displayName } from "./playerName";
import { toRelativeHref } from "@/lib/utils/url";

/**
 * Season leaderboards — 2x2 grid of top-5 lists (HoH / PoV / Noms / Votes),
 * each row showing the player's avatar + casual name.
 */
function LbAvatar({ player }) {
  if (player.photo) {
    return (
      <Image
        src={player.photo}
        alt=""
        width={24}
        height={24}
        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span className="flex-shrink-0 grid place-items-center w-6 h-6 rounded-full bg-primary-500 text-white text-[9px] font-bold">
      {(player.name || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}

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
    <section id="leaderboards">
      <div className="sech"><h2>Leaderboards</h2><span className="sub">Season records</span></div>
      <div className="card">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {categories.map(({ key, title, statKey, color }) => {
            const players = stats[key] || [];
            const maxValue = players[0]?.stats[statKey] || 1;
            const colors = colorClasses[color];

            return (
              <div key={key}>
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
                            href={player.permalink ? toRelativeHref(player.permalink) : "#"}
                            className="flex items-center gap-2 flex-shrink-0 w-[120px] hover:underline"
                          >
                            <LbAvatar player={player} />
                            <span className="truncate text-sm">{displayName(player)}</span>
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
      </div>
    </section>
  );
}
