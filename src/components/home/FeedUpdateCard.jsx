"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { postComment } from "@/lib/api/comments";

export function FeedUpdateCard({ update }) {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [commentCount, setCommentCount] = useState(update.comment_count || 0);
  // API returns newest first, reverse to chronological order (oldest first)
  const [recentComments, setRecentComments] = useState(
    () => [...(update.recent_comments || [])].reverse()
  );

  const SUPPORTER_ROLES = ["administrator", "editor", "supporter", "lifetime"];
  const isPremium = isAuthenticated && Array.isArray(user?.user_roles) && user.user_roles.some(role => SUPPORTER_ROLES.includes(role));

  const handleQuickReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await postComment(update.id, replyContent.trim(), 0, null);

      // Add the new comment to the recent comments preview
      const newComment = {
        author: user?.user_display_name || user?.user_login || "You",
        content: replyContent.trim().length > 60
          ? replyContent.trim().substring(0, 57) + "..."
          : replyContent.trim(),
      };
      setRecentComments((prev) => [...prev, newComment].slice(-3));

      setReplyContent("");
      setShowReplyForm(false);
      setReplySuccess(true);
      setCommentCount((prev) => prev + 1);
      setTimeout(() => setReplySuccess(false), 3000);
    } catch (err) {
      console.error("Reply failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplyClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (isPremium) {
      setShowReplyForm(!showReplyForm);
    }
  };

  return (
    <div className="group block w-full text-inherit dark:text-gray-200">
      <article
        id={update.slug}
        className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-3 border-l-primary-400 dark:border-l-primary-500 rounded-lg shadow-sm hover:border-gray-300 dark:hover:border-gray-600 hover:border-l-primary-500 dark:hover:border-l-primary-400 hover:shadow transition-all duration-200"
      >
        <Link href={`/live-feed-updates/${update.slug}`} className="block">
          {/* Author Header */}
          <div className="flex gap-3 mb-3 items-center">
            {update.author?.avatar && (
              <Image
                src={update.author.avatar}
                alt={update.author.name}
                width={40}
                height={40}
                className="rounded-full w-10 h-10"
                unoptimized
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
        </Link>

        {/* Recent Comments Preview */}
        {recentComments?.length > 0 && (
          <div className="mt-3 ml-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-2 border-gray-300 dark:border-gray-600">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Recent replies
              </div>
              {commentCount > 2 && (
                <Link
                  href={`/live-feed-updates/${update.slug}#comments`}
                  className="text-xs py-1 text-primary-500 hover:text-primary-600 hover:underline"
                >
                  Read all replies →
                </Link>
              )}
            </div>
            <Link
              href={`/live-feed-updates/${update.slug}#comments`}
              className="block space-y-2"
            >
              {recentComments.slice(-3).map((comment, idx) => (
                <p
                  key={idx}
                  className="text-xs text-gray-600 dark:text-gray-400 truncate pl-2"
                >
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {comment.author}:
                  </span>{" "}
                  <span className="text-gray-600 dark:text-gray-400">{comment.content}</span>
                </p>
              ))}
            </Link>
          </div>
        )}

        {/* Footer */}
        <div className="text-xs border-t border-gray-300 dark:border-gray-600 pt-2 mt-2 text-slate-600 dark:text-slate-400 clear-both flex items-center justify-between">
          <Link
            href={`/live-feed-updates/${update.slug}#comments`}
            className="flex items-center gap-1 hover:text-primary-500"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
          </Link>

          {/* Quick Reply Button */}
          <div className="relative">
            {replySuccess ? (
              <span className="text-green-600 dark:text-green-400 text-xs">
                ✓ Reply posted!
              </span>
            ) : (
              <button
                onClick={handleReplyClick}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  isPremium
                    ? "text-primary-500 hover:text-primary-600"
                    : "text-gray-500 cursor-help"
                }`}
                title={
                  !isAuthenticated
                    ? "Log in to reply"
                    : isPremium
                    ? "Quick reply"
                    : "Quick reply only available to supporters — Become a supporter"
                }
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Quick Reply
                {!isPremium && isAuthenticated && (
                  <svg className="w-3 h-3 ml-0.5 text-secondary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                )}
              </button>
            )}

            {/* Premium upsell tooltip for non-premium users */}
            {!isPremium && isAuthenticated && (
              <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-10">
                Quick reply is a premium feature.
                <Link
                  href="/become-supporter"
                  className="block mt-1 text-secondary-400 hover:text-secondary-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  Become a supporter →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Reply Form (Premium only) */}
        {showReplyForm && isPremium && (
          <form
            onSubmit={handleQuickReply}
            className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a quick reply..."
              className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-gray-700 dark:text-white"
              rows={2}
              maxLength={500}
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-500">
                {replyContent.length}/500
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplyForm(false)}
                  className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmitting}
                  className="px-3 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Posting..." : "Post Reply"}
                </button>
              </div>
            </div>
          </form>
        )}
      </article>
    </div>
  );
}
