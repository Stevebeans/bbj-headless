import { normalizePost, stripHtml } from "./content.js";
import { reindexItem } from "./indexContent.js";

const WP = process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/** Re-index one post by slug (called from the publish webhook). */
export async function reindexPostBySlug(slug) {
  const res = await fetch(
    `${WP}/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id,date,link,title,content`
  );
  if (!res.ok) return { reindexed: 0 };
  const [post] = await res.json();
  if (!post) return { reindexed: 0 };
  await reindexItem(normalizePost(post));
  return { reindexed: 1 };
}

/**
 * Re-index one feed update by slug (publish webhook). No single-by-slug
 * route exists, so scan the newest page — a just-published update is always
 * near the top. Keeps the Bean current on feed intel (2026-07-18: the index
 * only refreshed blog posts, so a whole season of feed updates and the BB28
 * cast were invisible to it).
 */
export async function reindexFeedUpdateBySlug(slug) {
  const res = await fetch(`${WP}/bbjd/v1/feed-updates?per_page=50`);
  if (!res.ok) return { reindexed: 0 };
  const data = await res.json();
  const f = (data.updates || []).find((u) => u.slug === slug);
  if (!f) return { reindexed: 0 };
  await reindexItem({
    id: f.id,
    type: "feed_update",
    title: stripHtml(f.title || ""),
    url: `/live-feed-updates/${f.slug}`,
    date: f.date || "",
    text: stripHtml(f.excerpt || f.content || f.title || ""),
  });
  return { reindexed: 1 };
}
