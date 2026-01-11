import { getPost, getAllPostSlugs, getRelatedPosts } from "@/lib/api/posts";
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  const cleanTitle = post.title?.replace(/<[^>]*>/g, "") || "";
  const cleanExcerpt = post.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160) || "";

  return {
    title: cleanTitle,
    description: cleanExcerpt,
    openGraph: {
      title: cleanTitle,
      description: cleanExcerpt,
      url: `${SITE_URL}/posts/${slug}`,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.modified || post.date,
      authors: [post.author?.name || "Big Brother Junkies"],
      images: post.featuredImage
        ? [
            {
              url: post.featuredImage,
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
      images: post.featuredImage ? [post.featuredImage] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/posts/${slug}`,
    },
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  // Fetch related posts from the first category
  const firstCategoryId = post.categoryIds?.[0];
  const relatedPosts = await getRelatedPosts(post.id, firstCategoryId, 4);

  // Fetch feed updates if this is a "Live Feed Thread" post
  let feedUpdatesData = null;
  if (post.liveFeedThread) {
    feedUpdatesData = await getFeedUpdatesByDate(post.date);
  }

  return (
    <>
      <PostJsonLd post={post} siteUrl={SITE_URL} />

      <main className="v2-primary-container">
        <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
          {/* Main Content */}
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner">
              {/* Title */}
              <h1
                className="font-display text-3xl md:text-4xl text-primary-500 dark:text-primary-400 p-2"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />

              {/* Hero Image */}
              <PostHero
                title={post.title}
                featuredImage={post.featuredImage}
                commentCount={post.commentCount}
              />

              {/* Meta: Date, Author, Breadcrumbs */}
              <PostMeta
                date={post.date}
                modified={post.modified}
                author={post.author}
                categories={post.categories}
              />

              <div className="p-2">
                {/* Quick Links (Social Follow) */}
                <QuickLinks />

                {/* Before Content Ad */}
                <AdPlaceholder slot="before-content" minHeight="100px" className="mb-4" />

                {/* Article Body with In-Content Ads */}
                <ContentWithAds
                  content={post.content}
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

                {/* Feed Updates (if Live Feed Thread is enabled) */}
                {feedUpdatesData && (
                  <FeedUpdates
                    updates={feedUpdatesData.updates}
                    dateFormatted={feedUpdatesData.date_formatted}
                    total={feedUpdatesData.total}
                  />
                )}

                {/* Related Posts */}
                <RelatedPosts posts={relatedPosts} />
              </div>
            </article>

            {/* Comments Section */}
            <section className="v2-primary-container-inner p-4">
              <CommentSection postId={post.id} initialCommentCount={post.commentCount} />
            </section>
          </section>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </main>
    </>
  );
}
