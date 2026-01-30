import { Suspense } from "react";
import { FeedUpdatesArchive } from "@/components/feed-updates/FeedUpdatesArchive";
import { getFeedUpdates } from "@/lib/api/feedUpdates";

export const metadata = {
  title: "Live Feed Updates",
  description:
    "All Big Brother live feed updates and show updates. Stay up to date with what's happening in the house.",
};

export const revalidate = 60;
export const dynamicParams = true;

async function FeedUpdatesContent({ searchParams }) {
  // Await searchParams for Next.js 15
  const params = await searchParams;

  // Fetch initial data server-side
  const initialData = await getFeedUpdates({
    page: params?.page || 1,
    perPage: 20,
    sort: params?.sort || "newest",
    dateRange: params?.date_range || "all",
    mode: params?.mode || undefined,
    search: params?.search || undefined,
  });

  return <FeedUpdatesArchive initialData={initialData} />;
}

export default function FeedUpdatesPage({ searchParams }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="section-header mb-6">Live Feed Updates</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Real-time updates from the Big Brother live feeds and show episodes. Vote on your
        favorites and join the discussion.
      </p>

      <Suspense
        fallback={
          <div className="space-y-4">
            {/* Loading skeleton */}
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
        <FeedUpdatesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
