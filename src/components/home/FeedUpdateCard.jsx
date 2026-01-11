import Image from "next/image";
import Link from "next/link";

export function FeedUpdateCard({ update }) {
  return (
    <Link
      href={update.permalink}
      className="group block w-full rounded-md text-inherit hover:text-primary-500 dark:text-gray-200"
    >
      <article
        id={update.slug}
        className="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:shadow-sm transition-all duration-200"
      >
        {/* Author Header */}
        <div className="flex gap-3 mb-3 items-center">
          {update.author?.avatar && (
            <Image
              src={update.author.avatar}
              alt={update.author.name}
              width={40}
              height={40}
              className="rounded-full w-10 h-10"
            />
          )}
          <div className="flex flex-col leading-tight">
            <span className="font-sans font-semibold text-gray-600 dark:text-gray-300 text-sm">
              {update.author?.name}
            </span>
            <time
              dateTime={update.modified}
              className="text-xs text-gray-500 dark:text-gray-400"
              data-nosnippet
            >
              {update.time_ago}
            </time>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-sans font-semibold text-primary-500 dark:text-primary-400 group-hover:underline">
          {update.title}
        </h3>

        {/* Content Preview */}
        <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 mb-2">
          {update.thumbnail ? (
            <div className="float-right ml-3 mb-2">
              <Image
                src={update.thumbnail}
                alt=""
                width={120}
                height={80}
                className="rounded-lg object-cover"
              />
            </div>
          ) : null}
          <div
            className="line-clamp-3 feed-content"
            dangerouslySetInnerHTML={{ __html: update.content }}
          />
        </div>

        {/* Footer */}
        <div className="text-xs text-right border-t border-gray-300 dark:border-gray-600 pt-2 text-slate-600 dark:text-slate-400 clear-both">
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {update.comment_count} {update.comment_count === 1 ? "Comment" : "Comments"}
        </div>
      </article>
    </Link>
  );
}
