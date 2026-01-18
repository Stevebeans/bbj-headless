import { getSeasonBySlug, getAllSeasonSlugs } from "@/lib/api/seasons";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { SeasonHeader } from "./components/SeasonHeader";
import { PlayerGrid } from "./components/PlayerGrid";
import { LiveNowSection } from "./components/LiveNowSection";
import { Leaderboards } from "./components/Leaderboards";
import { SeasonJsonLd } from "./components/SeasonJsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export async function generateStaticParams() {
  const slugs = await getAllSeasonSlugs();
  return slugs.map((slug) => ({ slug }));
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
      url: `${SITE_URL}/seasons/${slug}`,
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
      canonical: `${SITE_URL}/seasons/${slug}`,
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
        <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
          {/* Main Content */}
          <section id="season-main-left" className="flex-grow space-y-4">
            {/* Season Header */}
            <SeasonHeader season={season} playerCount={count} />

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
          </section>

          {/* Sidebar */}
          <section id="season-main-right" className="w-full lg:w-80 lg:shrink-0 space-y-4">
            {/* Season Info */}
            <div className="v2-primary-container-inner p-4 rounded-lg">
              <h2 className="v2-primary-subheader">
                Season {season.season_number} Info
              </h2>
              <table className="w-full mt-3">
                <tbody>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="text-sm p-2 font-semibold">Name:</td>
                    <td className="text-sm p-2">{season.name}</td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="text-sm p-2 font-semibold">Start:</td>
                    <td className="text-sm p-2">
                      {season.start_date
                        ? new Date(season.start_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBD"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <td className="text-sm p-2 font-semibold">End:</td>
                    <td className="text-sm p-2">
                      {season.end_date
                        ? new Date(season.end_date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "TBD"}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-sm p-2 font-semibold">Length:</td>
                    <td className="text-sm p-2">{season.total_days} days</td>
                  </tr>
                </tbody>
              </table>

              {/* Season Progress */}
              {season.total_days > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Season Progress</span>
                    <span>
                      Day {season.days_elapsed}/{season.total_days} ({season.progress_pct}%)
                    </span>
                  </div>
                  <div
                    className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={season.progress_pct}
                  >
                    <div
                      className="h-full rounded-full bg-accent-red transition-all"
                      style={{ width: `${season.progress_pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Leaderboards */}
            <Leaderboards stats={leaderboardStats} />

            {/* Standard Sidebar */}
            <Sidebar />
          </section>
        </div>
      </main>
    </>
  );
}
