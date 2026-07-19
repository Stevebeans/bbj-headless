import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { BeanBotNotice } from "@/components/home/BeanBotNotice";
import AskBeanPrompt from "@/components/bean/AskBeanPrompt";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import { CommentSection } from "@/components/comments";
import { FeedUpdateVoting } from "./FeedUpdateVoting";
import { getFeedUpdateBySlug, getFeedUpdates } from "@/lib/api/feedUpdates";
import { SITE_URL, ORG_LOGO, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = false; // Pure webhook-driven — feed updates don't change after posting
export const dynamicParams = true;

// Empty array — we don't pre-render feed updates, but generateStaticParams
// is required for Next.js 15 to register this route for ISR caching.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const update = await getFeedUpdateBySlug(slug);

  if (!update) {
    return {
      title: "Update Not Found",
    };
  }

  // Strip HTML and truncate for description
  const plainText = update.content?.replace(/<[^>]*>/g, "") || "";
  const description = plainText.slice(0, 160) + (plainText.length > 160 ? "..." : "");

  return {
    title: update.title,
    description,
    alternates: {
      canonical: `${SITE_URL}/live-feed-updates/${slug}`,
    },
    openGraph: {
      title: update.title,
      description,
      type: "article",
      publishedTime: update.date,
      modifiedTime: update.modified,
      authors: [update.author?.name],
      images: update.thumbnail ? [{ url: update.thumbnail }] : [{ url: ORG_LOGO }],
    },
  };
}

export default async function FeedUpdatePage({ params }) {
  const { slug } = await params;
  const update = await getFeedUpdateBySlug(slug);

  if (!update) {
    notFound();
  }

  const url = `${SITE_URL}/live-feed-updates/${update.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: update.title,
    datePublished: update.date,
    dateModified: update.modified || update.date,
    author: { "@type": "Person", name: update.author?.name || "Big Brother Junkies" },
    ...(update.thumbnail ? { image: update.thumbnail } : { image: ORG_LOGO }),
    mainEntityOfPage: url,
    url,
    publisher: {
      "@type": "Organization",
      name: "Big Brother Junkies",
      logo: { "@type": "ImageObject", url: ORG_LOGO },
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    ...breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Live Feed Updates", path: "/live-feed-updates" },
      { name: update.title, path: `/live-feed-updates/${update.slug}` },
    ]),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <SpoilerBarWrapper />
      <main className="v2-primary-container">
      <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
        {/* Main Content */}
        <section id="main-left" className="flex-grow space-y-4">
          <article className="v2-primary-container-inner">
            {/* Breadcrumb */}
            <nav className="text-sm text-gray-500 dark:text-gray-400 p-2 border-b border-gray-200 dark:border-gray-700">
              <Link href="/" className="hover:text-primary-500">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/live-feed-updates" className="hover:text-primary-500">
                Feed Updates
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-700 dark:text-gray-300">Update</span>
            </nav>

            {/* Title */}
            <h1 className="font-display text-2xl md:text-3xl text-primary-500 dark:text-primary-400 p-4">
              {update.title}
            </h1>

            {/* Header with Author & Meta */}
            <div className="px-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start gap-4">
                {/* Author Avatar */}
                {update.author?.avatar && (
                  <Image
                    src={update.author.avatar}
                    alt={update.author.name}
                    width={56}
                    height={56}
                    className="rounded-full w-14 h-14 shrink-0"
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {update.author?.name}
                    </span>

                    {/* Mode Badge */}
                    {update.mode && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          update.mode === "show"
                            ? "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400"
                            : "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                        }`}
                      >
                        {update.mode === "show" ? "Show Update" : "Feed Update"}
                      </span>
                    )}
                  </div>

                  <time
                    dateTime={update.date}
                    className="text-sm text-gray-500 dark:text-gray-400"
                    data-nosnippet
                  >
                    {update.date_formatted} at {update.time}
                    {update.modified !== update.date && (
                      <span className="ml-2 text-gray-400">(edited)</span>
                    )}
                  </time>
                </div>
              </div>
              {update.author?.is_bot && <BeanBotNotice className="mt-3" />}
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Video clip (takes the featured spot when present) */}
              {update.video?.url && (
                <div className="mb-6">
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <video
                    src={update.video.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="rounded-lg w-full h-auto bg-black"
                  />
                </div>
              )}

              {/* Featured Image */}
              {!update.video?.url && update.thumbnail && (
                <div className="mb-6">
                  <Image
                    src={update.thumbnail}
                    alt={update.title}
                    width={800}
                    height={450}
                    priority
                    className="rounded-lg w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Update Content */}
              <div
                className="prose prose-lg dark:prose-invert max-w-none feed-content
                  prose-a:text-primary-500 hover:prose-a:text-primary-600
                  prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: update.content }}
              />
            </div>

            {/* Footer - Voting & Social Shares */}
            <div className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Voting */}
                <FeedUpdateVoting
                  updateId={update.id}
                  initialVotes={{
                    total: update.votes?.total || 0,
                    user_vote: update.votes?.user_vote || 0,
                  }}
                />

                {/* Share */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Share:</span>
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      update.title
                    )}&url=${encodeURIComponent(`${SITE_URL}/live-feed-updates/${update.slug}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-[#1DA1F2] transition-colors"
                    aria-label="Share on Twitter"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      `${SITE_URL}/live-feed-updates/${update.slug}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-400 hover:text-[#1877F2] transition-colors"
                    aria-label="Share on Facebook"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </article>

          {/* Premium funnel E1: static, cache-safe Bean entry point. */}
          <AskBeanPrompt
            question="Catch me up on today's Big Brother feeds"
            label="Want the full story?"
          />

          {/* Static in-content unit — these pages are too short for dynamic
              insertion to place more than one ad (Freestar rec, 2026-07-17). */}
          <FreestarSlot
            placementName="bigbrotherjunkies_article_incontent_live_feed_updates"
            slotId="live_feed_update_incontent"
          />

          {/* Comments Section — routes to today's live thread when this update
              belongs to one; otherwise the update's own comments (fallback). */}
          <section id="comments" className="v2-primary-container-inner p-4">
            {update.thread && (
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Discussion happens in today's live thread:{" "}
                <Link
                  href={`/${update.thread.slug}`}
                  className="text-primary-500 hover:text-primary-600 hover:underline"
                >
                  {update.thread.title || "today's live thread"}
                </Link>
              </p>
            )}
            <CommentSection
              postId={update.thread?.id ?? update.id}
              initialCommentCount={update.thread?.comment_count ?? (update.comment_count || 0)}
            />
          </section>
        </section>

        {/* Sidebar */}
        <Sidebar showAds={true}>
          <SubscribeWidget />
        </Sidebar>
      </div>
    </main>
    </>
  );
}
