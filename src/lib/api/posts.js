import { wpRestFetch, bbjdFetch } from "./wordpress";
import { decodeHtml, stripHtml } from "../utils/decodeHtml";

/**
 * Get posts with pagination — uses custom lightweight endpoint
 */
export async function getPosts(options = {}) {
  const { limit = 10, page = 1, category } = options;

  let endpoint = `/posts?per_page=${limit}&page=${page}`;

  if (category) {
    endpoint += `&category=${category}`;
  }

  try {
    const data = await bbjdFetch(endpoint, {
      tags: ["posts"],
      revalidate: false, // Webhook-driven via posts tag
    });

    return data.posts || [];
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    return [];
  }
}

/**
 * Paginated archive fetch — returns posts + pagination metadata
 */
export async function getPaginatedPosts({ page = 1, perPage = 20 } = {}) {
  const endpoint = `/posts?per_page=${perPage}&page=${page}`;

  try {
    const data = await bbjdFetch(endpoint, {
      tags: ["posts"],
      revalidate: false, // Webhook-driven via posts tag
    });

    return {
      posts: data.posts || [],
      totalPages: data.total_pages || 0,
      totalPosts: data.total_posts || 0,
      currentPage: page,
    };
  } catch (error) {
    console.error("Failed to fetch paginated posts:", error);
    return { posts: [], totalPages: 0, totalPosts: 0, currentPage: page };
  }
}

/**
 * Transform WP REST API post to our format (used for single post/related posts)
 */
function transformPost(wpPost) {
  const author = wpPost._embedded?.author?.[0];
  const featuredMedia = wpPost._embedded?.["wp:featuredmedia"]?.[0];
  const categories = wpPost._embedded?.["wp:term"]?.[0];

  return {
    id: wpPost.id,
    slug: wpPost.slug,
    title: decodeHtml(wpPost.title?.rendered || ""),
    excerpt: wpPost.excerpt?.rendered || "",
    content: wpPost.content?.rendered || "",
    date: wpPost.date,
    modified: wpPost.modified,
    dateGmt: wpPost.date_gmt,
    modifiedGmt: wpPost.modified_gmt,
    author: {
      id: author?.id || 0,
      name: author?.name || "Unknown",
      avatar: author?.avatar_urls?.["96"] || "",
    },
    featuredImage: featuredMedia?.source_url || null,
    categories: categories?.map((cat) => cat.name) || [],
    categoryIds: categories?.map((cat) => cat.id) || [],
    commentCount: wpPost.comment_count || 0,
    liveFeedThread: wpPost.live_feed_thread || false,
    hideAds: wpPost.hide_ads || false,
    // Live Update Thread fields — registered via register_rest_field in Task 7,
    // appear at the top level of the WP REST response as snake_case.
    liveUpdates: !!(wpPost.live_updates ?? wpPost.meta?.live_updates),
    liveState: wpPost.live_state ?? wpPost.meta?.live_state ?? "none",
    liveStart: wpPost.live_start ?? wpPost.meta?.live_start ?? 0,
    liveEnd: wpPost.live_end ?? wpPost.meta?.live_end ?? 0,
    closedAt: wpPost.closed_at ?? wpPost.meta?.closed_at ?? 0,
    closingSummary: wpPost.closing_summary ?? wpPost.meta?.closing_summary ?? "",
  };
}

/**
 * Get single post by slug
 */
export async function getPost(slug) {
  try {
    const posts = await wpRestFetch(`/posts?_embed&slug=${slug}`, {
      tags: [`post-${slug}`], // Granular tag — webhook fires this on edit/comment, doesn't cascade to other posts
      revalidate: false, // Webhook-driven via post-${slug} tag
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
 * Get every post's slug + modified date for the sitemap.
 * Paginates through all pages (WP caps per_page at 100) — the old single-page
 * fetch silently capped the sitemap at 100 of 3,000+ posts.
 * @returns {Promise<Array<{slug: string, modified: string}>>}
 */
export async function getAllPostSlugs() {
  const all = [];
  try {
    for (let page = 1; page <= 100; page++) {
      const posts = await wpRestFetch(
        `/posts?per_page=100&page=${page}&_fields=slug,modified,modified_gmt`,
        { tags: ["posts"], revalidate: false } // Webhook-driven via posts tag
      );
      if (!Array.isArray(posts) || posts.length === 0) break;
      for (const p of posts) {
        all.push({ slug: p.slug, modified: p.modified_gmt ? `${p.modified_gmt}Z` : p.modified });
      }
      if (posts.length < 100) break; // last page
    }
  } catch (error) {
    console.error("Failed to fetch post slugs:", error);
  }
  return all;
}

/**
 * Get related posts from same category
 */
export async function getRelatedPosts(postId, categoryId, limit = 4) {
  const catId = Number.parseInt(categoryId, 10);
  const pId = Number.parseInt(postId, 10);
  if (!Number.isFinite(catId) || catId <= 0) return [];
  if (!Number.isFinite(pId) || pId <= 0) return [];

  try {
    const posts = await wpRestFetch(
      `/posts?_embed&per_page=${limit}&categories=${catId}&exclude=${pId}`,
      {
        tags: ["posts", `related-posts-${catId}`], // Webhook-driven: `posts` fires on any publish; category tag for targeted busts
        revalidate: false,
      }
    );

    return posts.map(transformPost);
  } catch (error) {
    console.error("Failed to fetch related posts:", error);
    return [];
  }
}

/**
 * Transform WP page to our format
 */
function transformPage(wpPage) {
  const author = wpPage._embedded?.author?.[0];
  const featuredMedia = wpPage._embedded?.["wp:featuredmedia"]?.[0];

  return {
    id: wpPage.id,
    slug: wpPage.slug,
    title: decodeHtml(wpPage.title?.rendered || ""),
    excerpt: wpPage.excerpt?.rendered || "",
    content: wpPage.content?.rendered || "",
    date: wpPage.date,
    modified: wpPage.modified,
    dateGmt: wpPage.date_gmt,
    modifiedGmt: wpPage.modified_gmt,
    author: {
      id: author?.id || 0,
      name: author?.name || "Unknown",
      avatar: author?.avatar_urls?.["96"] || "",
    },
    featuredImage: featuredMedia?.source_url || null,
    type: "page",
    hideAds: wpPage.hide_ads || false,
  };
}

/**
 * Get single page by slug
 */
export async function getPage(slug) {
  try {
    const pages = await wpRestFetch(`/pages?_embed&slug=${slug}`, {
      tags: [`page-${slug}`], // Granular tag — pages rarely change
      revalidate: 3600,
    });

    if (!pages.length) {
      return null;
    }

    return transformPage(pages[0]);
  } catch (error) {
    console.error("Failed to fetch page:", error);
    return null;
  }
}

/**
 * Get all page slugs for static generation
 */
export async function getAllPageSlugs() {
  try {
    const pages = await wpRestFetch("/pages?per_page=100&_fields=slug,modified,modified_gmt", {
      tags: ["pages"],
      revalidate: 3600, // 1 hour
    });

    return pages.map((page) => ({
      slug: page.slug,
      modified: page.modified_gmt ? `${page.modified_gmt}Z` : page.modified,
    }));
  } catch (error) {
    console.error("Failed to fetch page slugs:", error);
    return [];
  }
}

/**
 * Get content by slug - tries post first, then page
 */
export async function getContent(slug) {
  // Try post first
  const post = await getPost(slug);
  if (post) {
    return { ...post, type: "post" };
  }

  // Try page
  const page = await getPage(slug);
  if (page) {
    return page; // Already has type: "page"
  }

  return null;
}

/**
 * Get all content slugs (posts + pages) for static generation
 */
export async function getAllContentSlugs() {
  const [postSlugs, pageSlugs] = await Promise.all([
    getAllPostSlugs(),
    getAllPageSlugs(),
  ]);

  return [...postSlugs, ...pageSlugs];
}
