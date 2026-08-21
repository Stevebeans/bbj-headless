// Legacy WPDiscuz comments are stored as HTML (<p>, <br>); the React form stores
// plain text. Normalize markup to plain text AND decode numeric entities either
// way: wp_encode_emoji stores emoji as &#x...; entities (utf8mb3-safe
// wp_comments), so plain-text comments carry entities with no tags at all —
// the old tags-only early return left them rendering literally (2026-08-22
// member report). Pure string ops — SSR-safe.

// fromCodePoint, not fromCharCode: emoji are astral-plane and fromCharCode
// mangles anything above U+FFFF. Out-of-range stays literal rather than throwing.
function codePoint(n) {
  return n >= 0 && n <= 0x10ffff ? String.fromCodePoint(n) : null;
}

export function htmlToText(input) {
  if (typeof input !== "string") return input;
  const hasMarkup = input.includes("<");
  let text = input;
  if (hasMarkup) {
    text = text
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p\s*>\s*<p[^>]*>/gi, "\n\n")
      .replace(/<\/?[^>]+>/g, "");
  }
  text = text
    .replace(/&#(\d+);/g, (m, n) => codePoint(parseInt(n, 10)) ?? m)
    .replace(/&#x([0-9a-f]+);/gi, (m, n) => codePoint(parseInt(n, 16)) ?? m)
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (_, e) =>
      ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }[e.toLowerCase()])
    );
  return hasMarkup ? text.replace(/\n{3,}/g, "\n\n").trim() : text;
}
