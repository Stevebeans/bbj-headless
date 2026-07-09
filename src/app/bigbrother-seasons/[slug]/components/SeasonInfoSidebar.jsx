import { Leaderboards } from "./Leaderboards";

/**
 * Era-aware season slug: pre-BB22 lives at /bigbrother-seasons/bbNN,
 * BB22+ at /bigbrother-seasons/big-brother-NN (see season-slug split).
 * Computing by number is still approximate for celebrity/OTT seasons, but
 * this fixes the concrete pre-BB22 404s the old `big-brother-N`-always did.
 */
function seasonHref(n) {
  const slug = n < 22 ? `bb${n}` : `big-brother-${n}`;
  return `/bigbrother-seasons/${slug}`;
}

/**
 * Season-specific sidebar with season info, live status, and leaderboards
 * This is the middle column in the 3-column layout
 */
export function SeasonInfoSidebar({ season, juryCount, evictedCount, leaderboardStats }) {
  return (
    <aside
      className="w-full xl:w-72 flex-shrink-0 xl:self-start xl:sticky xl:top-28 space-y-4"
      aria-label="Season Info"
    >
      {/* Season Info */}
      <div className="v2-sidebar-container p-4">
        <h2 className="v2-ad-subheader">Season {season.season_number} Info</h2>
        <table className="w-full mt-3">
          <tbody>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <td className="text-sm py-2 font-semibold text-slate-600 dark:text-slate-400">Name:</td>
              <td className="text-sm py-2 text-right">{season.name}</td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <td className="text-sm py-2 font-semibold text-slate-600 dark:text-slate-400">Start:</td>
              <td className="text-sm py-2 text-right">
                {season.start_date
                  ? new Date(season.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "TBD"}
              </td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <td className="text-sm py-2 font-semibold text-slate-600 dark:text-slate-400">End:</td>
              <td className="text-sm py-2 text-right">
                {season.end_date
                  ? new Date(season.end_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "TBD"}
              </td>
            </tr>
            <tr>
              <td className="text-sm py-2 font-semibold text-slate-600 dark:text-slate-400">Length:</td>
              <td className="text-sm py-2 text-right">{season.total_days} days</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Live Now Summary */}
      <div className="v2-sidebar-container p-4">
        <h2 className="v2-ad-subheader">Live Now</h2>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">HoH</div>
            <div className="text-sm font-medium mt-1">-</div>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">PoV</div>
            <div className="text-sm font-medium mt-1">-</div>
          </div>
        </div>
        <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded mt-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">On the Block</div>
          <div className="text-sm font-medium mt-1">-</div>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="text-center p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded">
            <div className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-semibold">Jury</div>
            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{juryCount}</div>
          </div>
          <div className="text-center p-2 bg-slate-100 dark:bg-slate-800 rounded">
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold">Evicted</div>
            <div className="text-lg font-bold text-slate-500">{evictedCount}</div>
          </div>
        </div>
      </div>

      {/* Season Progress */}
      {season.total_days > 0 && (
        <div className="v2-sidebar-container p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="font-semibold">Season Progress</span>
            <span>
              Day {season.days_elapsed}/{season.total_days} ({season.progress_pct}%)
            </span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={season.progress_pct}
          >
            <div
              className="h-full rounded-full bg-accent-red transition-all"
              style={{ width: `${season.progress_pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Leaderboards (hidden on mobile/tablet, shown here on desktop) */}
      <div className="hidden xl:block">
        <Leaderboards stats={leaderboardStats} />
      </div>

      {/* More Seasons */}
      <div className="v2-sidebar-container p-4">
        <h2 className="v2-ad-subheader">More Seasons</h2>
        <div className="flex items-center justify-between mt-3">
          {Number(season.season_number) > 1 && (
            <a href={seasonHref(Number(season.season_number) - 1)}
              className="text-sm text-primary-500 hover:text-primary-600 transition">
              ← BB{Number(season.season_number) - 1}
            </a>
          )}
          <span className="flex-1" />
          <a href={seasonHref(Number(season.season_number) + 1)}
            className="text-sm text-primary-500 hover:text-primary-600 transition">
            BB{Number(season.season_number) + 1} →
          </a>
        </div>
      </div>
    </aside>
  );
}
