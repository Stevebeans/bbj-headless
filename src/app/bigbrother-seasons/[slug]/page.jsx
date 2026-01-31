import { getSeasonBySlug, getAllSeasonSlugs } from "@/lib/api/seasons";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { SeasonHeader } from "./components/SeasonHeader";
import { PlayerGrid } from "./components/PlayerGrid";
import { LiveNowSection } from "./components/LiveNowSection";
import { Leaderboards } from "./components/Leaderboards";
import { SeasonJsonLd } from "./components/SeasonJsonLd";
import { SeasonInfoSidebar } from "./components/SeasonInfoSidebar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

// Allow dynamic rendering for seasons not pre-generated at build time
export const dynamicParams = true;

/**
 * Return empty array to build pages on-demand instead of at deploy time
 * This avoids rate limiting (429) errors during Vercel builds
 * Pages will be generated on first visit and cached
 */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { season } = await getSeasonBySlug(slug);

  if (!season) {
    return { title: "Season Not Found" };
  }

  const title = `${season.name} - Big Brother Junkies`;
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

export default async function SeasonPage({ params }) {
  const { slug } = await params;
  const { season, players, count } = await getSeasonBySlug(slug);

  if (!season) {
    notFound();
  }

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

  return (
    <>
      <SeasonJsonLd season={season} siteUrl={SITE_URL} />

      <main className="v2-primary-container">
        <div className="flex w-full flex-col mb-4 xl:flex-row xl:gap-4 dark:text-gray-200">
          {/* Main Content */}
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner">
              {/* Season Header */}
              <SeasonHeader season={season} playerCount={count} slug={slug} />

              <div className="p-4 space-y-6">
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
                <PlayerGrid
                  players={players}
                  seasonIsActive={season.is_active}
                />

                {/* Leaderboards (in main content for mobile/tablet, hidden on desktop) */}
                <div className="xl:hidden">
                  <Leaderboards stats={leaderboardStats} />
                </div>
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
          <Sidebar />
        </div>
      </main>
    </>
  );
}
