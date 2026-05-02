import { notFound } from "next/navigation";
import { getPlayerBySlug } from "@/lib/api/players";
import { Sidebar } from "@/components/layout/Sidebar";
import { CommentSection } from "@/components/comments";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
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
import { SuggestedPlayerComparisons } from "./components/SuggestedPlayerComparisons";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

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
  const title = `${player.name} - Big Brother Player Profile`;
  const description = `${player.name}${player.nickname ? ` "${player.nickname}"` : ""} - ${player.occupation || "Big Brother houseguest"}. Career stats: ${player.stats?.total_hoh || 0} HoH wins, ${player.stats?.total_pov || 0} PoV wins across ${player.stats?.total_seasons || 0} season(s).`;

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
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: player.photo?.url ? [player.photo.url] : [],
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

  return (
    <>
      <PlayerJsonLd player={player} siteUrl={SITE_URL} />

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

                {/* Before Content Ad */}
                <FreestarSlot placementName="bigbrotherjunkies_leaderboard_atf" />

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

                {/* Suggested Comparisons */}
                {related_players?.length > 0 && (
                  <SuggestedPlayerComparisons player={player} relatedPlayers={related_players} />
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
          <Sidebar />
        </div>
      </main>
    </>
  );
}
