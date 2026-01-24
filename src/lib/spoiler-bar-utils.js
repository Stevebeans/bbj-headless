/**
 * Shared utilities for spoiler bar status computation
 * Used by both the main SpoilerBar and the admin preview
 */

/**
 * Get primary status for a player
 * @param {Object} player - Player object with game_status and finish_place
 * @param {number|null} afpId - AFP player ID for the season
 * @returns {string} Status key (winner, runner_up, hoh, pov, nom, jury, evicted, active, etc.)
 */
export function getPrimaryStatus(player, afpId = null) {
  const gs = player.game_status || {};
  const playerId = player.player_id || player.id;
  const isEliminated = gs.evicted || gs.jury;

  // Check for special end-game statuses FIRST (winner/runner-up may not be marked eliminated yet)
  if (player.finish_place === 1) return "winner";
  if (player.finish_place === 2) return "runner_up";

  if (isEliminated) {
    if (afpId && playerId === afpId) return "afp";
    return gs.jury ? "jury" : "evicted";
  }

  // AFP can be active or eliminated
  if (afpId && playerId === afpId) return "afp";

  // Active player status priority
  if (gs.hoh) return "hoh";
  if (gs.pov) return "pov";
  if (gs.safe) return "safe";
  if (gs.nom) return "nom";
  if (gs.havenot) return "havenot";
  if (gs.misc) return "misc";
  return "active";
}

/**
 * Get status label(s) for display
 * @param {Object} player - Player object with game_status and finish_place
 * @param {number|null} afpId - AFP player ID for the season
 * @returns {string} Human-readable status label
 */
export function getStatusLabel(player, afpId = null) {
  const gs = player.game_status || {};
  const playerId = player.player_id || player.id;
  const labels = [];
  const isEliminated = gs.evicted || gs.jury;

  // Check for special end-game statuses FIRST
  if (player.finish_place === 1) return "Winner";
  if (player.finish_place === 2) return "2nd";

  if (isEliminated) {
    if (afpId && playerId === afpId) return "AFP";
    if (gs.jury) return "Jury";
    return "Evicted";
  }

  // AFP can be active
  if (afpId && playerId === afpId) return "AFP";

  if (gs.hoh) labels.push("HoH");
  if (gs.pov) labels.push("PoV");
  if (gs.nom) labels.push("Nom");
  if (gs.havenot) labels.push("HN");
  if (gs.safe && labels.length === 0) labels.push("Safe");
  if (gs.misc && labels.length === 0) labels.push(gs.misc_notes || "Misc");

  return labels.length > 0 ? labels.join(", ") : "Active";
}

/**
 * Get sort weight for a player (lower = higher priority in display order)
 * @param {Object} player - Player object with game_status
 * @returns {number} Sort weight
 */
export function getStatusWeight(player) {
  const gs = player.game_status || {};

  if (gs.jury) return 5;
  if (gs.evicted) return 6;
  if (gs.hoh) return 1;
  if (gs.pov) return 2;
  if (gs.nom) return 4;
  return 3; // Active
}

/**
 * Sort players for spoiler bar display
 * Order: Winner > Runner-up > HoH > PoV > Active > Nom > Jury > Evicted (by finish place)
 * @param {Array} players - Array of player objects
 * @returns {Array} Sorted players
 */
export function sortPlayersForSpoilerBar(players) {
  return [...players].sort((a, b) => {
    const finishA = a.finish_place;
    const finishB = b.finish_place;

    // Both eliminated with finish_place - sort by placement (winner first)
    if (finishA && finishB) {
      return finishA - finishB;
    }

    // One has finish_place, one doesn't - active players first
    if (finishA && !finishB) return 1;
    if (!finishA && finishB) return -1;

    // Neither has finish_place - sort by status weight
    const weightA = getStatusWeight(a);
    const weightB = getStatusWeight(b);
    if (weightA !== weightB) return weightA - weightB;

    // Same weight - sort by name
    const nameA = a.name || `${a.first_name} ${a.last_name}`;
    const nameB = b.name || `${b.first_name} ${b.last_name}`;
    return nameA.localeCompare(nameB);
  });
}
