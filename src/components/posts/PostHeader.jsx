import Image from "next/image";
import { format } from "date-fns";
import { ShareButtons } from "./ShareButtons";

function calcReadTime(html) {
  const text = (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 200));
}

function formatPostTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const date = format(d, "MMM d, yyyy");
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Los_Angeles",
    });
    return `${date} · ${time} PT`;
  } catch {
    return "";
  }
}

export function PostHeader({
  title,
  date,
  author,
  categories = [],
  commentCount = 0,
  content = "",
  shareUrl = "",
}) {
  const readMin = calcReadTime(content);
  const published = formatPostTime(date);

  return (
    <header>
      {/* Kicker — categories with red dot */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-4 text-xs font-osw uppercase tracking-wider text-accent-red">
          <span className="inline-flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-red" aria-hidden="true" />
            {categories.map((cat, i) => (
              <span key={cat} className="inline-flex items-center gap-3">
                {i > 0 && (
                  <span className="text-gray-400 dark:text-gray-500" aria-hidden="true">
                    ·
                  </span>
                )}
                <span>{cat}</span>
              </span>
            ))}
          </span>
        </div>
      )}

      {/* Title */}
      <h1
        className="font-display text-3xl md:text-4xl leading-[1.1] font-bold text-gray-900 dark:text-gray-100 mb-4"
        dangerouslySetInnerHTML={{ __html: title }}
      />

      {/* Byline strip */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-t border-b border-gray-200 dark:border-gray-700 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {author?.avatar && (
            <Image
              src={author.avatar}
              alt={author.name || ""}
              width={44}
              height={44}
              className="rounded-full shrink-0 w-11 h-11 object-cover"
            />
          )}
          <div className="min-w-0">
            <div className="font-osw uppercase tracking-wider text-sm text-gray-900 dark:text-gray-100 truncate">
              {author?.name || "Big Brother Junkies"}
            </div>
            <div
              className="text-xs text-gray-500 dark:text-gray-400 font-osw uppercase tracking-wider flex flex-wrap gap-x-2"
              data-nosnippet
            >
              {published && (
                <span>
                  Published{" "}
                  <time dateTime={date}>{published}</time>
                </span>
              )}
              <span aria-hidden="true">·</span>
              <span>{readMin} min read</span>
              {commentCount > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href="#comments"
                    className="hover:text-primary-500 dark:hover:text-secondary-500"
                  >
                    {commentCount} {commentCount === 1 ? "comment" : "comments"}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <ShareButtons url={shareUrl} title={(title || "").replace(/<[^>]*>/g, "")} />
      </div>
    </header>
  );
}
