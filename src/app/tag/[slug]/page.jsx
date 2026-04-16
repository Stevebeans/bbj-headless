import { notFound } from "next/navigation";
import { wpRestFetch, bbjdFetch } from "@/lib/api/wordpress";
import { PostCard } from "@/components/posts/PostCard";
import { Sidebar } from "@/components/layout/Sidebar";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { decodeHtml } from "@/lib/utils/decodeHtml";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

async function getTag(slug) {
  try {
    const tags = await wpRestFetch(`/tags?slug=${encodeURIComponent(slug)}`, {
      tags: ["tags", `tag-${slug}`],
      revalidate: 3600,
    });

    if (!tags.length) return null;
    return tags[0];
  } catch (error) {
    console.error("Failed to fetch tag:", error);
    return null;
  }
}

async function getTagPosts(tagId, page = 1, perPage = 20) {
  try {
    const data = await bbjdFetch(
      `/posts?tag=${tagId}&per_page=${perPage}&page=${page}`,
      {
        tags: ["posts", `tag-posts-${tagId}`],
        revalidate: 3600,
      }
    );

    return data.posts || [];
  } catch (error) {
    console.error("Failed to fetch tag posts:", error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    return { title: "Tag Not Found | Big Brother Junkies" };
  }

  const name = decodeHtml(tag.name);
  const description =
    tag.description || `Browse all posts tagged ${name} on Big Brother Junkies.`;

  return {
    title: `${name} Archives | Big Brother Junkies`,
    description,
    openGraph: {
      title: `${name} Archives | Big Brother Junkies`,
      description,
      url: `${SITE_URL}/tag/${slug}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${name} Archives | Big Brother Junkies`,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/tag/${slug}`,
    },
  };
}

export default async function TagArchivePage({ params }) {
  const { slug } = await params;
  const tag = await getTag(slug);

  if (!tag) {
    notFound();
  }

  const posts = await getTagPosts(tag.id);
  const tagName = decodeHtml(tag.name);

  return (
    <main className="v2-primary-container">
      <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
        <section id="main-left" className="flex-grow space-y-4">
          <div className="v2-primary-container-inner p-4">
            <h1 className="font-display text-3xl md:text-4xl text-primary-500 dark:text-primary-400">
              {tagName}
            </h1>
            {tag.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {tag.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              {tag.count} {tag.count === 1 ? "post" : "posts"} tagged
            </p>
          </div>

          <FreestarSlot placementName="bigbrotherjunkies_leaderboard_atf" />

          <div className="v2-primary-container-inner p-4">
            {posts.length > 0 ? (
              <div>
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 py-8 text-center">
                No posts found for this tag.
              </p>
            )}
          </div>

          <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable" />
        </section>

        <Sidebar showAds={true} />
      </div>
    </main>
  );
}
