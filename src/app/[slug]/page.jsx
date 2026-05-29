import { getContent, getRelatedPosts } from "@/lib/api/posts";
import { getSeasons } from "@/lib/api/seasons";
import { wpFetch } from "@/lib/api/wordpress";
import { autoLinkEntities, buildSeasonEntityMap } from "@/lib/utils/autoLink";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { PostHero } from "@/components/posts/PostHero";
import { PostHeader } from "@/components/posts/PostHeader";
import { PostJsonLd } from "@/components/posts/PostJsonLd";
import { QuickLinks } from "@/components/posts/QuickLinks";
import { RelatedPosts } from "@/components/posts/RelatedPosts";
import { LiveUpdateTimeline } from "@/components/posts/LiveUpdateTimeline";
import { ContentWithAds } from "@/components/posts/ContentWithAds";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import { CommentSection } from "@/components/comments";
import { JumpToComments } from "@/components/posts/JumpToComments";
import { breadcrumbJsonLd } from "@/lib/seo";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const revalidate = false; // Pure webhook-driven — rebuild only when WP fires /api/revalidate
export const dynamicParams = true; // Allow slugs not in generateStaticParams — they'll be ISR-cached on first hit

export async function generateStaticParams() {
  return []; // No pre-rendering — pages ISR-cache on first visit
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const content = await getContent(slug);

  if (!content) {
    return { title: "Not Found" };
  }

  const cleanTitle = content.title?.replace(/<[^>]*>/g, "") || "";
  const cleanExcerpt = content.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160) || "";
  const isPage = content.type === "page";

  return {
    title: cleanTitle,
    description: cleanExcerpt,
    openGraph: {
      title: cleanTitle,
      description: cleanExcerpt,
      url: `${SITE_URL}/${slug}`,
      type: isPage ? "website" : "article",
      ...(isPage ? {} : {
        publishedTime: content.date,
        modifiedTime: content.modified || content.date,
        authors: [content.author?.name || "Big Brother Junkies"],
      }),
      images: content.featuredImage
        ? [
            {
              url: content.featuredImage,
              width: 1200,
              height: 630,
              alt: cleanTitle,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: cleanTitle,
      description: cleanExcerpt,
      images: content.featuredImage ? [content.featuredImage] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/${slug}`,
    },
  };
}

export default async function ContentPage({ params }) {
  const { slug } = await params;
  const content = await getContent(slug);

  if (!content) {
    notFound();
  }

  const isPage = content.type === "page";
  const showAds = !isPage && !content.hideAds;

  // Only fetch related posts for posts (not pages)
  let relatedPosts = [];
  let adInterval = 5;

  // Fetch seasons for auto-linking (runs in parallel with other fetches)
  const seasonsPromise = getSeasons();

  if (!isPage) {
    const firstCategoryId = content.categoryIds?.[0];
    const [related, adSettings] = await Promise.all([
      getRelatedPosts(content.id, firstCategoryId, 4),
      wpFetch("/bbjd/v1/ad-settings", { revalidate: 3600 }).catch(() => ({})),
    ]);
    relatedPosts = related;
    adInterval = adSettings.incontent_interval || 5;
  }

  const { seasons } = await seasonsPromise;
  const seasonEntities = buildSeasonEntityMap(seasons);
  const linkedContent = autoLinkEntities(content.content, seasonEntities);

  const cleanTitle = content.title?.replace(/<[^>]*>/g, "") || "";
  const breadcrumb = {
    "@context": "https://schema.org",
    ...breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: cleanTitle, path: `/${slug}` },
    ]),
  };

  return (
    <>
      {!isPage && <PostJsonLd post={content} siteUrl={SITE_URL} />}
      {!isPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
        />
      )}
      {!isPage && <SpoilerBarWrapper />}

      <main className="v2-primary-container">
        <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
          {/* Main Content */}
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner p-5 md:p-[22px]">
              {isPage ? (
                <>
                  <h1
                    className="font-display text-3xl md:text-4xl text-primary-500 dark:text-primary-400 mb-4"
                    dangerouslySetInnerHTML={{ __html: content.title }}
                  />
                  {content.featuredImage && (
                    <PostHero
                      title={content.title}
                      featuredImage={content.featuredImage}
                    />
                  )}
                </>
              ) : (
                <>
                  <PostHeader
                    title={content.title}
                    date={content.date}
                    author={content.author}
                    categories={content.categories}
                    commentCount={content.commentCount}
                    content={content.content}
                    shareUrl={`${SITE_URL}/${slug}`}
                  />
                  <PostHero
                    title={content.title}
                    featuredImage={content.featuredImage}
                  />
                </>
              )}

              <div className="mt-6">
                {/* Quick Links (Social Follow) - only for posts */}
                {!isPage && <QuickLinks />}

                {/* Before Content Ad - only for posts without hideAds */}
                {showAds && (
                  <FreestarSlot placementName="bigbrotherjunkies_leaderboard_atf" className="mb-4" />
                )}

                {/* Article Body with In-Content Ads (posts) or plain content (pages) */}
                {isPage ? (
                  <div
                    className="prose-base prose-slate
                      max-w-none dark:prose-invert
                      break-words selection:bg-yellow-200 selection:text-black
                      prose-headings:font-display prose-h2:scroll-mt-24 prose-h3:scroll-mt-24
                      prose-a:no-underline hover:prose-a:underline prose-a:text-primary-500 hover:prose-a:text-primary-600
                      prose-img:rounded-lg prose-img:mx-auto
                      prose-figcaption:text-sm prose-figcaption:text-slate-500
                      list-disc list-inside prose-li:marker:text-primary-500
                      prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                      prose-pre:rounded-md prose-pre:p-4
                      prose-table:w-full prose-th:text-left prose-td:p-2"
                    dangerouslySetInnerHTML={{ __html: linkedContent }}
                  />
                ) : (
                  <ContentWithAds
                    content={linkedContent}
                    showAds={showAds}
                    adInterval={adInterval}
                    className="prose-base prose-slate
                      max-w-none dark:prose-invert
                      break-words selection:bg-yellow-200 selection:text-black
                      prose-headings:font-display prose-h2:scroll-mt-24 prose-h3:scroll-mt-24
                      prose-a:no-underline hover:prose-a:underline prose-a:text-primary-500 hover:prose-a:text-primary-600
                      prose-img:rounded-lg prose-img:mx-auto
                      prose-figcaption:text-sm prose-figcaption:text-slate-500
                      list-disc list-inside prose-li:marker:text-primary-500
                      prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                      prose-pre:rounded-md prose-pre:p-4
                      prose-table:w-full prose-th:text-left prose-td:p-2"
                  />
                )}

                {/* Live Update Timeline - only for posts with live thread enabled */}
                {content.liveUpdates && (
                  <LiveUpdateTimeline
                    postId={content.id}
                    liveState={content.liveState}
                    closedAt={content.closedAt}
                    closingSummary={content.closingSummary}
                  />
                )}

                {/* Related Posts - only for posts */}
                {!isPage && <RelatedPosts posts={relatedPosts} />}
              </div>
            </article>

            {/* Comments Section - only for posts */}
            {!isPage && (
              <section id="comments" className="v2-primary-container-inner p-4">
                <Suspense fallback={null}>
                  <CommentSection postId={content.id} initialCommentCount={content.commentCount} />
                </Suspense>
              </section>
            )}
          </section>

          {/* Sidebar */}
          <Sidebar showAds={showAds}>
            <SubscribeWidget />
          </Sidebar>
        </div>

        {/* Floating jump to comments button - only for posts */}
        {!isPage && <JumpToComments commentCount={content.commentCount} />}
      </main>
    </>
  );
}
