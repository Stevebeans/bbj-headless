import { Sidebar } from "@/components/layout/Sidebar";
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { getPosts } from "@/lib/api/posts";
import { getHeroPost, getFeedUpdates, getHouseboard, getSeasonStats, getRecentComments } from "@/lib/api/home";
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
  // Fetch all data in parallel
  let heroData = { post: null, season: null };
  let feedUpdatesData = { updates: [], total: 0 };
  let houseboardData = { season: null, houseboard: null };
  let statsData = { season: null, players: [] };
  let recentCommentsData = { comments: [], total: 0 };
  let posts = [];

  try {
    const results = await Promise.all([
      getHeroPost(),
      getFeedUpdates(15),
      getHouseboard(),
      getSeasonStats(),
      getRecentComments(5),
      getPosts({ limit: 10 }),
    ]);

    heroData = results[0];
    feedUpdatesData = results[1];
    houseboardData = results[2];
    statsData = results[3];
    recentCommentsData = results[4];
    posts = results[5];
  } catch (error) {
    console.error("Failed to fetch homepage data:", error);
  }

  const heroPostId = heroData.post?.id;

  return (
    <>
      {/* Main Content Area */}
      <main className="v2-primary-container">
        <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
          {/* Main Left Column */}
          <section id="main-left" className="flex-grow space-y-4">
            {/* Hero Section */}
            {heroData.post && (
              <Hero post={heroData.post} season={heroData.season} />
            )}

            {/* Top Ad */}
            <AdPlaceholder slot="index_top" minHeight="100px" />

            {/* Feed Updates - Full width */}
            <FeedUpdatesSection updates={feedUpdatesData.updates} />

            {/* Mid Ad */}
            <AdPlaceholder slot="index_mid" minHeight="100px" />

            {/* More Stories */}
            <MoreStories posts={posts} heroId={heroPostId} />
          </section>

          {/* Right Sidebar */}
          <Sidebar sticky={false}>
            <Houseboard
              houseboard={houseboardData.houseboard}
              seasonName={houseboardData.season?.name}
            />
            <SocialFollow />
            <WatchLiveFeeds />
            <SeasonStats
              season={statsData.season}
              players={statsData.players}
            />
            <RecentComments comments={recentCommentsData.comments} />
          </Sidebar>
        </div>
      </main>
    </>
  );
}
