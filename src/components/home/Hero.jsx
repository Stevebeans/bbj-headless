import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "./SectionHeader";

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

          <div
            className="mt-auto pt-4 flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-osw"
            data-nosnippet
          >
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
          </div>
        </div>
      </div>
    </article>
  );
}
