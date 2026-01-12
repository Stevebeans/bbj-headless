import { bbjdFetch } from "./wordpress";

/**
 * Get feed updates for a specific date
 * Used for "Live Feed Thread" feature on blog posts
 */
export async function getFeedUpdatesByDate(date) {
  if (!date) return { updates: [], total: 0 };

  // Convert date to Y-m-d format if it's an ISO string
  const dateStr = date.split("T")[0];

  try {
    const response = await bbjdFetch(`/feed-updates-by-date?date=${dateStr}`, {
      tags: ["feed-updates", `feed-updates-${dateStr}`],
    });
    return response;
  } catch (error) {
    console.error("Failed to fetch feed updates by date:", error);
    return { updates: [], total: 0 };
  }
}
