import { bbjdFetch } from "./wordpress";

/**
 * Defaults for when individual sections fail or are missing
 */
const DEFAULTS = {
  hero: { post: null, season: null },
  feedUpdates: { updates: [], total: 0 },
  houseboard: { season: null, houseboard: { hoh: [], pov: [], nominees: [], have_nots: [] } },
  seasonStats: { season: null, players: [] },
  recentComments: { comments: [], total: 0 },
  posts: { posts: [] },
};

/**
 * Get all homepage data in a single API call
 */
export async function getHomepageData() {
  try {
    const data = await bbjdFetch("/homepage", {
      tags: ["hero-post", "posts", "feed-updates", "houseboard", "players", "season-stats", "comments"],
      revalidate: false, // Webhook-driven via tags
    });

    return {
      hero: data.hero || DEFAULTS.hero,
      feedUpdates: data.feedUpdates || DEFAULTS.feedUpdates,
      houseboard: data.houseboard || DEFAULTS.houseboard,
      seasonStats: data.seasonStats || DEFAULTS.seasonStats,
      recentComments: data.recentComments || DEFAULTS.recentComments,
      posts: data.posts || DEFAULTS.posts,
    };
  } catch (error) {
    console.error("Failed to fetch homepage data:", error);
    return DEFAULTS;
  }
}

/**
 * Individual endpoints below are kept for non-homepage use (feed-updates page, etc.)
 */

export async function getHeroPost() {
  try {
    return await bbjdFetch("/hero-post", { tags: ["hero-post", "posts"] });
  } catch (error) {
    console.error("Failed to fetch hero post:", error);
    return DEFAULTS.hero;
  }
}

export async function getFeedUpdates(perPage = 15) {
  try {
    return await bbjdFetch(`/feed-updates?per_page=${perPage}`, { tags: ["feed-updates"] });
  } catch (error) {
    console.error("Failed to fetch feed updates:", error);
    return DEFAULTS.feedUpdates;
  }
}

export async function getHouseboard() {
  try {
    return await bbjdFetch("/houseboard", { tags: ["houseboard", "players"] });
  } catch (error) {
    console.error("Failed to fetch houseboard:", error);
    return DEFAULTS.houseboard;
  }
}

export async function getSeasonStats() {
  try {
    return await bbjdFetch("/season-stats", { tags: ["season-stats", "players"] });
  } catch (error) {
    console.error("Failed to fetch season stats:", error);
    return DEFAULTS.seasonStats;
  }
}

export async function getRecentComments(perPage = 5) {
  try {
    return await bbjdFetch(`/recent-comments?per_page=${perPage}`, { tags: ["comments"] });
  } catch (error) {
    console.error("Failed to fetch recent comments:", error);
    return DEFAULTS.recentComments;
  }
}
