/**
 * Blog-draft → editor handoff.
 *
 * The Bean Bot blog recap's first line is a headline in the fixed format
 * "Big Brother 28 Spoilers: <event>" (BLOG_PROMPT). The Social admin page
 * splits that off, converts the body to editor HTML, and parks both in
 * sessionStorage; /editor/new consumes the payload exactly once.
 */

export const PREFILL_KEY = "bbjd_editor_prefill";
// A stale payload (old tab, abandoned handoff) must not hijack an unrelated
// new-post session later.
export const PREFILL_MAX_AGE_MS = 60 * 60 * 1000;

const TITLE_RE = /^big brother \d+ spoilers:/i;

/** Split a blog draft into { title, body }. Missing headline → title "". */
export function splitBlogDraft(content) {
  const text = String(content ?? "").trim();
  if (!text) return { title: "", body: "" };
  const nl = text.indexOf("\n");
  const firstLine = (nl === -1 ? text : text.slice(0, nl)).trim();
  if (!TITLE_RE.test(firstLine)) return { title: "", body: text };
  return { title: firstLine, body: nl === -1 ? "" : text.slice(nl + 1).trim() };
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Draft body (blank-line paragraphs, **bold**) → TipTap-ready HTML. */
export function draftBodyToHtml(body) {
  const text = String(body ?? "").trim();
  if (!text) return "";
  return text
    .split(/\n\s*\n/)
    .map((para) => {
      const joined = escapeHtml(para.trim().replace(/\s*\n\s*/g, " "));
      // Alternating split on one capture group: odd indices are bold runs.
      const withBold = joined
        .split(/\*\*([^*]+)\*\*/g)
        .map((part, i) => (i % 2 === 1 ? `<strong>${part}</strong>` : part))
        .join("");
      return `<p>${withBold}</p>`;
    })
    .join("");
}

/** Social page side: stash the payload and return true on success. */
export function storePrefill({ title, html }) {
  try {
    sessionStorage.setItem(PREFILL_KEY, JSON.stringify({ title, html, ts: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

/** Editor side: read-and-delete the payload; null if absent, invalid, or stale. */
export function consumePrefill() {
  try {
    const raw = sessionStorage.getItem(PREFILL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PREFILL_KEY);
    const data = JSON.parse(raw);
    if (!data || typeof data.html !== "string") return null;
    if (!data.ts || Date.now() - data.ts > PREFILL_MAX_AGE_MS) return null;
    return { title: String(data.title || ""), html: data.html };
  } catch {
    return null;
  }
}
