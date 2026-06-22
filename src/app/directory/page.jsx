import { Suspense } from "react";
import { getAllPlayers } from "@/lib/api/players";
import { getSeasons } from "@/lib/api/seasons";
import { PlayerDirectory } from "./components/PlayerDirectory";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { SITE_URL } from "@/lib/seo";

export const metadata = {
  title: "Big Brother Directory",
  description:
    "Browse Big Brother houseguests and seasons. Search and filter players by season, gender, and more.",
  alternates: {
    canonical: `${SITE_URL}/directory`,
  },
};

export const revalidate = false; // Pure webhook-driven via player/season tags

async function getInitialData() {
  const [playersData, seasonsData] = await Promise.all([
    getAllPlayers({ perPage: 50 }),
    getSeasons({ orderBy: "start_date" }),
  ]);

  return {
    players: playersData,
    seasons: seasonsData.seasons || [],
  };
}

export default async function PlayersPage() {
  const { players, seasons } = await getInitialData();

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org", "@type": "CollectionPage",
      name: "Big Brother Directory", url: `${SITE_URL}/directory`,
      description: "Browse every Big Brother houseguest and season.",
      isPartOf: { "@type": "WebSite", name: "Big Brother Junkies", url: `${SITE_URL}/` },
    }) }} />
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-slate-800 dark:text-white mb-2">
          Big Brother Directory
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Browse houseguests, seasons, and more from across the Big Brother franchise.
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
            <Suspense fallback={<DirectorySkeleton />}>
              <PlayerDirectory initialPlayers={players} seasons={seasons} />
            </Suspense>
          </div>

          {/* Bottom Ad */}
          <div className="mt-8">
            <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable" />
          </div>
        </div>

        {/* Sidebar */}
        <Sidebar showAds={true}>
          <SubscribeWidget />
        </Sidebar>
      </div>
    </div>
    </>
  );
}

function DirectorySkeleton() {
  return (
    <div className="space-y-6">
      {/* Tabs skeleton */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap gap-4">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}
