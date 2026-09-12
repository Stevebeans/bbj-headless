/**
 * Founders window display state, derived from /billing/plans "founders" block.
 * The server is authoritative (checkout re-validates); this only drives UI.
 * closes_at is UTC "YYYY-MM-DD HH:MM:SS".
 */
export function founderState(founders, nowMs = Date.now()) {
  if (!founders || !founders.window_open) {
    return { open: false, soldOut: true, spotsLeft: 0, cap: 0, closesAtMs: null };
  }
  const closesAtMs = founders.closes_at
    ? Date.parse(founders.closes_at.replace(" ", "T") + "Z")
    : null;
  const spotsLeft = Math.max(0, Number(founders.lifetime_spots_left) || 0);
  return {
    open: closesAtMs === null || nowMs < closesAtMs,
    soldOut: spotsLeft === 0,
    spotsLeft,
    cap: Number(founders.lifetime_cap) || 0,
    closesAtMs,
  };
}
