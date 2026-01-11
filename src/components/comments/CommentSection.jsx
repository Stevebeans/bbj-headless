"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getComments } from "@/lib/api/comments";
import CommentForm from "./CommentForm";
import CommentCard from "./CommentCard";

export default function CommentSection({ postId, initialCommentCount = 0 }) {
  const router = useRouter();
  const [comments, setComments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, total_pages: 1 });
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const fetchComments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getComments(postId, { page, sort });
      setComments(data.comments);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [postId, sort]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSortChange = (newSort) => {
    setSort(newSort);
  };

  const handleNewComment = (comment) => {
    // Add new comment to the top if sorting by newest
    if (sort === "newest") {
      setComments([comment, ...comments]);
    } else {
      // Otherwise add to bottom
      setComments([...comments, comment]);
    }
    setPagination({ ...pagination, total: pagination.total + 1 });
  };

  const handleCommentDeleted = (commentId) => {
    setComments(comments.filter((c) => c.id !== commentId));
    setPagination({ ...pagination, total: pagination.total - 1 });
  };

  const handleLoginRequired = () => {
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const handlePageChange = (page) => {
    fetchComments(page);
    // Scroll to comments section
    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="comments" className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-osw font-bold text-slate-800 dark:text-white">
          {pagination.total} {pagination.total === 1 ? "Comment" : "Comments"}
        </h2>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Sort by:</label>
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Comment Form */}
      <CommentForm postId={postId} onSubmit={handleNewComment} />

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => fetchComments()}
            className="mt-2 text-sm text-red-500 hover:text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && comments.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && comments.length === 0 && !error && (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
          <svg
            className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p className="text-slate-500 dark:text-slate-400">No comments yet</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Be the first to share your thoughts!</p>
        </div>
      )}

      {/* Comments List */}
      {!loading && comments.length > 0 && (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {comments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              postId={postId}
              onCommentAdded={handleNewComment}
              onCommentDeleted={handleCommentDeleted}
              onLoginRequired={handleLoginRequired}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {/* Previous */}
          <button
            onClick={() => handlePageChange(pagination.current_page - 1)}
            disabled={pagination.current_page === 1}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Previous
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1)
              .filter((page) => {
                // Show first, last, current, and neighbors
                return (
                  page === 1 ||
                  page === pagination.total_pages ||
                  Math.abs(page - pagination.current_page) <= 1
                );
              })
              .map((page, index, array) => {
                // Add ellipsis
                const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;

                return (
                  <span key={page} className="flex items-center">
                    {showEllipsisBefore && (
                      <span className="px-2 text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === pagination.current_page
                          ? "bg-primary-500 text-white"
                          : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}
          </div>

          {/* Next */}
          <button
            onClick={() => handlePageChange(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.total_pages}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      )}

      {/* Loading overlay for pagination */}
      {loading && comments.length > 0 && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto" />
          </div>
        </div>
      )}
    </section>
  );
}
