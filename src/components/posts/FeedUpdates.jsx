import Image from "next/image";
import Link from "next/link";
import { FreestarSlot } from "@/components/ads/FreestarSlot";

// Insert an ad every X updates
const AD_INTERVAL = 5;

/**
 * Feed Updates component for blog posts
 * Displays live feed updates from the post's publish date
 */
export function FeedUpdates({ updates = [], dateFormatted, total = 0 }) {
  if (!updates.length) {
    return (
      <div className="feed-updates">
        <div className="text-lg font-bold">
          Live Feed Updates For {dateFormatted}
        </div>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No updates found for this date.
        </div>
        <div className="end-feed-updates">
          If you would like to see more feed updates,{" "}
          <Link
            href="/feed-updates"
            className="text-blue-600 dark:text-blue-400 font-bold underline hover:no-underline"
          >
            Visit our feed update page here
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-updates">
      <div className="text-lg font-bold">
        Live Feed Updates For {dateFormatted}
      </div>

      {updates.map((update, index) => {
        const position = index + 1;
        const showAd = position % AD_INTERVAL === 0 && position < updates.length;

        return (
          <div key={update.id}>
            <div className="my-4 p-1 border-l-8 border-gray-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-t border-b rounded-md">
              <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {update.time}
                  {update.time_ago && (
                    <span className="ml-1 text-gray-400 dark:text-gray-500">
                      ({update.time_ago})
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  By: {update.author?.name || "Unknown"}
                </div>
              </div>

              {update.title && (
                <div className="font-semibold text-gray-800 dark:text-gray-200 mt-1">
                  {update.title}
                </div>
              )}

              {update.thumbnail && (
                <div className="text-center my-2">
                  <Image
                    src={update.thumbnail}
                    alt={update.title || "Feed update image"}
                    width={600}
                    height={400}
                    className="mx-auto rounded-lg"
                    style={{ width: "auto", height: "auto", maxWidth: "100%" }}
                  />
                </div>
              )}

              {update.content && (
                <div
                  className="text-gray-700 dark:text-gray-300 prose dark:prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: update.content }}
                />
              )}
            </div>

            {/* Insert ad after every X updates */}
            {showAd && (
              <div className="my-4">
                <FreestarSlot
                  placementName="bigbrotherjunkies_middle_feed"
                  slotId={`bigbrotherjunkies_middle_feed_${Math.ceil(position / AD_INTERVAL)}`}
                  showBranding={false}
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="end-feed-updates">
        If you would like to see more feed updates,{" "}
        <Link
          href="/feed-updates"
          className="text-blue-600 dark:text-blue-400 font-bold underline hover:no-underline"
        >
          Visit our feed update page here
        </Link>
      </div>
    </div>
  );
}
