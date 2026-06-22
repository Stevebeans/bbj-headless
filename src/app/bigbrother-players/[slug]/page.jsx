import { notFound } from "next/navigation";
import { getPlayerBySlug } from "@/lib/api/players";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import { CommentSection } from "@/components/comments";
import { RelatedPosts } from "@/components/posts/RelatedPosts";
import { PlayerEditButton } from "@/components/admin";
import {
  PlayerHero,
  PlayerMeta,
  PlayerBadges,
  PlayerStats,
  PlayerSocial,
  PlayerSeasons,
  PlayerBio,
  PlayerJsonLd,
  RelatedPlayers,
  CompareButton,
} from "@/components/players";
import { ORG_LOGO, breadcrumbJsonLd } from "@/lib/seo";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

/**
 * Accurate career comp totals. The aggregate `stats.total_hoh/pov` are stale for
 * hand-entered seasons (BB23–25), so prefer the per-season weekly junction
 * (`weekly_timeline.cells`, the same source as the season page) and fall back to
 * the per-season flat counts, then aggregate stats only if there's no season data.
 */
function derivePlayerTotals(player) {
  const seasons = player.seasons || [];
  if (seasons.length === 0) {
    return {
      hoh: player.stats?.total_hoh || 0,
      pov: player.stats?.total_pov || 0,
      seasons: player.stats?.total_seasons || 0,
    };
  }
  let hoh = 0;
  let pov = 0;
  for (const s of seasons) {
    const cells = s.weekly_timeline?.tracked ? s.weekly_timeline.cells : null;
    hoh += cells ? cells.hoh?.length || 0 : Number(s.hoh) || 0;
    pov += cells ? cells.pov?.length || 0 : Number(s.pov) || 0;
  }
  return { hoh, pov, seasons: player.stats?.total_seasons || seasons.length };
}

export const revalidate = false; // Pure webhook-driven — rebuild only when WP fires /api/revalidate
export const dynamicParams = true;

export async function generateStaticParams() {
  return []; // No pre-rendering — player pages ISR-cache on first visit
}

/**
 * Generate SEO metadata for player page
 */
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await getPlayerBySlug(slug);

  if (!data?.player) {
    return { title: "Player Not Found" };
  }

  const { player } = data;
  const totals = derivePlayerTotals(player);
  const title = `${player.name} - Big Brother Player Profile`;
  const description = `${player.name}${player.nickname ? ` "${player.nickname}"` : ""} - ${player.occupation || "Big Brother houseguest"}. Career stats: ${totals.hoh} HoH wins, ${totals.pov} PoV wins across ${totals.seasons} season(s).`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/bigbrother-players/${slug}`,
      type: "profile",
      images: player.photo?.url
        ? [
            {
              url: player.photo.url,
              width: player.photo.width || 375,
              height: player.photo.height || 375,
              alt: `${player.name} profile picture`,
            },
          ]
        : [{ url: ORG_LOGO }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: player.photo?.url ? [player.photo.url] : [ORG_LOGO],
    },
    alternates: {
      canonical: `${SITE_URL}/bigbrother-players/${slug}`,
    },
  };
}

/**
 * Player Profile Page
 */
export default async function PlayerPage({ params }) {
  const { slug } = await params;
  const data = await getPlayerBySlug(slug);

  if (!data?.player) {
    notFound();
  }

  const { player, related_posts, related_players } = data;

  // Check if player has any awards
  const hasAwards = player.awards?.winner || player.awards?.runner_up || player.awards?.afp;

  // Check if player has social links
  const hasSocial =
    player.social?.twitter ||
    player.social?.instagram ||
    player.social?.facebook ||
    player.social?.tiktok;

  const breadcrumb = {
    "@context": "https://schema.org",
    ...breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Players", path: "/directory" },
      { name: player.name, path: `/bigbrother-players/${slug}` },
    ]),
  };

  return (
    <>
      <PlayerJsonLd player={player} siteUrl={SITE_URL} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <SpoilerBarWrapper />

      <main className="v2-primary-container">
        <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
          {/* Main Content */}
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner">
              {/* Hero: Photo, Name, Nickname */}
              <PlayerHero player={player} />

              {/* Meta: Breadcrumbs, Location, Occupation, Age */}
              <PlayerMeta player={player} slug={slug} />

              <div className="p-4 space-y-6">
                {/* Admin Edit + Compare Buttons */}
                <div className="flex justify-end gap-2">
                  <CompareButton player={player} />
                  <PlayerEditButton slug={slug} />
                </div>

                {/* Award Badges */}
                {hasAwards && <PlayerBadges awards={player.awards} />}

                {/* Career Statistics */}
                <section>
                  <h2 className="v2-primary-subheader mb-3">Career Statistics</h2>
                  <PlayerStats stats={player.stats} />
                </section>

                {/* Social Links */}
                {hasSocial && <PlayerSocial player={player} />}

                {/* Season Breakdown */}
                {player.seasons?.length > 0 && (
                  <section>
                    <h2 className="v2-primary-subheader mb-3">Season History</h2>
                    <PlayerSeasons seasons={player.seasons} />
                  </section>
                )}

                {/* Bio Content */}
                {player.bio && (
                  <section>
                    <h2 className="v2-primary-subheader mb-3">
                      About {player.first_name || player.name}
                    </h2>
                    <PlayerBio content={player.bio} />
                  </section>
                )}

                {/* Related Players (Castmates) */}
                {related_players?.length > 0 && (
                  <section>
                    <h2 className="v2-primary-subheader mb-3">Castmates</h2>
                    <RelatedPlayers seasons={related_players} currentPlayerSlug={slug} />
                  </section>
                )}

                {/* Related Posts */}
                {related_posts?.length > 0 && (
                  <section>
                    <h2 className="v2-primary-subheader mb-3">
                      Articles About {player.first_name || player.name}
                    </h2>
                    <RelatedPosts posts={related_posts} />
                  </section>
                )}
              </div>
            </article>

            {/* Comments Section */}
            <section className="v2-primary-container-inner p-4">
              <CommentSection postId={player.id} initialCommentCount={player.comment_count || 0} />
            </section>
          </section>

          {/* Sidebar */}
          <Sidebar>
            <SubscribeWidget />
          </Sidebar>
        </div>
      </main>
    </>
  );
}
