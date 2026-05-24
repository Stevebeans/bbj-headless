import Link from "next/link";

/**
 * Recent live feed updates for a season
 */
export function SeasonFeedUpdates({ updates, seasonSlug }) {
  if (!updates || updates.length === 0) return null;

  return (
    <section id="feed-updates">
      <div className="sech"><h2>Live Feed Updates</h2><span className="sub">Recent</span></div>
      <div className="card">
      <div className="space-y-3">
        {updates.map((update) => (
          <Link key={update.id} href={`/live-feed-updates/${update.slug}`}
            className="block border-l-[3px] border-secondary-500 pl-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r transition">
            <div className="text-sm font-medium line-clamp-1">{update.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {update.date && new Date(update.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {update.time && ` · ${update.time}`}
            </div>
            {update.excerpt && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{update.excerpt}</p>}
          </Link>
        ))}
      </div>
      <div className="mt-3 text-center">
        <Link href={`/live-feed-updates?season=${seasonSlug}`}
          className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition">
          View all feed updates →
        </Link>
      </div>
      </div>
    </section>
  );
}
