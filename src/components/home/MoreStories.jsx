import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function MoreStories({ posts = [], heroId = null }) {
  // Filter out the hero post if provided
  const filteredPosts = heroId
    ? posts.filter((post) => post.id !== heroId)
    : posts;

  if (filteredPosts.length === 0) return null;

  return (
    <section aria-labelledby="more-posts">
      <h2 id="more-posts" className="v2-primary-subheader mb-3">
        More Stories & News
      </h2>

      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <StoryCard key={post.id} post={post} />
        ))}
      </div>

      {/* View More Link */}
      <div className="w-full text-center mt-4 py-3 text-xl font-display">
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
    <article className="flex flex-col md:flex-row md:flex-wrap p-3 gap-x-4 gap-y-0 group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-3 border-l-primary-400 dark:border-l-primary-500 rounded-lg shadow-sm hover:border-gray-300 dark:hover:border-gray-600 hover:border-l-primary-500 dark:hover:border-l-primary-400 hover:shadow transition-all duration-200">
      {/* Thumbnail */}
      {post.featuredImage && (
        <div className="flex-shrink-0 w-full md:w-[250px] overflow-hidden rounded-lg">
          <Link href={`/${post.slug}`}>
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
          <Link href={`/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>

        {/* Meta */}
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1" data-nosnippet>
          {post.date
            ? formatDistanceToNow(new Date(post.date), { addSuffix: true })
            : ""}
        </div>

        {/* Excerpt */}
        <div
          className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: post.excerpt }}
        />

      </div>

      {/* Author & Comments - full width footer */}
      <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 w-full basis-full">
        <span>{post.author?.name}</span>
        <span>
          {post.commentCount === 0
            ? "No comments"
            : post.commentCount === 1
            ? "1 comment"
            : `${post.commentCount} comments`}
        </span>
      </div>
    </article>
  );
}
