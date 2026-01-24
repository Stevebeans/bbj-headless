import { getCurrentSeasonPlayers } from "@/lib/api/players";
import { SpoilerBar } from "./SpoilerBar";

/**
 * Server component wrapper that fetches spoiler bar data
 * Uses /current-season-players endpoint for fresh data with game_status
 * Status is computed at render time, not from cached API response
 */
export async function SpoilerBarWrapper() {
  let data = { season: null, players: [], count: 0 };

  try {
    data = await getCurrentSeasonPlayers({ size: "bbj_v2_spoiler_bar" });
  } catch (error) {
    console.error("Failed to fetch spoiler bar data:", error);
    return null;
  }

  if (!data.players || data.players.length === 0) {
    return null;
  }

  return <SpoilerBar players={data.players} season={data.season} />;
}
