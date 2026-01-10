import { wpRestFetch } from "./wordpress";

/**
 * Transform WP post to our format
 */
function transformPost(wpPost) {
  const author = wpPost._embedded?.author?.[0];
  const featuredMedia = wpPost._embedded?.["wp:featuredmedia"]?.[0];
  const categories = wpPost._embedded?.["wp:term"]?.[0];

  return {
    id: wpPost.id,
    slug: wpPost.slug,
    title: wpPost.title?.rendered || "",
    excerpt: wpPost.excerpt?.rendered || "",
    content: wpPost.content?.rendered || "",
    date: wpPost.date,
    modified: wpPost.modified,
    author: {
      id: author?.id || 0,
      name: author?.name || "Unknown",
      avatar: author?.avatar_urls?.["96"] || "",
    },
    featuredImage: featuredMedia?.source_url || null,
    categories: categories?.map((cat) => cat.name) || [],
    commentCount: wpPost.comment_count || 0,
  };
}

/**
 * Get posts with pagination
 */
export async function getPosts(options = {}) {
  const { limit = 10, page = 1, category } = options;

  let endpoint = `/posts?_embed&per_page=${limit}&page=${page}`;

  if (category) {
    endpoint += `&categories=${category}`;
  }

  try {
    const posts = await wpRestFetch(endpoint, {
      tags: ["posts"],
    });

    return posts.map(transformPost);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }
}

/**
 * Get single post by slug
 */
export async function getPost(slug) {
  try {
    const posts = await wpRestFetch(`/posts?_embed&slug=${slug}`, {
      tags: ["posts", `post-${slug}`],
    });

    if (!posts.length) {
      return null;
    }

    return transformPost(posts[0]);
  } catch (error) {
    console.error("Failed to fetch post:", error);
    return null;
  }
}

/**
 * Get all post slugs for static generation
 */
export async function getAllPostSlugs() {
  try {
    const posts = await wpRestFetch("/posts?per_page=100&_fields=slug", {
      tags: ["posts"],
    });

    return posts.map((post) => post.slug);
  } catch (error) {
    console.error("Failed to fetch post slugs:", error);
    return [];
  }
}
