import Link from "next/link";
import { FeedUpdateCard } from "./FeedUpdateCard";
import { SectionHeader } from "./SectionHeader";
import { FreestarSlot } from "@/components/ads/FreestarSlot";

const FEED_HUB = "/live-feed-updates";

export function FeedUpdatesSection({ updates = [] }) {
  if (!updates.length) {
    return (
      <section id="latest-feeds" className="v2-primary-container-inner p-5 md:p-[22px]" aria-labelledby="latest-feeds-heading">
        <SectionHeader id="latest-feeds-heading" href={FEED_HUB}>
          Latest from the Feeds
        </SectionHeader>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">No feed updates available.</div>
      </section>
    );
  }

  const batch1 = updates.slice(0, 4);    // cards 1–4
  const batch2 = updates.slice(4, 12);   // cards 5–12
  const batch3 = updates.slice(12);      // cards 13+

  return (
    <section id="latest-feeds" className="v2-primary-container-inner p-5 md:p-[22px]" aria-labelledby="latest-feeds-heading">
      <SectionHeader id="latest-feeds-heading" href={FEED_HUB}>
        Latest from the Feeds
      </SectionHeader>

      <div className="space-y-4 border-gray-200 dark:border-gray-700 pl-1 sm:pl-0">
        {batch1.map(update => (
          <FeedUpdateCard key={update.id} update={update} />
        ))}
      </div>

      {batch1.length === 4 && batch2.length > 0 && (
        <FreestarSlot
          placementName="bigbrotherjunkies_middle_feed"
          slotId="feed_inline_1"
          showBranding={false}
          className="my-4"
        />
      )}

      {batch2.length > 0 && (
        <div className="mt-4 space-y-4 border-gray-200 dark:border-gray-700 pl-1 sm:pl-0">
          {batch2.map(update => (
            <FeedUpdateCard key={update.id} update={update} />
          ))}
        </div>
      )}

      {batch1.length + batch2.length >= 12 && batch3.length > 0 && (
        <FreestarSlot
          placementName="bigbrotherjunkies_middle_feed"
          slotId="feed_inline_2"
          showBranding={false}
          className="my-4"
        />
      )}

      {batch3.length > 0 && (
        <div className="mt-4 space-y-4 border-gray-200 dark:border-gray-700 pl-1 sm:pl-0">
          {batch3.map(update => (
            <FeedUpdateCard key={update.id} update={update} />
          ))}
        </div>
      )}

      <p className="mt-4 text-right">
        <Link href={FEED_HUB} className="font-osw uppercase tracking-wider text-sm text-primary-500 dark:text-secondary-500 hover:underline">
          Click here to see more updates →
        </Link>
      </p>
    </section>
  );
}
