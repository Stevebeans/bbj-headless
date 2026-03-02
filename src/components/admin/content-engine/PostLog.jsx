"use client";

import { useState, useEffect, useCallback } from "react";
import { getPostLog, postToFacebook } from "@/lib/api/admin";

export default function PostLog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const fetchLog = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await getPostLog(pageNum);
      setPosts(data.posts || data.items || []);
      setPagination(data.pagination || null);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const handleRetry = async (post) => {
    setRetryingId(post.id);
    try {
      await postToFacebook({
        message: post.body,
        page_id: post.target_page,
      });
      fetchLog(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Post Log
      </h2>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">
          No posts yet.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-40">
                    Date/Time
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
                    Content
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-32">
                    Page
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-24">
                    Status
                  </th>
                  <th className="py-3 px-4 w-24"></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {post.posted_at
                        ? new Date(post.posted_at).toLocaleString()
                        : post.created_at
                          ? new Date(post.created_at).toLocaleString()
                          : "--"}
                    </td>
                    <td className="py-3 px-4 text-gray-900 dark:text-gray-200">
                      {post.body?.substring(0, 80)}
                      {post.body?.length > 80 ? "..." : ""}
                    </td>
                    <td className="py-3 px-4">
                      {post.target_page_name && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs">
                          {post.target_page_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          post.status === "posted"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {post.status === "posted" ? "Posted" : "Failed"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {post.status === "posted" && post.fb_post_id ? (
                        <a
                          href={`https://facebook.com/${post.fb_post_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                        >
                          View
                        </a>
                      ) : post.status === "failed" ? (
                        <button
                          onClick={() => handleRetry(post)}
                          disabled={retryingId === post.id}
                          className="text-xs text-primary-500 hover:text-primary-600 font-medium disabled:opacity-50"
                        >
                          {retryingId === post.id ? "Retrying..." : "Retry"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.current_page} of {pagination.total_pages} (
                {pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchLog(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchLog(page + 1)}
                  disabled={page >= pagination.total_pages}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
