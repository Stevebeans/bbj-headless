/**
 * Split post HTML into top-level block chunks for in-content ad insertion.
 *
 * Splits at top-level </p> boundaries, but treats block CONTAINERS
 * (ul, ol, blockquote, table, figure, pre, dl) as ATOMIC: their inner </p>
 * tags (e.g. the editor's <li><p>…</p></li>) never trigger a split. This keeps
 * lists intact as a single chunk so they are never shredded mid-item and ads
 * are never injected inside them.
 *
 * @param {string} html
 * @returns {string[]} top-level block chunks, in order
 */
const CONTAINERS = new Set(["ul", "ol", "blockquote", "table", "figure", "pre", "dl"]);

export function splitContentBlocks(html) {
  if (!html) return [];

  const blocks = [];
  let current = "";
  let depth = 0;
  let last = 0;

  // Match opening/closing element tags only (ignores comments / void markers).
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  let m;

  while ((m = tagRe.exec(html)) !== null) {
    // Append everything up to and including this tag to the current chunk.
    current += html.slice(last, tagRe.lastIndex);
    last = tagRe.lastIndex;

    const isClose = m[1] === "/";
    const tag = m[2].toLowerCase();

    if (CONTAINERS.has(tag)) {
      if (isClose) {
        depth = Math.max(0, depth - 1);
        if (depth === 0) {
          pushChunk(blocks, current);
          current = "";
        }
      } else {
        depth++;
      }
    } else if (tag === "p" && isClose && depth === 0) {
      // Only split on paragraph boundaries that are NOT inside a container.
      pushChunk(blocks, current);
      current = "";
    }
  }

  current += html.slice(last);
  pushChunk(blocks, current);

  return blocks;
}

function pushChunk(blocks, chunk) {
  const trimmed = chunk.trim();
  if (trimmed) blocks.push(trimmed);
}
