"use client";

import Link from "next/link";
import { FaArrowUp, FaArrowDown, FaReply } from "react-icons/fa";

/**
 * CommentHistoryItem - Single comment in user's history
 *
 * @param {Object} comment - Comment data
 */
export default function CommentHistoryItem({ comment }) {
  const {
    id,
    content,
    time_ago,
    post_title,
    post_url,
    vote_score,
    upvotes,
    downvotes,
    reply_count,
    is_reply,
  } = comment;

  // Build comment anchor URL
  const commentUrl = post_url ? `${post_url}#comment-${id}` : null;

  return (
    <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
      {/* Post title link */}
      {commentUrl ? (
        <Link
          href={commentUrl}
          className="text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 line-clamp-1"
        >
          {post_title}
        </Link>
      ) : (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 line-clamp-1">
          {post_title}
        </span>
      )}

      {/* Comment content preview */}
      <p className="mt-2 text-slate-700 dark:text-slate-300 text-sm line-clamp-2">
        {is_reply && (
          <span className="text-slate-400 dark:text-slate-500 mr-1">
            <FaReply className="inline w-3 h-3 mr-1" />
            Reply:
          </span>
        )}
        {content}
      </p>

      {/* Meta row */}
      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
        {/* Time */}
        <span>{time_ago}</span>

        {/* Vote score */}
        <span
          className={`flex items-center gap-1 ${
            vote_score > 0
              ? "text-green-600 dark:text-green-400"
              : vote_score < 0
              ? "text-red-600 dark:text-red-400"
              : ""
          }`}
        >
          {vote_score >= 0 ? (
            <FaArrowUp className="w-3 h-3" />
          ) : (
            <FaArrowDown className="w-3 h-3" />
          )}
          {vote_score > 0 ? `+${vote_score}` : vote_score} points
        </span>

        {/* Reply count */}
        {reply_count > 0 && (
          <span className="flex items-center gap-1">
            <FaReply className="w-3 h-3" />
            {reply_count} {reply_count === 1 ? "reply" : "replies"}
          </span>
        )}
      </div>
    </div>
  );
}
