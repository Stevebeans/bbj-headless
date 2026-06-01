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
    fetchBbjd("players?per_page=500", "player", (p) => ({
      id: p.id, type: "player",
      title: stripHtml(p.name || ""),
      url: toRelative(p.permalink || ""),
      date: p.date || "",
      text: stripHtml([p.name, p.nickname, p.occupation, p.hometown].filter(Boolean).join(". ")),
    })),
    // Seasons list returns { success, seasons: [{id, name, slug, permalink, abbreviation, ...}] }
    fetchBbjd("seasons", "season", (s) => ({
      id: s.id, type: "season",
      title: stripHtml(s.name || s.full_name || ""),
      url: toRelative(s.permalink || ""),
      date: s.start_date || s.date || "",
      text: stripHtml([s.name || s.full_name, s.abbreviation].filter(Boolean).join(". ")),
    })),
    // Feed updates return { slug, title, excerpt, permalink, date, ... }
    fetchBbjd("feed-updates?per_page=500", "feed_update", (f) => ({
      id: f.id, type: "feed_update",
      title: stripHtml(f.title || ""),
      url: toRelative(f.permalink || ""),
      date: f.date || "",
      text: stripHtml(f.excerpt || f.content || f.title || ""),
    })),
  ]);
  return [...posts, ...players, ...seasons, ...feeds].filter((i) => i.text && i.text.length > 0);
}
