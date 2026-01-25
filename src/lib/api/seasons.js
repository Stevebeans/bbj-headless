import { bbjdFetch } from "./wordpress";

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
      tags: ["seasons", `season-${slug}`, "players"],
    });

    if (!response.success) {
      console.warn(`Season ${slug} fetch unsuccessful:`, response.message);
      return { season: null, players: [], count: 0 };
    }

    return {
      season: response.season,
      players: response.players || [],
      count: response.count || 0,
    };
  } catch (error) {
    console.error(`Failed to fetch season ${slug}:`, error);
    return { season: null, players: [], count: 0 };
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
      tags: ["seasons", `season-${seasonId}`, "players"],
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
