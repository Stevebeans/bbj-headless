import { bbjdFetch } from "./wordpress";

/**
 * Server-side: fetch the currently-active live thread (or null).
 * Cached with tag `live-thread-active` — invalidated only on open/close/take-over.
 * Returns `{ post_id, title, slug, started_at, comment_count }` (all passthrough
 * from the endpoint; comment_count defaulted to 0 so thread CTAs can rely on it).
 */
export async function getActiveLiveThread() {
  try {
    const data = await bbjdFetch("/live-thread/current", {
      tags: ["live-thread-active"],
      revalidate: false,
    });
    if (!data) return null;
    return { ...data, comment_count: data.comment_count ?? 0 };
  } catch (err) {
    console.error("[liveThread] getActiveLiveThread failed:", err.message);
    return null;
  }
}

/**
 * Server-side: fetch all updates for a specific thread (used by the timeline).
 * Cached per-thread with tag `live-thread-{postId}`.
 */
export async function getThreadUpdates(postId) {
  try {
    const data = await bbjdFetch(`/live-thread/${postId}/updates`, {
      tags: [`live-thread-${postId}`],
      revalidate: false,
    });
    return data || { updates: [], thread_state: "none" };
  } catch (err) {
    console.error("[liveThread] getThreadUpdates failed:", err.message);
    return { updates: [], thread_state: "none" };
  }
}

/**
 * Client-side: poll for new updates since a timestamp.
 * Used by `<LiveUpdatePoller />` for premium users. Authenticated via Bearer.
 */
export async function fetchUpdatesSince(postId, sinceTs, token) {
  const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
                 "https://bigbrotherjunkies.com/wp-json";
  const res = await fetch(
    `${apiUrl}/bbjd/v1/live-thread/${postId}/updates-since?ts=${sinceTs}`,
    {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  if (!res.ok) {
    throw new Error(`updates-since failed: HTTP ${res.status}`);
  }
  return res.json();
}
