import { notFound } from "next/navigation";
import { wpRestFetch, bbjdFetch } from "@/lib/api/wordpress";
import { PostCard } from "@/components/posts/PostCard";
import { Sidebar } from "@/components/layout/Sidebar";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { decodeHtml } from "@/lib/utils/decodeHtml";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const revalidate = 3600; // 1 hour ISR — category archives change infrequently
export const dynamicParams = true; // Allow any slug — ISR-cached on first hit

export async function generateStaticParams() {
  return []; // No pre-rendering — pages ISR-cache on first visit
}

/**
 * Resolve a WP category slug to its full object (id, name, description, count)
 */
async function getCategory(slug) {
  try {
    const categories = await wpRestFetch(
      `/categories?slug=${encodeURIComponent(slug)}`,
      {
        tags: ["categories", `category-${slug}`],
        revalidate: 3600,
      }
    );

    if (!categories.length) return null;
    return categories[0];
  } catch (error) {
    console.error("Failed to fetch category:", error);
    return null;
  }
}

/**
 * Fetch posts for a given category ID using the optimized bbjd endpoint
 */
async function getCategoryPosts(categoryId, page = 1, perPage = 20) {
  try {
    const data = await bbjdFetch(
      `/posts?category=${categoryId}&per_page=${perPage}&page=${page}`,
      {
        tags: ["posts", `category-posts-${categoryId}`],
        revalidate: 3600,
      }
    );

    return data.posts || [];
  } catch (error) {
    console.error("Failed to fetch category posts:", error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return { title: "Category Not Found | Big Brother Junkies" };
  }

  const name = decodeHtml(category.name);
  const description =
    category.description ||
    `Browse all ${name} posts on Big Brother Junkies.`;

  return {
    title: `${name} Archives | Big Brother Junkies`,
    description,
    openGraph: {
      title: `${name} Archives | Big Brother Junkies`,
      description,
      url: `${SITE_URL}/category/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${name} Archives | Big Brother Junkies`,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/category/${slug}`,
    },
  };
}

export default async function CategoryArchivePage({ params }) {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const posts = await getCategoryPosts(category.id);
  const categoryName = decodeHtml(category.name);

  return (
    <main className="v2-primary-container">
      <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
        {/* Main Content */}
        <section id="main-left" className="flex-grow space-y-4">
          <div className="v2-primary-container-inner p-4">
            {/* Header */}
            <h1 className="font-display text-3xl md:text-4xl text-primary-500 dark:text-primary-400">
              {categoryName}
            </h1>
            {category.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {category.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {category.count} {category.count === 1 ? "post" : "posts"}
            </p>
          </div>

          {/* Top Ad */}
          <FreestarSlot placementName="bigbrotherjunkies_leaderboard_atf" />

          {/* Posts List */}
          <div className="v2-primary-container-inner p-4">
            {posts.length > 0 ? (
              <div>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
                No posts found in this category.
              </p>
            )}
          </div>

          {/* Bottom Ad */}
          <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable" />
        </section>

        {/* Sidebar */}
        <Sidebar showAds={true} />
      </div>
    </main>
  );
}
