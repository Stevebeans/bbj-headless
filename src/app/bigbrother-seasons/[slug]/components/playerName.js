/**
 * Player name helpers — one source of truth so cast / eviction / leaderboards
 * stay consistent (and the initials/photo fallbacks don't drift).
 */

/** Casual label: official nickname if set, else first name, else full name. */
export function displayName(p) {
  if (!p) return "";
  return (p.nickname && p.nickname.trim()) || p.first_name || p.name || "";
}

/**
 * Formal name with the nickname in quotes between first and last:
 *   Mecole "Meme" Hayes   /   (no nickname) → Matt Turner
 */
export function formalName(p) {
  if (!p) return "";
  const first = (p.first_name || "").trim();
  const last = (p.last_name || "").trim();
  const nick = (p.nickname || "").trim();
  if (nick && (first || last)) {
    return `${first} "${nick}" ${last}`.replace(/\s+/g, " ").trim();
  }
  if (first || last) return `${first} ${last}`.trim();
  return p.name || "";
}
