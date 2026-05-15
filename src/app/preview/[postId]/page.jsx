"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPost } from "@/lib/api/editor";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { QuickLinks } from "@/components/posts/QuickLinks";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";

export default function PreviewPage() {
  const { postId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }
    if (user && postId) {
      loadPost();
    }
  }, [user, authLoading, postId]);

  async function loadPost() {
    try {
      const data = await getPost(parseInt(postId));
      setPost(data);
    } catch (err) {
      console.error("Failed to load preview:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Post not found</p>
      </div>
    );
  }

  const featuredImageUrl = post.featured_image?.url || null;
  const formattedDate = post.date ? format(new Date(post.date), "MMMM d, yyyy") : "";
  const timeAgo = post.date ? formatDistanceToNow(new Date(post.date), { addSuffix: true }) : "";
  const categoryName = post.categories?.[0]?.name || "Blog";

  return (
    <>
      {/* Preview banner */}
      <div className="bg-yellow-400 text-yellow-900 text-center py-2 text-sm font-bold sticky top-0 z-50">
        {"\u26A0\uFE0F"} PREVIEW MODE — This post is not live
        <button
          onClick={() => router.push(`/editor/${postId}`)}
          className="ml-4 underline hover:no-underline"
        >
          Back to Editor
        </button>
      </div>

      <main className="v2-primary-container">
        <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
          {/* Main Content */}
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner">
              {/* Title */}
              <h1 className="font-display text-3xl md:text-4xl text-primary-500 dark:text-primary-400 p-2">
                {post.title}
              </h1>

              {/* Hero Image */}
              <div className="relative h-[250px] md:h-[333px] bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="absolute inset-0">
                  {featuredImageUrl ? (
                    <Image
                      src={featuredImageUrl}
                      alt={post.title || "Featured image"}
                      fill
                      className="object-cover"
                      priority
                      sizes="(min-width: 1024px) 900px, 100vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 bg-primary-500" />
                  )}
                </div>
                <div className="absolute w-full z-10 bottom-0 left-0">
                  <div className="bg-white dark:bg-gray-800 px-3 py-1 w-fit flex items-center rounded-tr-md font-sans text-xs text-slate-700 dark:text-slate-300">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    No comments
                  </div>
                </div>
              </div>

              {/* Post Meta */}
              <div className="p-2">
                <div className="-mt-1 bg-white dark:bg-gray-900 pb-1 w-fit flex items-center rounded-tr-md font-sans text-xs text-slate-700 dark:text-slate-300">
                  <time dateTime={post.date}>{formattedDate}</time>
                  {timeAgo && (
                    <span className="ml-2 text-xs hidden lg:block text-gray-400" data-nosnippet>
                      {timeAgo}
                    </span>
                  )}
                </div>

                <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 py-2">
                  <div className="flex items-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      Author: <span className="font-bold">{post.author?.name || user?.display_name || "Unknown"}</span>
                    </div>
                  </div>
                  <nav className="text-gray-500 dark:text-gray-400 hidden md:block text-sm">
                    <ol className="flex items-center gap-1">
                      <li>Home</li>
                      <li className="text-gray-400">/</li>
                      <li>{categoryName}</li>
                      <li className="text-gray-400">/</li>
                      <li className="text-gray-700 dark:text-gray-300 truncate max-w-[200px]">{post.title}</li>
                    </ol>
                  </nav>
                </div>
              </div>

              <div className="p-2">
                {/* Quick Links */}
                <QuickLinks />

                {/* Article Body */}
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
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />
              </div>
            </article>
          </section>

          {/* Sidebar */}
          <Sidebar showAds={false}>
            <SubscribeWidget />
          </Sidebar>
        </div>
      </main>
    </>
  );
}
