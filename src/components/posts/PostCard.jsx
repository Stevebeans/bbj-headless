import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function PostCard({ post }) {
  if (!post) return null;

  const timeAgo = post.date
    ? formatDistanceToNow(new Date(post.date), { addSuffix: true })
    : "";

  return (
    <article className="card flex flex-col md:flex-row gap-4">
      {/* Featured Image */}
      {post.featuredImage && (
        <Link
          href={`/posts/${post.slug}`}
          className="block md:w-48 lg:w-64 flex-shrink-0"
        >
          <div className="relative aspect-video md:aspect-[4/3] rounded-lg overflow-hidden">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 256px"
            />
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Categories */}
        {post.categories && post.categories.length > 0 && (
          <div className="flex gap-2 mb-2">
            {post.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="text-xs font-medium text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="font-osw text-xl font-semibold mb-2">
          <Link
            href={`/posts/${post.slug}`}
            className="text-gray-900 dark:text-white hover:text-primary-500 dark:hover:text-secondary-500 transition-colors"
            dangerouslySetInnerHTML={{ __html: post.title }}
          />
        </h2>

        {/* Excerpt */}
        <div
          className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3"
          dangerouslySetInnerHTML={{ __html: post.excerpt }}
        />

        {/* Meta */}
        <div className="flex items-center gap-4 mt-auto text-sm text-gray-500 dark:text-gray-400">
          {/* Author */}
          <div className="flex items-center gap-2">
            {post.author?.avatar && (
              <Image
                src={post.author.avatar}
                alt={post.author.name || "Author"}
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span>{post.author?.name || "Unknown"}</span>
          </div>

          {/* Time */}
          <time dateTime={post.date}>{timeAgo}</time>

          {/* Comments */}
          {post.commentCount > 0 && (
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              {post.commentCount}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
