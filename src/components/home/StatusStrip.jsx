import Link from "next/link";

/**
 * Page-defining H1 + horizontal ticker of latest feed-update headlines.
 * Hidden ticker on small screens; H1 always renders.
 */
export function StatusStrip({ season, tickerItems = [] }) {
  const heading = season?.full_name
    ? `${season.full_name} Spoilers`
    : "Big Brother Spoilers";

  // Render the headline list TWICE so the marquee loops seamlessly.
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <section
      className="bbj-status-strip"
      aria-label="Page header"
    >
      <div className="mx-auto max-w-screen-xl px-4 py-3 flex items-center gap-6">
        <h1 className="font-display text-xl md:text-2xl font-bold text-white shrink-0 m-0 leading-none">
          <Link
            href="/category/spoilers/"
            className="no-underline text-white hover:text-secondary-500"
          >
            {heading}
          </Link>
        </h1>

        {tickerItems.length > 0 && (
          <div className="bbj-ticker hidden md:block" aria-label="Latest feed updates">
            <div className="bbj-ticker-track font-osw uppercase tracking-wider text-xs text-gray-300">
              {doubled.map((item, idx) => (
                <Link
                  key={`${item.id}-${idx}`}
                  href={item.permalink}
                  className="inline-flex items-center gap-2 px-4 no-underline text-gray-200 hover:text-secondary-500"
                  aria-hidden={idx >= tickerItems.length}
                  tabIndex={idx >= tickerItems.length ? -1 : 0}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent-red shrink-0"
                    aria-hidden="true"
                  />
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
