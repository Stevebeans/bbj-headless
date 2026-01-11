"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { postComment } from "@/lib/api/comments";
import Link from "next/link";

export default function CommentForm({ postId, parentId = 0, onSubmit, onCancel, placeholder = "Write a comment...", buttonText = "Post Comment", compact = false }) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Please enter a comment");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await postComment(postId, content, parentId);
      setContent("");
      onSubmit?.(result.comment);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className={`bg-slate-50 dark:bg-slate-800 rounded-lg p-4 text-center ${compact ? "" : "mb-6"}`}>
        <p className="text-slate-600 dark:text-slate-400 mb-3">
          Please log in to join the discussion
        </p>
        <Link
          href={`/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
          className="inline-block px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "" : "mb-6"}>
      {error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {!compact && (
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-bold">
                {user?.user_display_name?.charAt(0) || "?"}
              </span>
            </div>
          </div>
        )}

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={compact ? 2 : 3}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />

          <div className="flex items-center justify-end gap-2 mt-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="px-4 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Posting..." : buttonText}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
