import { bbjdFetch } from "./wordpress";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

/**
 * Fetch feed updates with optional filters
 * @param {Object} options - Query options
 * @param {number} options.perPage - Items per page (default: 20)
 * @param {number} options.offset - Number of items to skip
 * @param {string} options.sort - Sort order: newest, oldest, highest, lowest
 * @param {string} options.dateRange - Filter: all, today, yesterday, week, month, year
 * @param {string} options.search - Search query
 * @param {string} options.mode - Filter by mode: feed, show
 * @returns {Promise<Object>} Feed updates with pagination info
 */
export async function getFeedUpdates(options = {}) {
  const params = new URLSearchParams();

  if (options.perPage) params.append("per_page", options.perPage);
  if (options.offset != null) params.append("offset", options.offset);
  if (options.sort) params.append("sort", options.sort);
  if (options.dateRange) params.append("date_range", options.dateRange);
  if (options.search) params.append("search", options.search);
  if (options.mode) params.append("mode", options.mode);

  const queryString = params.toString();
  const endpoint = `/feed-updates${queryString ? "?" + queryString : ""}`;

  return bbjdFetch(endpoint, {
    tags: ["feed-updates"],
    revalidate: false, // Webhook-driven via feed-updates tag
  });
}

/**
 * Fetch the editorial Feed Hub payload (season meta + counts + featured +
 * page-1 thread + hot posts) in one cached call.
 * @returns {Promise<Object>} { season, counts, featured, thread, hot_posts }
 */
export async function getFeedHub() {
  return bbjdFetch("/feed-updates/hub", {
    tags: ["feed-updates"],
    revalidate: false, // Webhook-driven via feed-updates tag
  });
}

/**
 * Fetch every feed-update slug + modified date for the sitemap in ONE call.
 * Backed by the dedicated `/feed-updates/sitemap` endpoint (lean $wpdb query,
 * no per_page cap, ISO 8601 modified dates). The general list endpoint caps
 * per_page at 30, which made it unusable for ~14k URLs. Cached (revalidate:false,
 * feed-updates tag) so it only re-runs on webhook invalidation or the sitemap's
 * own revalidate window.
 * @returns {Promise<Array<{slug: string, modified: string}>>}
 */
export async function getAllFeedUpdateSitemapEntries() {
  try {
    const res = await bbjdFetch("/feed-updates/sitemap", {
      tags: ["feed-updates"],
      revalidate: false,
    });
    return (res?.updates || []).filter((u) => u?.slug);
  } catch (err) {
    console.error("feed sitemap fetch error:", err);
    return [];
  }
}

/**
 * Fetch a single feed update by slug
 * @param {string} slug - Update slug
 * @returns {Promise<Object>} Feed update data
 */
export async function getFeedUpdateBySlug(slug) {
  try {
    const response = await bbjdFetch(`/feed-updates/single/${slug}`, {
      tags: [`feed-update-${slug}`], // Granular — new feed updates don't invalidate old ones
      revalidate: false,
    });
    return response?.update || null;
  } catch (error) {
    if (error.message?.includes("404") || error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create a new feed update (requires authentication)
 * @param {Object} data - Update data
 * @param {string} data.content - Update content
 * @param {File} data.image - Optional image file
 * @param {string} data.mode - Update mode: feed or show
 * @param {boolean} data.postToBluesky - Post to Bluesky
 * @param {string} token - JWT auth token
 * @returns {Promise<Object>} Created update
 */
export async function createFeedUpdate(data, token) {
  const formData = new FormData();
  formData.append("content", data.content);
  formData.append("mode", data.mode || "feed");

  if (data.image) {
    formData.append("image", data.image);
  }

  if (data.postToBluesky !== undefined) {
    formData.append("post_to_bluesky", data.postToBluesky ? "1" : "0");
  }


  const res = await fetch(`${API_URL}/bbjd/v1/feed-updates/create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to create feed update");
  }

  return result;
}

/**
 * Vote on a feed update
 * @param {number} updateId - Feed update ID
 * @param {number} vote - Vote value: 1 (upvote) or -1 (downvote)
 * @param {string} token - JWT auth token
 * @returns {Promise<Object>} Updated vote counts
 */
export async function voteFeedUpdate(updateId, vote, token) {
  const res = await fetch(`${API_URL}/bbjd/v1/feed-updates/${updateId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ vote }),
  });

  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.message || "Failed to vote");
  }

  return result;
}

/**
 * Get current update mode for user
 * @param {string} token - JWT auth token
 * @returns {Promise<Object>} Mode data
 */
export async function getMode(token) {
  const res = await fetch(`${API_URL}/bbjd/v1/feed-updates/mode`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to get mode");
  }

  return res.json();
}

/**
 * Set update mode for user
 * @param {string} mode - Mode: feed or show
 * @param {string} token - JWT auth token
 * @returns {Promise<Object>} Updated mode
 */
export async function setMode(mode, token) {
  const res = await fetch(`${API_URL}/bbjd/v1/feed-updates/mode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mode }),
  });

  if (!res.ok) {
    throw new Error("Failed to set mode");
  }

  return res.json();
}

/**
 * Get current season hashtag
 * @returns {Promise<Object>} Hashtag data
 */
export async function getCurrentHashtag() {
  return bbjdFetch("/feed-updates/hashtag", {
    tags: ["hashtag"],
    revalidate: 3600,
  });
}

/**
 * Get social media posting configuration
 * @param {string} token - JWT auth token
 * @returns {Promise<Object>} Social config
 */
export async function getSocialConfig(token) {
  const res = await fetch(`${API_URL}/bbjd/v1/feed-updates/social-config`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to get social config");
  }

  return res.json();
}

/**
 * Latest ~20 updates for the premium live poller — canonical and
 * param-less, served by WP from a 20s transient micro-cache.
 *
 * MUST stay unauthenticated (no Authorization header): the payload is a
 * single shared anonymous blob; auth would fragment the cache AND leak a
 * user's vote state into it. Client-side only — polls go straight to the
 * WP host (never through Vercel; that's the cost invariant).
 */
export async function fetchRecentFeedUpdates() {
  const apiUrl =
    process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://wp.bigbrotherjunkies.com/wp-json";
  const res = await fetch(`${apiUrl}/bbjd/v1/feed-updates/recent`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`feed-updates/recent failed: HTTP ${res.status}`);
  }
  const data = await res.json();
  return Array.isArray(data?.updates) ? data.updates : [];
}
