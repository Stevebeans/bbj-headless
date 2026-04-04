import Image from "next/image";
import Link from "next/link";

/**
 * Related blog posts for a season
 */
export function SeasonArticles({ posts, totalCount, seasonSlug }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section id="articles" className="v2-primary-container-inner p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-primary-500 uppercase tracking-wide">Articles</h2>
        {totalCount > 0 && <span className="text-xs text-gray-400">{totalCount} posts</span>}
      </div>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link key={post.id} href={`/${post.slug}`}
            className="flex gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <div className="w-20 h-14 bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0 overflow-hidden">
              {post.featured_image ? (
                <Image src={post.featured_image} alt="" width={80} height={56} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">{"📝"}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium line-clamp-2" dangerouslySetInnerHTML={{ __html: post.title }} />
              <p className="text-xs text-gray-400 mt-1">
                {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {post.comment_count > 0 && ` · ${post.comment_count} comments`}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {totalCount > posts.length && (
        <div className="mt-3 text-center">
          <Link href={`/category/${seasonSlug}`}
            className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition">
            View all {totalCount} articles →
          </Link>
        </div>
      )}
    </section>
  );
}
