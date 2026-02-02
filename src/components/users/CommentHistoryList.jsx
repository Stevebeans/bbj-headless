"use client";

import { useState, useEffect } from "react";
import { getUserComments } from "@/lib/api/users";
import CommentHistoryItem from "./CommentHistoryItem";
import { FaSpinner, FaComments } from "react-icons/fa";

/**
 * CommentHistoryList - Paginated list of user's comments
 *
 * @param {number} userId - User ID to fetch comments for
 * @param {Array} initialComments - Initial comments from server (optional)
 * @param {boolean} initialHasMore - Whether there are more comments
 */
export default function CommentHistoryList({
  userId,
  initialComments = [],
  initialHasMore = true,
}) {
  const [comments, setComments] = useState(initialComments);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load more comments
  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const result = await getUserComments(userId, nextPage, 10);

      if (result.success) {
        setComments((prev) => [...prev, ...result.comments]);
        setHasMore(result.pagination.has_more);
        setPage(nextPage);
      } else {
        setError("Failed to load more comments");
      }
    } catch (err) {
      console.error("Error loading comments:", err);
      setError("Failed to load more comments");
    } finally {
      setLoading(false);
    }
  };

  // If no comments at all
  if (comments.length === 0 && !loading) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <FaComments className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>No comments yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Comment list */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentHistoryItem key={comment.id} comment={comment} />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <FaSpinner className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-4 text-center text-red-500 dark:text-red-400 text-sm">
          {error}
          <button
            onClick={loadMore}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton loader for comment history
 */
export function CommentHistorySkeleton({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 animate-pulse"
        >
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3" />
          <div className="flex gap-4">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
