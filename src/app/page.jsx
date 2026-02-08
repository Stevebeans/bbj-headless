import { Sidebar } from "@/components/layout/Sidebar";
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
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

export default async function HomePage() {
  const data = await getHomepageData();

  const heroPostId = data.hero.post?.id;
  const posts = data.posts.posts || [];

  return (
    <>
      {/* Main Content Area */}
      <main className="v2-primary-container">
        <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
          {/* Main Left Column */}
          <section id="main-left" className="flex-grow space-y-4">
            {/* Hero Section */}
            {data.hero.post && (
              <Hero post={data.hero.post} season={data.hero.season} />
            )}

            {/* Top Ad */}
            <AdPlaceholder slot="index_top" minHeight="100px" />

            {/* Feed Updates - Full width */}
            <FeedUpdatesSection updates={data.feedUpdates.updates} />

            {/* Mid Ad */}
            <AdPlaceholder slot="index_mid" minHeight="100px" />

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
