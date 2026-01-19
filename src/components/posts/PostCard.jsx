import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

export function PostCard({ post }) {
  if (!post) return null;

  const timeAgo = post.date
    ? formatDistanceToNow(new Date(post.date), { addSuffix: true })
    : "";

  const formattedDate = post.date
    ? format(new Date(post.date), "MMM d, yyyy")
    : "";

  const commentText =
    post.commentCount === 0
      ? "No comments"
      : post.commentCount === 1
      ? "1 comment"
      : `${post.commentCount} comments`;

  return (
    <article className="border-b border-gray-300 dark:border-gray-700 flex flex-col md:flex-row py-4">
      {/* Featured Image */}
      <div className="flex-shrink-0 w-full md:w-[250px]">
        <Link href={`/${post.slug}`}>
          {post.featuredImage ? (
            <div className="relative h-[150px] w-full rounded-lg overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, 250px"
              />
            </div>
          ) : (
            <div className="h-[150px] w-full rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-gray-400 dark:text-gray-500 text-sm">No image</span>
            </div>
          )}
        </Link>
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 w-full pl-0 md:pl-4 pt-3 md:pt-0">
        {/* Row 1 - Title and Excerpt span full width */}
        <div className="col-span-2">
          <h3 className="font-display text-2xl text-gray-900 dark:text-white">
            <Link
              href={`/${post.slug}`}
              className="hover:text-primary-500 dark:hover:text-secondary-500 transition-colors"
              dangerouslySetInnerHTML={{ __html: post.title }}
            />
          </h3>

          {/* Time info */}
          <div className="text-xs flex items-center text-gray-500 dark:text-gray-400 mt-1">
            <time dateTime={post.date}>{formattedDate}</time>
            <span className="ml-2 hidden lg:inline">{timeAgo}</span>
          </div>

          {/* Excerpt */}
          <div
            className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3"
            dangerouslySetInnerHTML={{ __html: post.excerpt }}
          />
        </div>

        {/* Row 2 - Author and Comments */}
        <div className="text-sm text-gray-500 dark:text-gray-400 text-left mt-3">
          {post.author?.name || "Unknown"}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 text-right mt-3">
          <span className="flex items-center justify-end gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {commentText}
          </span>
        </div>
      </div>
    </article>
  );
}
