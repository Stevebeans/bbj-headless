import { notFound, redirect } from "next/navigation";
import { getPlayerBySlug } from "@/lib/api/players";
import { Sidebar } from "@/components/layout/Sidebar";
import { ComparisonHero } from "./components/ComparisonHero";
import { ComparisonStats } from "./components/ComparisonStats";
import { ComparisonAwards } from "./components/ComparisonAwards";
import { ComparisonHeadToHead } from "./components/ComparisonHeadToHead";
import { ComparisonTimeline } from "./components/ComparisonTimeline";
import { ComparisonJsonLd } from "./components/ComparisonJsonLd";
import { PremiumGate } from "@/components/shared/PremiumGate";
import { SuggestedComparisons } from "./components/SuggestedComparisons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const revalidate = 3600; // 1 hour — player stats change rarely
export const dynamicParams = true;

export async function generateStaticParams() {
  return []; // Comparisons are user-generated — ISR-cache on first hit
}

/**
 * Parse matchup param into two slugs.
 * Returns null if the format is invalid.
 */
function parseMatchup(matchup) {
  const decoded = decodeURIComponent(matchup);
  const parts = decoded.split("-vs-");
  if (parts.length !== 2) return null;

  const slug1 = parts[0].trim();
  const slug2 = parts[1].trim();

  if (!slug1 || !slug2) return null;
  return { slug1, slug2 };
}

/**
 * Generate SEO metadata for comparison page
 */
export async function generateMetadata({ params }) {
  const { matchup } = await params;
  const parsed = parseMatchup(matchup);

  if (!parsed) return { title: "Player Comparison Not Found" };

  const [data1, data2] = await Promise.all([
    getPlayerBySlug(parsed.slug1),
    getPlayerBySlug(parsed.slug2),
  ]);

  if (!data1?.player || !data2?.player) {
    return { title: "Player Comparison Not Found" };
  }

  const p1 = data1.player;
  const p2 = data2.player;

  const title = `${p1.name} vs ${p2.name} - Big Brother Player Comparison`;
  const description = `Head-to-head comparison: ${p1.name} (${p1.stats?.total_hoh || 0} HoH, ${p1.stats?.total_pov || 0} PoV, ${p1.stats?.total_seasons || 0} seasons) vs ${p2.name} (${p2.stats?.total_hoh || 0} HoH, ${p2.stats?.total_pov || 0} PoV, ${p2.stats?.total_seasons || 0} seasons).`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/compare/${parsed.slug1}-vs-${parsed.slug2}`,
      type: "website",
      images: p1.photo?.url
        ? [{ url: p1.photo.url, width: 375, height: 375, alt: `${p1.name} vs ${p2.name}` }]
        : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/compare/${parsed.slug1}-vs-${parsed.slug2}`,
    },
  };
}

/**
 * Player Comparison Page
 */
export default async function ComparisonPage({ params }) {
  const { matchup } = await params;
  const parsed = parseMatchup(matchup);

  if (!parsed) notFound();

  const { slug1, slug2 } = parsed;

  // Same player → redirect to their profile
  if (slug1 === slug2) {
    redirect(`/bigbrother-players/${slug1}`);
  }

  // Canonical ordering: alphabetical. If not canonical, redirect.
  if (slug1 > slug2) {
    redirect(`/compare/${slug2}-vs-${slug1}`);
  }

  // Fetch both players in parallel
  const [data1, data2] = await Promise.all([
    getPlayerBySlug(slug1),
    getPlayerBySlug(slug2),
  ]);

  if (!data1?.player || !data2?.player) notFound();

  const player1 = data1.player;
  const player2 = data2.player;

  // Find shared seasons
  const p1SeasonIds = new Set(player1.seasons?.map((s) => s.season_id) || []);
  const sharedSeasons = (player2.seasons || []).filter((s) => p1SeasonIds.has(s.season_id));

  return (
    <>
      <ComparisonJsonLd player1={player1} player2={player2} siteUrl={SITE_URL} />

      <main className="v2-primary-container">
        <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
          {/* Main Content */}
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner">
              {/* Hero — always visible */}
              <ComparisonHero player1={player1} player2={player2} />

              {/* Gated content */}
              <div className="p-4 space-y-6">
                <PremiumGate title="Unlock Player Comparisons" description="Get full head-to-head stats with a premium membership">
                  <div className="space-y-6">
                    <ComparisonStats player1={player1} player2={player2} />

                    <ComparisonAwards player1={player1} player2={player2} />

                    {sharedSeasons.length > 0 && (
                      <ComparisonHeadToHead
                        player1={player1}
                        player2={player2}
                        sharedSeasonIds={sharedSeasons.map((s) => s.season_id)}
                      />
                    )}

                    <ComparisonTimeline player1={player1} player2={player2} />
                  </div>
                </PremiumGate>

                {/* Suggested comparisons — not gated */}
                <SuggestedComparisons
                  player1={player1}
                  player2={player2}
                  relatedPlayers1={data1.related_players}
                  relatedPlayers2={data2.related_players}
                />
              </div>
            </article>
          </section>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </main>
    </>
  );
}
