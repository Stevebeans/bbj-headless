import { decodeHtml } from "../utils/decodeHtml.js";

const WP = process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

export function stripHtml(html) {
  return decodeHtml(
    (html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  ).replace(/\s+/g, " ").trim();
}

export function toRelative(link) {
  try { return new URL(link).pathname; } catch { return link || ""; }
}

export function normalizePost(p) {
  return {
    id: p.id, type: "post",
    title: stripHtml(p.title?.rendered || ""),
    url: toRelative(p.link),
    date: p.date,
    text: stripHtml(p.content?.rendered || ""),
  };
}

async function fetchAllPosts() {
  const out = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${WP}/wp/v2/posts?per_page=100&page=${page}&_fields=id,date,link,title,content&orderby=date&order=desc`);
    if (res.status === 400) break;
    if (!res.ok) throw new Error(`posts page ${page}: ${res.status}`);
    const batch = await res.json();
    if (!batch.length) break;
    out.push(...batch.map(normalizePost));
    const totalPages = Number(res.headers.get("x-wp-totalpages") || page);
    if (page >= totalPages) break;
  }
  return out;
}

async function fetchBbjd(path, type, map) {
  const res = await fetch(`${WP}/bbjd/v1/${path}`);
  if (!res.ok) return [];
  const data = await res.json();
  // bbjd endpoints return { success, players/seasons/feed_updates/... } or raw arrays
  const list = Array.isArray(data)
    ? data
    : (data.players || data.seasons || data.feed_updates || data.items || data.updates || []);
  return list.map(map);
}

export async function fetchAllContent() {
  const [posts, players, seasons, feeds] = await Promise.all([
    fetchAllPosts(),
    // Players list returns { success, players: [{id, slug, name, permalink, nickname, ...}] }
    // Rich text per player: the old name+hometown stub embedded so weakly that
    // "tell me about <player>" retrieved unrelated posts (Dee, 2026-07-19).
    fetchBbjd("players?per_page=500", "player", (p) => ({
      id: p.id, type: "player",
      title: stripHtml(p.name || ""),
      url: toRelative(p.permalink || ""),
      date: p.date || "",
      text: stripHtml([
        `${p.name} is a Big Brother houseguest`,
        p.nickname ? `nicknamed "${p.nickname}"` : "",
        [p.occupation, p.age ? `${p.age} years old` : "", p.hometown ? `from ${p.hometown}` : ""]
          .filter(Boolean)
          .join(", "),
        p.status === "active" ? "currently playing as an active houseguest this season" : (p.status_label || ""),
        p.is_winner ? "won Big Brother" : "",
        p.is_afp ? "voted America's Favorite Player" : "",
        p.stats
          ? `career stats: ${p.stats.hoh || 0} HoH wins, ${p.stats.pov || 0} veto wins, nominated ${p.stats.nom || 0} times`
          : "",
      ].filter(Boolean).join(". ")),
    })),
    // Seasons list returns { success, seasons: [{id, name, slug, permalink, abbreviation, ...}] }
    fetchBbjd("seasons", "season", (s) => ({
      id: s.id, type: "season",
      title: stripHtml(s.name || s.full_name || ""),
      url: toRelative(s.permalink || ""),
      date: s.start_date || s.date || "",
      text: stripHtml([s.name || s.full_name, s.abbreviation].filter(Boolean).join(". ")),
    })),
    // Feed updates return { slug, title, excerpt, permalink, date, ... }.
    // The endpoint caps at ~30 per pull but paginates — walk up to 10 pages
    // (~300 updates ≈ several days of season coverage).
    (async () => {
      const out = [];
      for (let page = 1; page <= 10; page++) {
        const batch = await fetchBbjd(`feed-updates?per_page=30&page=${page}`, "feed_update", (f) => ({
          id: f.id, type: "feed_update",
          title: stripHtml(f.title || ""),
          url: toRelative(f.permalink || ""),
          date: f.date || "",
          text: stripHtml(f.excerpt || f.content || f.title || ""),
        }));
        out.push(...batch);
        if (batch.length < 30) break;
      }
      return out;
    })(),
  ]);
  return [...posts, ...players, ...seasons, ...feeds].filter((i) => i.text && i.text.length > 0);
}
