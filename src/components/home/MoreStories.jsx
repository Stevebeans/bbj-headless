import Image from "next/image";
import Link from "next/link";

export function MoreStories({ posts = [], heroId = null }) {
  // Filter out the hero post if provided
  const filteredPosts = heroId
    ? posts.filter((post) => post.id !== heroId)
    : posts;

  if (filteredPosts.length === 0) return null;

  return (
    <section className="v2-primary-container-inner p-4" aria-labelledby="more-posts">
      <h2 id="more-posts" className="v2-primary-subheader">
        More Stories & News
      </h2>

      <div className="divide-y divide-gray-300 dark:divide-gray-700">
        {filteredPosts.map((post) => (
          <StoryCard key={post.id} post={post} />
        ))}
      </div>

      {/* View More Link */}
      <div className="w-full text-center mt-6 text-xl font-display">
        <Link
          href="/page/2"
          className="text-primary-500 hover:text-primary-600 dark:text-primary-400"
        >
          View More Stories & News Here
        </Link>
      </div>
    </section>
  );
}

function StoryCard({ post }) {
  return (
    <article className="flex flex-col md:flex-row py-4 gap-4 group hover:bg-gray-50 dark:hover:bg-gray-800/30 rounded-lg px-2 -mx-2 transition-all duration-200">
      {/* Thumbnail */}
      {post.featuredImage && (
        <div className="flex-shrink-0 w-full md:w-[250px] overflow-hidden rounded-lg">
          <Link href={`/posts/${post.slug}`}>
            <Image
              src={post.featuredImage}
              alt={post.title}
              width={250}
              height={150}
              className="w-full h-[150px] object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-xl md:text-2xl text-primary-500 dark:text-primary-400">
          <Link href={`/posts/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>

        {/* Meta */}
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
          <time dateTime={post.date}>{post.dateFormatted || post.date}</time>
          {post.timeAgo && (
            <span className="hidden lg:inline text-gray-400" data-nosnippet>
              • {post.timeAgo}
            </span>
          )}
        </div>

        {/* Excerpt */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Author & Comments */}
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-3">
          <span>{post.author?.name}</span>
          <span>
            {post.commentCount === 0
              ? "No comments"
              : post.commentCount === 1
              ? "1 comment"
              : `${post.commentCount} comments`}
          </span>
        </div>
      </div>
    </article>
  );
}
