"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAds } from "@/context/AdContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { postComment } from "@/lib/api/comments";
import { isFreshUpdate } from "@/lib/feedUpdatesLive";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatBbTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Los_Angeles",
    });
  } catch {
    return "";
  }
}

export function FeedUpdateCard({ update }) {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [commentCount, setCommentCount] = useState(update.comment_count || 0);
  // API returns newest first — reverse to chronological order
  const [recentComments, setRecentComments] = useState(() =>
    [...(update.recent_comments || [])].reverse()
  );

  // Supporter status from AdContext — baseline roles + the admin-configured list
  const { isSupporter } = useAds();
  const isPremium = isAuthenticated && isSupporter;

  const permalink = `/live-feed-updates/${update.slug}`;
  const time12h = formatBbTime(update.modified);
  const authorSlug = slugify(update.author?.name);
  // Old-theme parity: timestamps go red while the update is <4h old.
  const isFresh = isFreshUpdate(update.modified);

  const handleQuickReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await postComment(update.id, replyContent.trim(), 0, null);

      const newComment = {
        author: user?.user_display_name || user?.user_login || "You",
        content:
          replyContent.trim().length > 60
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
    <article id={update.slug} className="group flex gap-4 py-4">
      {/* Left rail: time + relative (desktop only) */}
      <div className="hidden sm:block w-20 shrink-0 text-right">
        <time
          dateTime={update.modified || update.date}
          className={`block font-osw text-sm ${isFresh ? "text-red-500" : "text-gray-900 dark:text-gray-200"}`}
        >
          {time12h}
        </time>
        <div
          className={`text-[11px] ${isFresh ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}
          data-nosnippet
        >
          {update.time_ago}
        </div>
      </div>

      {/* Dot */}
      <div className="relative flex-shrink-0">
        <span
          className="block w-3 h-3 rounded-full mt-1.5 bg-gray-400 dark:bg-gray-500"
          aria-hidden="true"
        />
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <h3 className="font-display text-lg md:text-xl leading-snug mb-2 text-primary-500 dark:text-secondary-500">
          <Link
            href={permalink}
            className="hover:text-primary-600 dark:hover:text-secondary-400"
          >
            {update.title}
          </Link>
        </h3>

        {update.content && (
          <div
            className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3 feed-content"
            dangerouslySetInnerHTML={{ __html: update.content }}
          />
        )}

        {update.thumbnail && (
          <div className="mb-3 w-[90%] md:max-w-[75%] mx-auto">
            <Image
              src={update.thumbnail}
              alt={update.title || "Big Brother feed update"}
              width={800}
              height={533}
              sizes="(min-width: 768px) 45vw, 90vw"
              className="rounded-lg w-full h-auto"
            />
          </div>
        )}

        {/* Recent Comments Preview */}
        {recentComments?.length > 0 && (
          <div className="mt-3 mb-3 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg border-l-2 border-gray-300 dark:border-gray-600">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Recent replies
              </div>
              {commentCount > 2 && (
                <Link
                  href={`${permalink}#comments`}
                  className="text-xs py-1 text-primary-500 hover:text-primary-600 hover:underline"
                >
                  Read all replies →
                </Link>
              )}
            </div>
            <Link
              href={`${permalink}#comments`}
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
        <div className="flex flex-wrap gap-3 items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap gap-3 items-center">
            {authorSlug && <span className="font-osw">@{authorSlug}</span>}
            <span>
              {commentCount > 0
                ? `${commentCount} ${commentCount === 1 ? "reply" : "replies"}`
                : "No replies yet"}
            </span>
            <Link
              href={`${permalink}#comments`}
              className="text-primary-500 dark:text-secondary-500 hover:underline"
            >
              Join the thread →
            </Link>
          </div>

          {/* Quick Reply */}
          <div className="relative">
            {replySuccess ? (
              <span className="text-green-600 dark:text-green-400">
                ✓ Reply posted!
              </span>
            ) : (
              <button
                onClick={handleReplyClick}
                className={`flex items-center gap-1 transition-colors ${
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

        {/* Quick Reply Form (premium only) */}
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
      </div>
    </article>
  );
}
