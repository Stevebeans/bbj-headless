import { bbjdFetch } from "./wordpress";

/**
 * Get hero/featured post
 */
export async function getHeroPost() {
  try {
    const response = await bbjdFetch("/hero-post", {
      tags: ["hero-post", "posts"],
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch hero post:", error);
    return { post: null, season: null };
  }
}

/**
 * Get feed updates
 */
export async function getFeedUpdates(perPage = 15) {
  try {
    const response = await bbjdFetch(`/feed-updates?per_page=${perPage}`, {
      tags: ["feed-updates"],
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch feed updates:", error);
    return { updates: [], total: 0 };
  }
}

/**
 * Get houseboard data (HoH, PoV, Nominees, Have Nots)
 */
export async function getHouseboard() {
  try {
    const response = await bbjdFetch("/houseboard", {
      tags: ["houseboard", "players"],
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch houseboard:", error);
    return { season: null, houseboard: { hoh: [], pov: [], nominees: [], have_nots: [] } };
  }
}

/**
 * Get season stats/standings
 */
export async function getSeasonStats() {
  try {
    const response = await bbjdFetch("/season-stats", {
      tags: ["season-stats", "players"],
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch season stats:", error);
    return { season: null, players: [] };
  }
}

/**
 * Get recent comments
 */
export async function getRecentComments(perPage = 5) {
  try {
    const response = await bbjdFetch(`/recent-comments?per_page=${perPage}`, {
      tags: ["comments"],
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch recent comments:", error);
    return { comments: [], total: 0 };
  }
}
