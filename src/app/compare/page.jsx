import { notFound, redirect } from "next/navigation";
import { getPlayerBySlug } from "@/lib/api/players";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { ComparisonHero } from "./components/ComparisonHero";
import { ComparisonStats } from "./components/ComparisonStats";
import { ComparisonAwards } from "./components/ComparisonAwards";
import { ComparisonHeadToHead } from "./components/ComparisonHeadToHead";
import { ComparisonTimeline } from "./components/ComparisonTimeline";
import { ComparisonJsonLd } from "./components/ComparisonJsonLd";
import { PremiumGate } from "@/components/shared/PremiumGate";
import { SuggestedComparisons } from "./components/SuggestedComparisons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const slug1 = (sp?.p1 || "").trim();
  const slug2 = (sp?.p2 || "").trim();

  if (!slug1 || !slug2) {
    return { title: "Player Comparison", robots: { index: false, follow: false } };
  }

  const [data1, data2] = await Promise.all([getPlayerBySlug(slug1), getPlayerBySlug(slug2)]);

  if (!data1?.player || !data2?.player) {
    return { title: "Player Comparison Not Found", robots: { index: false, follow: false } };
  }

  const p1 = data1.player;
  const p2 = data2.player;

  const title = `${p1.name} vs ${p2.name} - Big Brother Player Comparison`;
  const description = `Head-to-head comparison: ${p1.name} (${p1.stats?.total_hoh || 0} HoH, ${p1.stats?.total_pov || 0} PoV, ${p1.stats?.total_seasons || 0} seasons) vs ${p2.name} (${p2.stats?.total_hoh || 0} HoH, ${p2.stats?.total_pov || 0} PoV, ${p2.stats?.total_seasons || 0} seasons).`;

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/compare?p1=${p1.slug}&p2=${p2.slug}`,
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
      canonical: `${SITE_URL}/compare?p1=${p1.slug}&p2=${p2.slug}`,
    },
  };
}

export default async function ComparisonPage({ searchParams }) {
  const sp = await searchParams;
  const slug1 = (sp?.p1 || "").trim();
  const slug2 = (sp?.p2 || "").trim();

  if (!slug1 || !slug2) notFound();

  if (slug1 === slug2) {
    redirect(`/bigbrother-players/${slug1}`);
  }

  // Canonical ordering: alphabetical, redirect to canonical form
  if (slug1 > slug2) {
    redirect(`/compare?p1=${slug2}&p2=${slug1}`);
  }

  const [data1, data2] = await Promise.all([
    getPlayerBySlug(slug1),
    getPlayerBySlug(slug2),
  ]);

  if (!data1?.player || !data2?.player) notFound();

  const player1 = data1.player;
  const player2 = data2.player;

  const p1SeasonIds = new Set(player1.seasons?.map((s) => s.season_id) || []);
  const sharedSeasons = (player2.seasons || []).filter((s) => p1SeasonIds.has(s.season_id));

  return (
    <>
      <ComparisonJsonLd player1={player1} player2={player2} siteUrl={SITE_URL} />

      <main className="v2-primary-container">
        <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner">
              <ComparisonHero player1={player1} player2={player2} />

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

                <SuggestedComparisons
                  player1={player1}
                  player2={player2}
                  relatedPlayers1={data1.related_players}
                  relatedPlayers2={data2.related_players}
                />
              </div>
            </article>
          </section>

          <Sidebar>
            <SubscribeWidget />
          </Sidebar>
        </div>
      </main>
    </>
  );
}
