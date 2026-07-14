// Pure helpers for feed-update thread comments (quick-reply prefix + thread CTA).
// No side effects, no fetches - the card components consume these directly.

const MAX_QUOTE_LEN = 80;

// Stored timestamps are UTC 'Y-m-d H:i:s' with no zone marker (mirrors the
// admin page's fmtTime in src/app/admin/social/page.jsx).
function ptTime(utc) {
  if (!utc) return null;
  const iso = utc.includes("T") ? utc : utc.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
}

function truncate(str, max = MAX_QUOTE_LEN) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
}

/**
 * Builds the quick-reply prefix for replying to a feed update's comment thread.
 * @param {{created_at?: string, text?: string}} update
 * @returns {string}
 */
export function quickReplyPrefix(update) {
  const time = ptTime(update?.created_at);
  const timeClause = time ? ` the ${time} PT feed update` : " the feed update";
  const text = update?.text || "";
  const quote = text ? `: "${truncate(text)}"` : ":";
  return `Re:${timeClause}${quote}\n\n`;
}

/**
 * Builds the call-to-action for a feed update's comment thread.
 * @param {{slug: string, comment_count: number} | null | undefined} thread
 * @returns {{label: string, href: string} | null}
 */
export function threadCta(thread) {
  if (!thread) return null;
  const { slug, comment_count } = thread;
  const href = `/${slug}#comments`;
  if (!comment_count) {
    return { label: "Be the first in today's thread", href };
  }
  const noun = comment_count === 1 ? "comment" : "comments";
  return { label: `Join today's conversation · ${comment_count} ${noun}`, href };
}
