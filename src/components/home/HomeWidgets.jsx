import Image from "next/image";
import Link from "next/link";

/**
 * Social Follow Widget
 */
export function SocialFollow() {
  return (
    <section className="v2-primary-container-inner p-4">
      <h2 className="v2-primary-subheader">Follow Us</h2>
      <div className="flex gap-6 justify-center mt-3">
        <a
          href="https://twitter.com/BigBrotherBBJ"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-[#1DA1F2] dark:text-gray-400 transition-colors"
          aria-label="Follow on Twitter"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <a
          href="https://www.instagram.com/bigbrotherjunky/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-[#E4405F] dark:text-gray-400 transition-colors"
          aria-label="Follow on Instagram"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
        </a>
        <a
          href="https://www.facebook.com/bigbrotherjunkies"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-600 hover:text-[#1877F2] dark:text-gray-400 transition-colors"
          aria-label="Follow on Facebook"
        >
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>
      </div>
    </section>
  );
}

/**
 * Houseboard Widget (HoH, PoV, Nominees, Have Nots)
 */
export function Houseboard({ houseboard, seasonName }) {
  const { hoh = [], pov = [], nominees = [], have_nots = [] } = houseboard || {};

  return (
    <section className="v2-primary-container-inner p-4" aria-labelledby="houseboard-title">
      <h2 id="houseboard-title" className="v2-primary-subheader">
        {seasonName || "Big Brother"} Houseboard
      </h2>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {/* Head of Household */}
        <HouseboardCard
          title="Head of Household"
          players={hoh}
          bgColor="bg-emerald-600"
          emptyText="No HoH Yet"
        />

        {/* Power of Veto */}
        <HouseboardCard
          title="Power of Veto"
          players={pov}
          bgColor="bg-yellow-600"
          emptyText="No PoV Yet"
        />

        {/* Nominees */}
        <HouseboardCard
          title="Nominees"
          players={nominees}
          bgColor="bg-red-500"
          emptyText="No Nominees Yet"
        />

        {/* Have Nots */}
        <HouseboardCard
          title="Have Nots"
          players={have_nots}
          bgColor="bg-gray-800"
          emptyText="No Current HN"
        />
      </div>
    </section>
  );
}

function HouseboardCard({ title, players, bgColor, emptyText }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className={`w-full ${bgColor} text-white text-center text-xs p-1 font-semibold`}>
        {title}
      </div>
      <div className="p-2 flex flex-wrap items-center justify-center gap-2 min-h-[70px]">
        {players.length > 0 ? (
          players.map((player) => (
            <Link
              key={player.id}
              href={player.permalink}
              className="flex flex-col items-center hover:opacity-80"
            >
              {player.image ? (
                <Image
                  src={player.image}
                  alt={player.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600" />
              )}
              <span className="text-xs font-display text-center mt-1 text-gray-700 dark:text-gray-300">
                {player.name}
              </span>
            </Link>
          ))
        ) : (
          <span className="text-center text-gray-500 dark:text-gray-400 italic text-xs">
            {emptyText}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Watch Live Feeds Affiliate Widget
 */
export function WatchLiveFeeds() {
  return (
    <section className="v2-primary-container-inner p-4" aria-labelledby="watch-feeds-title">
      <h2 id="watch-feeds-title" className="v2-primary-subheader">
        Watch Live Feeds
      </h2>
      <div className="flex justify-center items-center flex-col mt-3">
        <a
          rel="sponsored"
          href="https://paramountplus.qflm.net/c/161260/3116110/3065"
          target="_blank"
          className="block hover:opacity-90 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="//a.impactradius-go.com/display-ad/3065-3116110"
            alt="Paramount+ Live Feeds"
            width={290}
            height={46}
            className="mx-auto"
          />
          <div className="font-display text-center font-semibold text-primary-500 dark:text-primary-400 mt-2">
            One Week Free
          </div>
        </a>
      </div>
    </section>
  );
}

/**
 * Season Stats Widget
 */
export function SeasonStats({ season, players = [] }) {
  if (!season) return null;

  return (
    <section className="v2-primary-container-inner p-4" aria-labelledby="stats-title">
      <h2 id="stats-title" className="v2-primary-subheader">
        {season.name || "Big Brother"} Stats
      </h2>

      {/* Season Progress */}
      <div className="grid grid-cols-5 items-center text-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 mt-3">
        <div className="font-sans font-semibold text-[10px] text-gray-600 dark:text-gray-400">Days</div>
        <div className="font-sans font-semibold text-[10px] text-gray-600 dark:text-gray-400">Elapsed</div>
        <div className="font-sans font-semibold text-[10px] text-gray-600 dark:text-gray-400">Rem</div>
        <div className="font-sans font-semibold text-[10px] text-gray-600 dark:text-gray-400">%</div>
        <div className="font-sans font-semibold text-[10px] text-gray-600 dark:text-gray-400">Status</div>

        <div className="text-primary-500 font-semibold text-sm">{season.total_days}</div>
        <div className="text-primary-500 font-semibold text-sm">{season.days_elapsed}</div>
        <div className="text-primary-500 font-semibold text-sm">{season.days_remaining}</div>
        <div className="text-primary-500 font-semibold text-sm">{season.progress_pct}%</div>
        <div className="text-primary-500 font-semibold text-[10px]">
          {season.is_active ? "Active" : "Complete"}
        </div>

        {/* Progress Bar */}
        <div className="col-span-5 mt-2">
          <div className="w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-1 bg-secondary-500 transition-all duration-700"
              style={{ width: `${season.progress_pct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Player Stats Table */}
      <div className="overflow-x-auto">
        <div className="grid grid-cols-[minmax(80px,1fr)_repeat(5,32px)] gap-1 text-xs">
          {/* Header */}
          <div className="font-semibold bg-gray-200 dark:bg-gray-700 p-1 rounded-l">Player</div>
          <div className="font-semibold bg-gray-200 dark:bg-gray-700 p-1 text-center" title="HoH Wins">H</div>
          <div className="font-semibold bg-gray-200 dark:bg-gray-700 p-1 text-center" title="Veto Wins">V</div>
          <div className="font-semibold bg-gray-200 dark:bg-gray-700 p-1 text-center" title="Nominations">N</div>
          <div className="font-semibold bg-gray-200 dark:bg-gray-700 p-1 text-center" title="Votes Received">VR</div>
          <div className="font-semibold bg-gray-200 dark:bg-gray-700 p-1 text-center rounded-r" title="Days in House">TD</div>

          {/* Players */}
          {players.map((player) => (
            <PlayerStatsRow key={player.id} player={player} />
          ))}
        </div>

        {/* Legend */}
        <div className="border-t border-gray-300 dark:border-gray-700 text-[10px] mt-3 pt-2 text-gray-500 dark:text-gray-400 italic grid grid-cols-[25px_1fr] gap-x-2">
          <div className="text-center">H</div>
          <div>Head of Household</div>
          <div className="text-center">V</div>
          <div>Veto Wins</div>
          <div className="text-center">N</div>
          <div>Nominations</div>
          <div className="text-center">VR</div>
          <div>Votes Received</div>
          <div className="text-center">TD</div>
          <div>Total Days</div>
        </div>
      </div>
    </section>
  );
}

function PlayerStatsRow({ player }) {
  const textClass = player.is_evicted
    ? "text-gray-500 dark:text-gray-400"
    : "text-gray-800 dark:text-gray-200";

  return (
    <>
      <div className={`flex items-center gap-1 truncate ${textClass}`}>
        {player.image && (
          <Image
            src={player.image}
            alt=""
            width={16}
            height={16}
            className="rounded-full w-4 h-4 flex-shrink-0"
          />
        )}
        <Link href={player.permalink} className="truncate hover:underline py-0.5">
          {player.name}
        </Link>
      </div>
      <div className={`text-center tabular-nums ${textClass}`}>{player.stats.hoh}</div>
      <div className={`text-center tabular-nums ${textClass}`}>{player.stats.pov}</div>
      <div className={`text-center tabular-nums ${textClass}`}>{player.stats.nom}</div>
      <div className={`text-center tabular-nums ${textClass}`}>{player.stats.votes_received}</div>
      <div className={`text-center tabular-nums ${textClass}`}>{player.stats.days_in_house}</div>
    </>
  );
}

/**
 * Recent Comments Widget
 */
export function RecentComments({ comments = [] }) {
  if (comments.length === 0) return null;

  return (
    <section className="v2-primary-container-inner p-4" aria-labelledby="recent-comments-title">
      <h2 id="recent-comments-title" className="v2-primary-subheader">
        Recent Comments
      </h2>

      <div className="divide-y divide-gray-200 dark:divide-gray-700 mt-3">
        {comments.map((comment) => (
          <div key={comment.id} className="py-3 first:pt-0 last:pb-0">
            {/* Author Row */}
            <div className="flex items-center gap-2 mb-1">
              {comment.avatar && (
                <Image
                  src={comment.avatar}
                  alt=""
                  width={24}
                  height={24}
                  className="rounded-full w-6 h-6"
                />
              )}
              <span className="font-sans font-semibold text-sm text-gray-700 dark:text-gray-300 truncate">
                {comment.author}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400" data-nosnippet>
                {comment.time_ago}
              </span>
            </div>

            {/* Comment Preview */}
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
              {comment.content}
            </p>

            {/* Post Link */}
            <Link
              href={comment.post.permalink}
              className="text-xs text-primary-500 dark:text-primary-400 hover:underline line-clamp-1"
            >
              on: {comment.post.title}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
