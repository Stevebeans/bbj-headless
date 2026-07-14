// Suggest a season-roster player for a candidate's speaker string.
// Order: exact full name → exact nickname → unique first-name prefix.
// Ambiguity returns null — Steve confirms in the approval card either way.
export function suggestPlayer(speaker, players = []) {
  const s = String(speaker || "").trim().toLowerCase();
  if (!s) return null;

  const exact = players.find((p) => String(p.name || "").toLowerCase() === s);
  if (exact) return exact;

  const nick = players.find(
    (p) => String(p.nickname || "").toLowerCase() === s
  );
  if (nick) return nick;

  const prefix = players.filter((p) =>
    String(p.name || "").toLowerCase().startsWith(s)
  );
  return prefix.length === 1 ? prefix[0] : null;
}
