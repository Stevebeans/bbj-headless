import { getSeasonBySlug, getSeasonArticles } from "@/lib/api/seasons";
import { bbjdFetch } from "@/lib/api/wordpress";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import {
  SeasonHeader,
  PlayerGrid,
  LiveNowSection,
  Leaderboards,
  SeasonJsonLd,
  SeasonJumpNav,
  SeasonOverview,
  WinnerSpotlight,
  EvictionOrder,
  SeasonArticles,
  SeasonFeedUpdates,
  SeasonFAQ,
  SeasonFAQSchema,
} from "./components";
import { SeasonInfoSidebar } from "./components/SeasonInfoSidebar";
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const revalidate = false; // Pure webhook-driven — rebuild only when WP fires /api/revalidate
export const dynamicParams = true;

export async function generateStaticParams() {
  return []; // No pre-rendering — season pages ISR-cache on first visit
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { season } = await getSeasonBySlug(slug);

  if (!season) {
    return { title: "Season Not Found" };
  }

  const title = `${season.name} - Cast, Spoilers, Eviction Order | Big Brother Junkies`;
  const description = `Complete guide to ${season.name}: cast, spoilers, competition results, and live feed updates.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/bigbrother-seasons/${slug}`,
      type: "website",
      images: season.cover_image
        ? [
            {
              url: season.cover_image,
              width: 1200,
              height: 630,
              alt: season.name,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: season.cover_image ? [season.cover_image] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/bigbrother-seasons/${slug}`,
    },
  };
}

function generateFAQs(season, players) {
  const faqs = [];
  const abbr = season.abbreviation || season.name;

  if (season.status === "completed") {
    if (season.winner) {
      faqs.push({
        question: `Who won ${season.name}?`,
        answer: `${season.winner.name} won ${season.name}${
          season.runner_up
            ? `, defeating ${season.runner_up.name} in the final jury vote`
            : ""
        }${
          season.end_date
            ? ` on ${new Date(season.end_date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}`
            : ""
        }.`,
      });
    }
    if (season.afp) {
      faqs.push({
        question: `Who was America's Favorite Player on ${abbr}?`,
        answer: `${season.afp.name} was voted America's Favorite Player on ${season.name}.`,
      });
    }
  }

  if (season.start_date && season.end_date) {
    const start = new Date(season.start_date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const end = new Date(season.end_date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    faqs.push({
      question: `When did ${season.name} air?`,
      answer: `${season.name} premiered on ${start} and concluded on ${end}, lasting ${season.total_days} days.`,
    });
  }

  if (players.length > 0) {
    faqs.push({
      question: `How many houseguests were on ${abbr}?`,
      answer: `${season.name} featured ${players.length} houseguests.`,
    });
  }

  if (season.status === "upcoming") {
    if (season.start_date) {
      faqs.push({
        question: `When does ${season.name} start?`,
        answer: `${season.name} is scheduled to premiere on ${new Date(
          season.start_date
        ).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}.`,
      });
    }
    faqs.push({
      question: `How to watch ${season.name}?`,
      answer: `${season.name} airs on CBS and is available for streaming on Paramount+. Live feeds are available through Paramount+ with the Live Feeds add-on.`,
    });
  }

  return faqs;
}

export default async function SeasonPage({ params }) {
  const { slug } = await params;
  const { season, players, count, category_id, article_count } =
    await getSeasonBySlug(slug);

  if (!season) {
    notFound();
  }

  // Fetch articles and feed updates in parallel
  const feedParams = season.start_date && season.end_date
    ? new URLSearchParams({ after: season.start_date, before: season.end_date, per_page: "5" })
    : null;

  const [{ posts: articles }, feedData] = await Promise.all([
    category_id ? getSeasonArticles(category_id) : Promise.resolve({ posts: [] }),
    feedParams
      ? bbjdFetch(`/feed-updates?${feedParams.toString()}`, { tags: ["feed-updates"], revalidate: false }).catch(() => null)
      : Promise.resolve(null),
  ]);
  const feedUpdates = feedData?.updates || feedData?.feed_updates || [];

  // Separate players by status for different sections
  const activePlayers = players.filter(
    (p) => p.game_status && !p.game_status.evicted && !p.game_status.jury
  );
  const juryPlayers = players.filter(
    (p) => p.game_status?.jury && !p.game_status?.evicted
  );
  const evictedPlayers = players.filter(
    (p) => p.game_status?.evicted && !p.game_status?.jury
  );

  // Get current HoH, PoV, nominees for Live Now section
  const currentHoH = players.find((p) => p.game_status?.hoh);
  const currentPoV = players.find((p) => p.game_status?.pov);
  const nominees = players.filter((p) => p.game_status?.nom);

  // Leaderboard data
  const leaderboardStats = {
    hoh: [...players]
      .filter((p) => p.stats.hoh > 0)
      .sort((a, b) => b.stats.hoh - a.stats.hoh)
      .slice(0, 5),
    pov: [...players]
      .filter((p) => p.stats.pov > 0)
      .sort((a, b) => b.stats.pov - a.stats.pov)
      .slice(0, 5),
    nom: [...players]
      .filter((p) => p.stats.nom > 0)
      .sort((a, b) => b.stats.nom - a.stats.nom)
      .slice(0, 5),
    votes: [...players]
      .filter((p) => p.stats.votes_received > 0)
      .sort((a, b) => b.stats.votes_received - a.stats.votes_received)
      .slice(0, 5),
  };

  // Generate FAQ data
  const faqs = generateFAQs(season, players);

  return (
    <>
      <SeasonJsonLd season={season} siteUrl={SITE_URL} />
      {faqs.length > 0 && <SeasonFAQSchema questions={faqs} />}
      <SpoilerBarWrapper />

      <main className="v2-primary-container">
        <div className="flex w-full flex-col mb-4 xl:flex-row xl:gap-4 dark:text-gray-200">
          {/* Main Content */}
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner">
              {/* Season Header */}
              <SeasonHeader
                season={season}
                playerCount={count}
                slug={slug}
              />

              <div className="p-4 space-y-6">
                {/* Jump Nav */}
                <SeasonJumpNav articleCount={article_count} />

                {/* Season Overview */}
                <SeasonOverview season={season} playerCount={count} />

                {/* Winner Spotlight */}
                <WinnerSpotlight season={season} players={players} />

                {/* Live Now Section (only for active seasons) */}
                {season.is_active && (
                  <LiveNowSection
                    hoh={currentHoH}
                    pov={currentPoV}
                    nominees={nominees}
                    juryCount={juryPlayers.length}
                    evictedCount={evictedPlayers.length}
                    season={season}
                  />
                )}

                {/* Player Grid */}
                <div id="cast">
                  <PlayerGrid
                    players={players}
                    seasonIsActive={season.is_active}
                  />
                </div>

                {/* Ad between cast and eviction order */}
                <AdPlaceholder slot="season_hub_mid" />

                {/* Eviction Order */}
                <EvictionOrder players={players} season={season} />

                {/* Leaderboards (in main content for mobile/tablet, hidden on desktop) */}
                <div className="xl:hidden">
                  <Leaderboards stats={leaderboardStats} />
                </div>

                {/* Season Articles */}
                <SeasonArticles
                  posts={articles}
                  totalCount={article_count}
                  seasonSlug={slug}
                />

                {/* Season Feed Updates */}
                <SeasonFeedUpdates updates={feedUpdates} seasonSlug={slug} />

                {/* FAQ */}
                {faqs.length > 0 && <SeasonFAQ questions={faqs} />}
              </div>
            </article>
          </section>

          {/* Season Info Sidebar (middle column) */}
          <SeasonInfoSidebar
            season={season}
            juryCount={juryPlayers.length}
            evictedCount={evictedPlayers.length}
            leaderboardStats={leaderboardStats}
          />

          {/* Site Sidebar (right column) */}
          <Sidebar>
            <SubscribeWidget />
          </Sidebar>
        </div>
      </main>
    </>
  );
}
