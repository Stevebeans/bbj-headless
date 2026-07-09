import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "./SectionHeader";

// Show "Updated" only when modified is meaningfully after publish (old-theme
// parity: 5-minute threshold in bbj_time_tags).
function formatUpdatedDate(post) {
  if (!post?.modified || !post?.date) return null;
  const published = new Date(post.date).getTime();
  const modified = new Date(post.modified).getTime();
  if (!Number.isFinite(published) || !Number.isFinite(modified)) return null;
  if (modified - published <= 5 * 60 * 1000) return null;
  return new Date(post.modified).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });
}

export function Hero({ post, season }) {
  if (!post) return null;

  const seasonNum = season?.number ?? 0;
  const seasonName = season?.full_name || "Big Brother";

  const masthead = seasonNum > 0
    ? `Latest Big Brother ${seasonNum} Spoilers`
    : "Latest Big Brother Spoilers";

  const kickerParts = [
    seasonNum > 0 ? `BB${seasonNum}` : null,
    seasonName,
  ].filter(Boolean);
  const kicker = kickerParts.join(" · ");

  const badgeText = seasonName;

  const commentCount = post.comment_count ?? 0;
  const updatedDate = formatUpdatedDate(post);

  return (
    <article
      className="v2-primary-container-inner p-5 md:p-[22px]"
      aria-labelledby="featured-post-title"
    >
      {/* Page H1 — defines the page topic for SEO */}
      <SectionHeader as="h1">{masthead}</SectionHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image */}
        <Link
          href={`/${post.slug}`}
          className="block group/hero relative"
          aria-label={post.title}
        >
          <div className="aspect-[4/3] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            {post.featured_image?.desktop && (
              <Image
                src={post.featured_image.desktop}
                alt={post.title}
                width={800}
                height={600}
                className="w-full h-full object-cover group-hover/hero:scale-[1.02] transition-transform duration-300"
                priority
                fetchPriority="high"
                sizes="(min-width: 768px) 50vw, 100vw"
              />
            )}
          </div>
          <span className="absolute top-3 left-3 inline-block bg-accent-red text-white px-2 py-1 text-[11px] font-osw uppercase tracking-wider">
            {badgeText}
          </span>
        </Link>

        {/* Content */}
        <div className="flex flex-col">
          {kicker && (
            <div className="flex items-center gap-2 text-accent-red font-osw uppercase tracking-wider text-xs">
              <span className="w-1.5 h-1.5 bg-accent-red rounded-full inline-block" />
              <span>{kicker}</span>
            </div>
          )}

          <h2
            id="featured-post-title"
            className={`${kicker ? "mt-3" : ""} font-display font-bold text-3xl md:text-4xl lg:text-5xl leading-tight text-gray-900 dark:text-gray-100`}
          >
            <Link
              href={`/${post.slug}`}
              className="no-underline hover:text-primary-500 dark:hover:text-secondary-500"
            >
              {post.title}
            </Link>
          </h2>

          {post.excerpt && (
            <p className="mt-3 text-gray-700 dark:text-gray-300 leading-relaxed">
              {post.excerpt}
            </p>
          )}

          {/* No data-nosnippet on this row: the <time> tags are how Google
              picks the snippet date, so they must stay snippet-eligible. */}
          <div className="mt-auto pt-4 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-osw">
            {post.author?.avatar && (
              <span className="inline-block w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                <Image
                  src={post.author.avatar}
                  alt={post.author?.name || ""}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </span>
            )}
            {post.author?.name && (
              <>
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {post.author.name}
                </span>
                <span>·</span>
              </>
            )}
            <time dateTime={post.date}>{post.date_formatted}</time>
            {updatedDate && (
              <>
                <span>·</span>
                <time dateTime={post.modified}>Updated {updatedDate}</time>
              </>
            )}
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {commentCount}
              </span>
              {commentCount === 1 ? "Comment" : "Comments"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
