import { bbjdFetch, wpRestFetch } from "./wordpress";

// Always use production WordPress for admin features (auth tokens are from production)
const API_URL = "https://bigbrotherjunkies.com/wp-json";
const getAdminApiUrl = () => API_URL;

/**
 * Get all seasons
 * @param {Object} options - Fetch options
 * @param {string} options.orderBy - Order by field (season_number, full_name, start_date, end_date)
 * @param {string} options.order - Order direction (ASC, DESC)
 * @returns {Promise<Object>} { seasons, count }
 */
export async function getSeasons(options = {}) {
  const { orderBy = "season_number", order = "DESC" } = options;

  try {
    const params = new URLSearchParams({ order_by: orderBy, order });

    const response = await bbjdFetch(`/seasons?${params.toString()}`, {
      tags: ["seasons"],
      revalidate: false, // Webhook-driven via seasons tag
    });

    if (!response.success) {
      console.warn("Seasons fetch unsuccessful:", response.message);
      return { seasons: [], count: 0 };
    }

    return {
      seasons: response.seasons || [],
      count: response.count || 0,
    };
  } catch (error) {
    console.error("Failed to fetch seasons:", error);
    return { seasons: [], count: 0 };
  }
}

/**
 * Get all season slugs for generateStaticParams
 * @returns {Promise<string[]>} Array of season slugs
 */
export async function getAllSeasonSlugs() {
  try {
    const { seasons } = await getSeasons();
    return seasons.map((s) => s.slug).filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch season slugs:", error);
    return [];
  }
}

/**
 * Get single season by slug with all players
 * @param {string} slug - Season slug (e.g., 'big-brother-26')
 * @param {Object} options - Fetch options
 * @param {string} options.size - Image size (default: 'bbj_v2_profile_image')
 * @returns {Promise<Object>} { season, players, count }
 */
export async function getSeasonBySlug(slug, options = {}) {
  const { size = "bbj_v2_profile_image" } = options;

  try {
    const params = new URLSearchParams({ size });

    const response = await bbjdFetch(`/seasons/by-slug/${slug}?${params.toString()}`, {
      tags: [`season-${slug}`, "players"], // Granular season + broad players (season pages show all players)
      revalidate: false, // Webhook-driven via season-${slug} + players tags
    });

    if (!response.success) {
      console.warn(`Season ${slug} fetch unsuccessful:`, response.message);
      return { season: null, players: [], count: 0, weeks: [] };
    }

    return {
      season: response.season,
      players: response.players || [],
      count: response.count || 0,
      category_id: response.category_id || null,
      article_count: response.article_count || 0,
      weeks: response.weeks || [],
    };
  } catch (error) {
    console.error(`Failed to fetch season ${slug}:`, error);
    return { season: null, players: [], count: 0, category_id: null, article_count: 0, weeks: [] };
  }
}

/**
 * Get single season by ID with all players
 * @param {number} seasonId - Season ID
 * @param {Object} options - Fetch options
 * @param {string} options.size - Image size (default: 'bbj_v2_profile_image')
 * @returns {Promise<Object>} { season, players, count }
 */
export async function getSeasonById(seasonId, options = {}) {
  const { size = "bbj_v2_profile_image" } = options;

  try {
    const params = new URLSearchParams({ size });

    const response = await bbjdFetch(`/seasons/${seasonId}?${params.toString()}`, {
      tags: [`season-${seasonId}`, "players"], // Granular season + broad players
      revalidate: false, // Webhook-driven via season-${id} + players tags
    });

    if (!response.success) {
      console.warn(`Season ${seasonId} fetch unsuccessful:`, response.message);
      return { season: null, players: [], count: 0 };
    }

    return {
      season: response.season,
      players: response.players || [],
      count: response.count || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch season ${seasonId}:`, error);
    return { season: null, players: [], count: 0 };
  }
}

/**
 * Update season (admin only, client-side)
 * @param {number} seasonId - Season ID
 * @param {Object} data - Update data
 * @param {string} token - JWT token
 * @returns {Promise<Object>} { success, season, message }
 */
export async function updateSeason(seasonId, data, token) {
  const apiUrl = getAdminApiUrl();

  try {
    const response = await fetch(`${apiUrl}/bbjd/v1/admin/seasons/${seasonId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to update season",
        season: null,
      };
    }

    return result;
  } catch (error) {
    console.error("Failed to update season:", error);
    return {
      success: false,
      message: error.message || "Network error",
      season: null,
    };
  }
}

/**
 * Add player to season (admin only, client-side)
 * @param {number} seasonId - Season ID
 * @param {number} playerId - Player ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} { success, message }
 */
export async function addPlayerToSeason(seasonId, playerId, token) {
  const apiUrl = getAdminApiUrl();

  try {
    const response = await fetch(`${apiUrl}/bbjd/v1/admin/seasons/${seasonId}/players`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ player_id: playerId }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to add player",
      };
    }

    return result;
  } catch (error) {
    console.error("Failed to add player to season:", error);
    return {
      success: false,
      message: error.message || "Network error",
    };
  }
}

/**
 * Remove player from season (admin only, client-side)
 * @param {number} seasonId - Season ID
 * @param {number} playerId - Player ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} { success, message }
 */
export async function removePlayerFromSeason(seasonId, playerId, token) {
  const apiUrl = getAdminApiUrl();

  try {
    const response = await fetch(`${apiUrl}/bbjd/v1/admin/seasons/${seasonId}/players/${playerId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to remove player",
      };
    }

    return result;
  } catch (error) {
    console.error("Failed to remove player from season:", error);
    return {
      success: false,
      message: error.message || "Network error",
    };
  }
}

/**
 * Update roster status for multiple players (admin only, client-side)
 * Used by spoiler bar editor to update player statuses in bulk
 * @param {number} seasonId - Season ID
 * @param {Array} players - Array of player status objects
 * @param {string} token - JWT token
 * @returns {Promise<Object>} { success, message, players, updated_count, errors }
 */
export async function updateRosterStatus(seasonId, players, token) {
  const apiUrl = getAdminApiUrl();

  try {
    const response = await fetch(`${apiUrl}/bbjd/v1/admin/seasons/${seasonId}/roster-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ players }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to update roster status",
        players: [],
        updated_count: 0,
        errors: [],
      };
    }

    return result;
  } catch (error) {
    console.error("Failed to update roster status:", error);
    return {
      success: false,
      message: error.message || "Network error",
      players: [],
      updated_count: 0,
      errors: [error.message],
    };
  }
}

/**
 * Search players for add player dropdown (client-side)
 * @param {string} query - Search query
 * @param {number[]} exclude - Player IDs to exclude
 * @param {number} limit - Max results
 * @returns {Promise<Object>} { players, count }
 */
export async function searchPlayers(query, exclude = [], limit = 10) {
  const apiUrl = getAdminApiUrl();

  try {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });

    if (exclude.length > 0) {
      params.append("exclude", exclude.join(","));
    }

    const response = await fetch(`${apiUrl}/bbjd/v1/search/players?${params.toString()}`);
    const result = await response.json();

    if (!result.success) {
      return { players: [], count: 0 };
    }

    return {
      players: result.players || [],
      count: result.count || 0,
    };
  } catch (error) {
    console.error("Failed to search players:", error);
    return { players: [], count: 0 };
  }
}

/**
 * Purge all caches for a season (Redis + Varnish + Next.js)
 * Use when cache is stale and needs manual refresh
 * @param {number} seasonId - Season ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} { success, message }
 */
export async function purgeSeasonCache(seasonId, token) {
  const apiUrl = getAdminApiUrl();

  try {
    const response = await fetch(`${apiUrl}/bbjd/v1/admin/seasons/${seasonId}/purge-cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Failed to purge cache",
      };
    }

    return result;
  } catch (error) {
    console.error("Failed to purge season cache:", error);
    return {
      success: false,
      message: error.message || "Network error",
    };
  }
}

/**
 * Get articles for a season by WordPress category ID
 * @param {number} categoryId - WordPress category ID for the season
 * @param {number} perPage - Number of articles to fetch (default: 6)
 * @returns {Promise<Object>} { posts, total }
 */
export async function getSeasonArticles(categoryId, perPage = 6) {
  if (!categoryId) return { posts: [], total: 0 };

  try {
    const params = new URLSearchParams({
      categories: String(categoryId),
      per_page: String(perPage),
      _embed: "wp:featuredmedia",
      orderby: "date",
      order: "desc",
    });

    const response = await wpRestFetch(`/posts?${params.toString()}`, {
      tags: ["posts", `season-articles-${categoryId}`],
      revalidate: false, // Webhook-driven via posts tag
    });

    const posts = (Array.isArray(response) ? response : []).map((post) => ({
      id: post.id,
      title: post.title?.rendered || "",
      slug: post.slug,
      date: post.date,
      excerpt: post.excerpt?.rendered || "",
      comment_count: post.comment_count || 0,
      featured_image:
        post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes
          ?.thumbnail?.source_url ||
        post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        null,
    }));

    return { posts, total: posts.length };
  } catch (error) {
    console.error("Failed to fetch season articles:", error);
    return { posts: [], total: 0 };
  }
}
