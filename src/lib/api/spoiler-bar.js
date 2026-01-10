import { bbjFetch } from "./wordpress";

/**
 * Get spoiler bar data for current season
 */
export async function getSpoilerBar() {
  try {
    const players = await bbjFetch("/next_spoiler_bar", {
      tags: ["spoiler-bar"],
    });

    return players || [];
  } catch (error) {
    console.error("Failed to fetch spoiler bar:", error);
    return [];
  }
}
