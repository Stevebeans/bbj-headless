import { normalizePost } from "./content.js";
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
