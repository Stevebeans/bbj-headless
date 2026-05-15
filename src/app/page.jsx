import { Sidebar } from "@/components/layout/Sidebar";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { getHomepageData } from "@/lib/api/home";
import {
  Hero,
  FeedUpdatesSection,
  MoreStories,
  SeasonStats,
  RecentComments,
  HouseStrip,
  HousePulse,
} from "@/components/home";

const isStaging = process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_SITE_URL?.includes("stg-");

export default async function HomePage() {
  const data = await getHomepageData();

  const heroPostId = data.hero.post?.id;
  const posts = data.posts.posts || [];

  return (
    <>
      <SpoilerBarWrapper />
      <main className="v2-primary-container">
        {isStaging && (
          <div className="mb-4 rounded-lg border border-secondary-500/30 bg-secondary-500/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
            <strong className="text-secondary-600 dark:text-secondary-400">Heads up!</strong>{" "}
            This is the staging server, so things may load slower than the real site. If something seems off, try refreshing a couple times to clear stale data. Performance won't be an issue on the live site.
          </div>
        )}
        <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
          <section id="main-left" className="flex-grow space-y-4">
            {data.hero.post && (
              <Hero post={data.hero.post} season={data.currentSeason} />
            )}

            <HouseStrip
              houseboard={data.houseboard.houseboard}
              season={data.houseboard.season}
            />

            <HousePulse housePulse={data.housePulse} />

            <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable" />

            <FeedUpdatesSection updates={data.feedUpdates.updates} />

            <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable_Homepage2" />

            <MoreStories posts={posts} heroId={heroPostId} />
          </section>

          <Sidebar sticky={false}>
            <SeasonStats
              season={data.seasonStats.season}
              players={data.seasonStats.players}
            />
            <SubscribeWidget />
            <RecentComments comments={data.recentComments.comments} />
          </Sidebar>
        </div>
      </main>
    </>
  );
}
