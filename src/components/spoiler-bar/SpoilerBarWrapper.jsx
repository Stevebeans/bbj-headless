import { getSpoilerBar } from "@/lib/api/players";
import { SpoilerBar } from "./SpoilerBar";

/**
 * Server component wrapper that fetches spoiler bar data
 * Used in layout to show spoiler bar on all pages
 */
export async function SpoilerBarWrapper() {
  let spoilerData = { season: null, players: [] };

  try {
    spoilerData = await getSpoilerBar();
  } catch (error) {
    console.error("Failed to fetch spoiler bar data:", error);
    return null;
  }

  if (!spoilerData.players || spoilerData.players.length === 0) {
    return null;
  }

  return <SpoilerBar players={spoilerData.players} season={spoilerData.season} />;
}
