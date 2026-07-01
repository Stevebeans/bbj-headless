/**
 * WordPress API client
 */

// NEXT_PUBLIC_ first: it's the only env var that exists in client bundles.
// (The old apex fallback is 403-blocked in prod — never fall back to it.)
const API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  process.env.WORDPRESS_API_URL ||
  "https://wp.bigbrotherjunkies.com/wp-json";

/**
 * Fetch from WordPress API with caching
 */
export async function wpFetch(endpoint, options = {}) {
  const { tags, revalidate = false, ...fetchOptions } = options;

  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    next: {
      tags: tags || ["wordpress"],
      revalidate, // Default false — webhook-driven via tags. Override per-call when needed.
    },
  });

  if (!response.ok) {
    throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch from BBJ custom endpoints
 */
export async function bbjFetch(endpoint, options = {}) {
  return wpFetch(`/bbj/v1${endpoint}`, options);
}

/**
 * Fetch from WP REST API
 */
export async function wpRestFetch(endpoint, options = {}) {
  return wpFetch(`/wp/v2${endpoint}`, options);
}

/**
 * Fetch from BBJ Data plugin endpoints (bbjd/v1)
 */
export async function bbjdFetch(endpoint, options = {}) {
  return wpFetch(`/bbjd/v1${endpoint}`, options);
}
