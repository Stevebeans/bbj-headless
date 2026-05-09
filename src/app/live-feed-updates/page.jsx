import { Suspense } from "react";
import { FeedUpdatesArchive } from "@/components/feed-updates/FeedUpdatesArchive";
import { getFeedUpdates } from "@/lib/api/feedUpdates";
import { getHouseboard } from "@/lib/api/home";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import {
  Houseboard,
  SocialFollow,
  WatchLiveFeeds,
} from "@/components/home";

export const metadata = {
  title: "Live Feed Updates",
  description:
    "All Big Brother live feed updates and show updates. Stay up to date with what's happening in the house.",
};

export const revalidate = false; // Webhook-driven — fires on new feed update via revalidatePath
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export default async function FeedUpdatesPage() {
  // Fetch default data server-side (page 1, newest, no filters)
  // Client component handles all subsequent filtering/pagination/search
  const [initialData, houseboardData] = await Promise.all([
    getFeedUpdates({ page: 1, perPage: 20, sort: "newest", dateRange: "all" }),
    getHouseboard(),
  ]);

  return (
    <>
      <SpoilerBarWrapper />
      <main className="v2-primary-container">
      <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
        {/* Main Content */}
        <section id="main-left" className="flex-grow space-y-4">
          <h1 className="section-header">Live Feed Updates</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time updates from the Big Brother live feeds and show episodes. Vote on your
            favorites and join the discussion.
          </p>

          <Suspense
            fallback={
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }
          >
            <FeedUpdatesArchive initialData={initialData} />
          </Suspense>
        </section>

        {/* Right Sidebar */}
        <Sidebar sticky={true} showAds={true}>
          <Houseboard
            houseboard={houseboardData.houseboard}
            seasonName={houseboardData.season?.name}
          />
          <SocialFollow />
          <WatchLiveFeeds />
          <SubscribeWidget />
        </Sidebar>
      </div>
    </main>
    </>
  );
}
