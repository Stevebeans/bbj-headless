/**
 * Remove comments authored by blocked users, subtree and all.
 * Pure: never mutates the input. blockedIds is a Set of author ids.
 */
export function pruneBlocked(comments, blockedIds) {
  if (!blockedIds || blockedIds.size === 0) return comments;
  const prune = (list) =>
    (list || [])
      .filter((c) => !blockedIds.has(c.author?.id))
      .map((c) => (c.replies?.length ? { ...c, replies: prune(c.replies) } : c));
  return prune(comments);
}
