import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

export function PostMeta({ date, modified, author, categories = [] }) {
  const formattedDate = date
    ? format(new Date(date), "MMMM d, yyyy")
    : "";

  const timeAgo = date
    ? formatDistanceToNow(new Date(date), { addSuffix: true })
    : "";

  const wasModified = modified && modified !== date;
  const modifiedDate = wasModified
    ? format(new Date(modified), "MMMM d, yyyy")
    : null;

  return (
    <div className="p-2">
      {/* Time / Updated */}
      <div className="-mt-1 bg-white dark:bg-gray-900 pb-1 w-fit flex items-center rounded-tr-md font-sans text-xs text-slate-700 dark:text-slate-300">
        <time dateTime={date}>{formattedDate}</time>
        {wasModified && (
          <span className="ml-2 text-gray-500">
            (Updated: <time dateTime={modified}>{modifiedDate}</time>)
          </span>
        )}
        {timeAgo && (
          <span
            className="ml-2 text-xs hidden lg:block text-gray-400"
            data-nosnippet
          >
            {timeAgo}
          </span>
        )}
      </div>

      {/* Author + Breadcrumbs */}
      <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-2">
        <div className="flex items-center">
          {author?.avatar && (
            <Image
              src={author.avatar}
              alt={author.name || "Author"}
              width={32}
              height={32}
              className="rounded-full w-8 h-8 mr-2"
            />
          )}
          <div className="text-gray-500 dark:text-gray-400">
            Author: <span className="font-bold">{author?.name || "Unknown"}</span>
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav
          className="text-gray-500 dark:text-gray-400 hidden md:block text-sm"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-1">
            <li>
              <Link href="/" className="hover:text-primary-500">
                Home
              </Link>
            </li>
            <li className="text-gray-400">/</li>
            {categories.length > 0 && (
              <>
                <li>
                  <span>{categories[0]}</span>
                </li>
                <li className="text-gray-400">/</li>
              </>
            )}
            <li className="text-gray-700 dark:text-gray-300">Article</li>
          </ol>
        </nav>
      </div>
    </div>
  );
}
