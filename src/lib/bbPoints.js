/**
 * Season points for the stats bar. Weights agreed 2026-07-25: HoH pays a
 * premium over the veto for wearing the target; a nomination costs a point
 * that surviving it earns back; votes received are deliberately excluded
 * (they double-count nominations and measure unanimity, not gameplay).
 */
export const POINT_WEIGHTS = {
  hoh: 2.5,
  pov: 2,
  misc: 1, // Block Buster / AI Arena and other recorded comp wins
  nom: -1,
  survived: 1, // on the block at eviction, not evicted
  saved: 0.5, // veto pulled them off the block
};

// Noms that concluded with the player still in the house and not veto-saved.
// An unresolved current nomination earns nothing yet in either direction...
// except the -1 for the nomination itself, which is already real.
function survivedCount(stats, isEvicted) {
  const s = stats || {};
  return Math.max(
    0,
    (s.nom || 0) - (s.saved || 0) - (isEvicted ? 1 : 0) - (s.on_block ? 1 : 0)
  );
}

export function playerPoints(stats, isEvicted) {
  const s = stats || {};
  const pts =
    (s.hoh || 0) * POINT_WEIGHTS.hoh +
    (s.pov || 0) * POINT_WEIGHTS.pov +
    (s.misc || 0) * POINT_WEIGHTS.misc +
    (s.nom || 0) * POINT_WEIGHTS.nom +
    survivedCount(s, isEvicted) * POINT_WEIGHTS.survived +
    (s.saved || 0) * POINT_WEIGHTS.saved;
  return Math.round(pts * 10) / 10;
}

/** Tooltip text: only the non-zero components, in scoring order. */
export function pointsBreakdown(stats, isEvicted) {
  const s = stats || {};
  const survived = survivedCount(s, isEvicted);
  const parts = [];
  if (s.hoh) parts.push(`${s.hoh} HoH x2.5`);
  if (s.pov) parts.push(`${s.pov} Veto x2`);
  if (s.misc) parts.push(`${s.misc} comp x1`);
  if (s.nom) parts.push(`${s.nom} nom x-1`);
  if (survived) parts.push(`${survived} survived x1`);
  if (s.saved) parts.push(`${s.saved} saved x0.5`);
  return parts.length ? parts.join(", ") : "No scoring events yet";
}
