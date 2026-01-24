import { bbjdFetch } from "./wordpress";

/**
 * Get spoiler bar data for current season
 * Returns players sorted for spoiler bar display (HoH > PoV > Active > Nom > Jury > Evicted)
 *
 * @returns {Promise<Object>} { season, players }
 */
export async function getSpoilerBar() {
  try {
    const response = await bbjdFetch("/spoiler-bar", {
      tags: ["spoiler-bar", "players"],
    });

    if (!response.success) {
      console.warn("Spoiler bar fetch unsuccessful:", response.message);
      return { season: null, players: [] };
    }

    return {
      season: response.season,
      players: response.players || [],
    };
  } catch (error) {
    console.error("Failed to fetch spoiler bar:", error);
    return { season: null, players: [] };
  }
}

/**
 * Get players for the current season
 * Returns full player data including status, photos, game_status details, etc.
 *
 * @param {Object} options - Fetch options
 * @param {string} options.size - Image size (default: 'bbj_v2_spoiler_bar')
 * @returns {Promise<Object>} { season, players, count }
 */
export async function getCurrentSeasonPlayers(options = {}) {
  const { size = "bbj_v2_spoiler_bar" } = options;

  try {
    const params = new URLSearchParams({ size });

    const response = await bbjdFetch(`/current-season-players?${params.toString()}`, {
      tags: ["players", "current-season"],
    });

    if (!response.success) {
      console.warn("Current season players fetch unsuccessful:", response.message);
      return { season: null, players: [], count: 0 };
    }

    return {
      season: response.season,
      players: response.players || [],
      count: response.count || 0,
    };
  } catch (error) {
    console.error("Failed to fetch current season players:", error);
    return { season: null, players: [], count: 0 };
  }
}

/**
 * Get players for a specific season
 *
 * @param {number} seasonId - The season ID
 * @param {Object} options - Fetch options
 * @param {string} options.size - Image size (default: 'bbj_v2_profile_image')
 * @returns {Promise<Object>} { season, players, count }
 */
export async function getSeasonPlayers(seasonId, options = {}) {
  const { size = "bbj_v2_profile_image" } = options;

  try {
    const params = new URLSearchParams({ size });

    const response = await bbjdFetch(`/seasons/${seasonId}/players?${params.toString()}`, {
      tags: ["players", `season-${seasonId}`],
    });

    if (!response.success) {
      console.warn(`Season ${seasonId} players fetch unsuccessful:`, response.message);
      return { season: null, players: [], count: 0 };
    }

    return {
      season: response.season,
      players: response.players || [],
      count: response.count || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch players for season ${seasonId}:`, error);
    return { season: null, players: [], count: 0 };
  }
}

/**
 * Get single player profile by slug
 * Returns full player data with stats, seasons, and related content
 *
 * @param {string} slug - Player slug
 * @returns {Promise<Object|null>} { player, related_posts, related_players } or null
 */
export async function getPlayerBySlug(slug) {
  try {
    const response = await bbjdFetch(`/players/${slug}`, {
      tags: ["players", `player-${slug}`],
    });

    if (!response.success) {
      console.warn(`Player ${slug} fetch unsuccessful:`, response.message);
      return null;
    }

    return {
      player: response.player,
      related_posts: response.related_posts || [],
      related_players: response.related_players || [],
    };
  } catch (error) {
    console.error(`Failed to fetch player ${slug}:`, error);
    return null;
  }
}

/**
 * Get all player slugs for static generation
 *
 * @returns {Promise<string[]>} Array of player slugs
 */
export async function getAllPlayerSlugs() {
  try {
    const response = await bbjdFetch("/players?fields=slug&per_page=500", {
      tags: ["players"],
    });

    if (!response.success) {
      console.warn("Player slugs fetch unsuccessful:", response.message);
      return [];
    }

    return response.players?.map((p) => p.slug) || [];
  } catch (error) {
    console.error("Failed to fetch player slugs:", error);
    return [];
  }
}

/**
 * Get all players for directory with optional filters
 *
 * @param {Object} options - Filter options
 * @param {string} options.search - Search term (name, nickname)
 * @param {string} options.season - Comma-separated season IDs
 * @param {string} options.gender - 'male' or 'female'
 * @param {string} options.status - Comma-separated statuses (winner, jury, evicted)
 * @param {string} options.orderby - 'name' or 'season'
 * @param {string} options.order - 'ASC' or 'DESC'
 * @param {number} options.page - Page number
 * @param {number} options.perPage - Results per page
 * @returns {Promise<Object>} { players, count, total, page, per_page, total_pages }
 */
export async function getAllPlayers(options = {}) {
  const {
    search = "",
    season = "",
    gender = "",
    status = "",
    orderby = "name",
    order = "ASC",
    page = 1,
    perPage = 50,
  } = options;

  try {
    const params = new URLSearchParams({
      per_page: String(perPage),
      page: String(page),
      orderby,
      order,
    });

    if (search) params.append("search", search);
    if (season) params.append("season", season);
    if (gender) params.append("gender", gender);
    if (status) params.append("status", status);

    const response = await bbjdFetch(`/players?${params.toString()}`, {
      tags: ["players"],
      revalidate: 3600, // 1 hour cache for directory
    });

    if (!response.success) {
      console.warn("Players fetch unsuccessful:", response.message);
      return { players: [], count: 0, total: 0, page: 1, per_page: perPage, total_pages: 0 };
    }

    return {
      players: response.players || [],
      count: response.count || 0,
      total: response.total || 0,
      page: response.page || 1,
      per_page: response.per_page || perPage,
      total_pages: response.total_pages || 0,
    };
  } catch (error) {
    console.error("Failed to fetch players:", error);
    return { players: [], count: 0, total: 0, page: 1, per_page: perPage, total_pages: 0 };
  }
}
