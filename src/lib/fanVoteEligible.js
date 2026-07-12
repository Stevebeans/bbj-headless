/**
 * Fan Favorite eligibility predicate — a pure, server-safe data check kept out
 * of the "use client" heart component so the server player page can call it too.
 *
 * The player REST payload (PlayerRoutes::getSeasonResult) sets seasons[].result
 * to "Active" only as the fallback — every completed-season player is instead
 * Winner / Runner Up / AFP / Jury / Evicted — so an "Active" result uniquely
 * means the player is on the running season and still in the house.
 */
export function isFanVoteEligible(player) {
  return Boolean(player?.seasons?.some((s) => s.result === "Active"));
}
