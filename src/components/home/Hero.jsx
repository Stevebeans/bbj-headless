import Image from "next/image";
import Link from "next/link";

export function Hero({ post, season }) {
  if (!post) return null;

  return (
    <article className="v2-primary-container-inner" aria-labelledby="featured-post-title">
      {/* Section Header */}
      <div className="pb-3 mb-5 border-b border-gray-200 dark:border-gray-700 px-3 pt-3">
        <h2 className="font-osw text-lg md:text-xl uppercase tracking-wide text-primary-500 dark:text-secondary-500 m-0">
          Latest Update
        </h2>
      </div>

      {/* Hero Image */}
      <div className="relative h-[250px] md:h-[333px] bg-gray-100 dark:bg-gray-800 overflow-hidden group/hero">
        <Link href={`/${post.slug}`} className="absolute inset-0" aria-label={post.title}>
          {post.featured_image?.desktop && (
            <Image
              src={post.featured_image.desktop}
              alt={post.title}
              fill
              className="object-cover group-hover/hero:scale-[1.02] transition-transform duration-500"
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 1024px, 100vw"
            />
          )}
        </Link>

        {/* Comment Count Badge */}
        <div className="absolute bottom-0 left-0 z-10">
          <div className="bg-white dark:bg-gray-800 px-4 py-1 rounded-tr-md font-sans text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {post.comment_count === 0
              ? "No comments"
              : post.comment_count === 1
              ? "1 comment"
              : `${post.comment_count} comments`}
          </div>
        </div>

        {/* Read More Button */}
        <div className="absolute bottom-4 right-4 z-10">
          <Link
            href={`/${post.slug}`}
            aria-label={`Read more about ${post.title}`}
            className="inline-flex items-center text-sm md:text-base rounded px-3 md:px-4 py-1.5 font-bold text-white bg-gradient-to-r from-red-400 to-red-700 hover:from-red-500 hover:to-red-800 transition-colors"
          >
            Read More<span className="sr-only">: {post.title}</span>
          </Link>
        </div>
      </div>

      {/* Post Info */}
      <div className="p-3">
        <h3 className="font-display text-2xl md:text-4xl text-primary-500 dark:text-primary-400">
          <Link href={`/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1">
          <time dateTime={post.date}>{post.date_formatted}</time>
          <span data-nosnippet className="text-gray-500">
            • {post.time_ago}
          </span>
        </div>

        {/* Excerpt */}
        <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-3">
          {post.excerpt}
        </p>
      </div>
    </article>
  );
}
