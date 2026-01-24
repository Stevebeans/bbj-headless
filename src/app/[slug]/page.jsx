import { getContent, getAllContentSlugs, getRelatedPosts } from "@/lib/api/posts";
import { getFeedUpdatesByDate } from "@/lib/api/feedUpdates";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { PostHero } from "@/components/posts/PostHero";
import { PostMeta } from "@/components/posts/PostMeta";
import { PostJsonLd } from "@/components/posts/PostJsonLd";
import { QuickLinks } from "@/components/posts/QuickLinks";
import { RelatedPosts } from "@/components/posts/RelatedPosts";
import { FeedUpdates } from "@/components/posts/FeedUpdates";
import { ContentWithAds } from "@/components/posts/ContentWithAds";
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { CommentSection } from "@/components/comments";
import { JumpToComments } from "@/components/posts/JumpToComments";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

// Allow dynamic rendering for content not pre-generated at build time
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllContentSlugs();
  return slugs.map((slug) => ({ slug }));
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

  // Only fetch related posts and feed updates for posts (not pages)
  let relatedPosts = [];
  let feedUpdatesData = null;

  if (!isPage) {
    const firstCategoryId = content.categoryIds?.[0];
    relatedPosts = await getRelatedPosts(content.id, firstCategoryId, 4);

    if (content.liveFeedThread) {
      feedUpdatesData = await getFeedUpdatesByDate(content.date);
    }
  }

  return (
    <>
      {!isPage && <PostJsonLd post={content} siteUrl={SITE_URL} />}

      <main className="v2-primary-container">
        <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
          {/* Main Content */}
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner">
              {/* Title */}
              <h1
                className="font-display text-3xl md:text-4xl text-primary-500 dark:text-primary-400 p-2"
                dangerouslySetInnerHTML={{ __html: content.title }}
              />

              {/* Hero Image - only show for posts or pages with featured image */}
              {(!isPage || content.featuredImage) && (
                <PostHero
                  title={content.title}
                  featuredImage={content.featuredImage}
                  commentCount={isPage ? 0 : content.commentCount}
                />
              )}

              {/* Meta: Date, Author, Breadcrumbs - only for posts */}
              {!isPage && (
                <PostMeta
                  date={content.date}
                  modified={content.modified}
                  author={content.author}
                  categories={content.categories}
                />
              )}

              <div className="p-2">
                {/* Quick Links (Social Follow) - only for posts */}
                {!isPage && <QuickLinks />}

                {/* Before Content Ad - only for posts without hideAds */}
                {showAds && (
                  <AdPlaceholder slot="before-content" minHeight="100px" className="mb-4" />
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
                    dangerouslySetInnerHTML={{ __html: content.content }}
                  />
                ) : (
                  <ContentWithAds
                    content={content.content}
                    showAds={showAds}
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

                {/* Feed Updates - only for posts with live feed thread */}
                {feedUpdatesData && (
                  <FeedUpdates
                    updates={feedUpdatesData.updates}
                    dateFormatted={feedUpdatesData.date_formatted}
                    total={feedUpdatesData.total}
                  />
                )}

                {/* Related Posts - only for posts */}
                {!isPage && <RelatedPosts posts={relatedPosts} />}
              </div>
            </article>

            {/* Comments Section - only for posts */}
            {!isPage && (
              <section id="comments" className="v2-primary-container-inner p-4">
                <CommentSection postId={content.id} initialCommentCount={content.commentCount} />
              </section>
            )}
          </section>

          {/* Sidebar */}
          <Sidebar showAds={showAds} />
        </div>

        {/* Floating jump to comments button - only for posts */}
        {!isPage && <JumpToComments commentCount={content.commentCount} />}
      </main>
    </>
  );
}
