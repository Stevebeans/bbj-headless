import { Sidebar } from "@/components/layout/Sidebar";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { getHomepageData } from "@/lib/api/home";
import {
  Hero,
  FeedUpdatesSection,
  MoreStories,
  SocialFollow,
  Houseboard,
  WatchLiveFeeds,
  SeasonStats,
  RecentComments,
} from "@/components/home";

const isStaging = process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_SITE_URL?.includes("stg-");

export default async function HomePage() {
  const data = await getHomepageData();

  const heroPostId = data.hero.post?.id;
  const posts = data.posts.posts || [];

  return (
    <>
      {/* Main Content Area */}
      <main className="v2-primary-container">
        {isStaging && (
          <div className="mb-4 rounded-lg border border-secondary-500/30 bg-secondary-500/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
            <strong className="text-secondary-600 dark:text-secondary-400">Heads up!</strong>{" "}
            This is the staging server, so things may load slower than the real site. If something seems off, try refreshing a couple times to clear stale data. Performance won't be an issue on the live site.
          </div>
        )}
        <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
          {/* Main Left Column */}
          <section id="main-left" className="flex-grow space-y-4">
            {/* Hero Section */}
            {data.hero.post && (
              <Hero post={data.hero.post} season={data.hero.season} />
            )}

            {/* Top Ad */}
            <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable" />

            {/* Feed Updates - Full width */}
            <FeedUpdatesSection updates={data.feedUpdates.updates} />

            {/* Mid Ad */}
            <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable_Homepage2" />

            {/* More Stories */}
            <MoreStories posts={posts} heroId={heroPostId} />
          </section>

          {/* Right Sidebar */}
          <Sidebar sticky={false}>
            <Houseboard
              houseboard={data.houseboard.houseboard}
              seasonName={data.houseboard.season?.name}
            />
            <SocialFollow />
            <WatchLiveFeeds />
            <SeasonStats
              season={data.seasonStats.season}
              players={data.seasonStats.players}
            />
            <RecentComments comments={data.recentComments.comments} />
          </Sidebar>
        </div>
      </main>
    </>
  );
}
