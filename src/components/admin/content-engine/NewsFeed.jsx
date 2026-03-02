"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getNewsFeed,
  scanNewsArticle,
  rewriteArticle,
  refreshNewsFeeds,
} from "@/lib/api/admin";
import DraftEditor from "./DraftEditor";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NewsFeed() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(null);
  const [scanningId, setScanningId] = useState(null);
  const [rewriteResult, setRewriteResult] = useState(null);
  const [error, setError] = useState(null);

  const fetchArticles = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await getNewsFeed(pageNum);
      setArticles(data.articles || data.items || []);
      setPagination(data.pagination || null);
      setPage(pageNum);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await refreshNewsFeeds();
      setRefreshCount(data.new_articles || 0);
      fetchArticles(1);
      setTimeout(() => setRefreshCount(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleScanAndCreate = async (article) => {
    setScanningId(article.id);
    setError(null);
    try {
      const scanned = await scanNewsArticle(article.url);
      const articleText = scanned.article_text || "";
      const rewritten = await rewriteArticle(articleText, article.url);
      setRewriteResult({
        article,
        body: rewritten.rewritten || "",
      });
    } catch (err) {
      setError(err.message || "Failed to scan article");
    } finally {
      setScanningId(null);
    }
  };

  if (rewriteResult) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRewriteResult(null)}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            &larr; Back to News Feed
          </button>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Rewritten: {rewriteResult.article.title}
          </h3>
        </div>
        <DraftEditor
          initialBody={rewriteResult.body}
          source="news_scan"
          onPost={() => setRewriteResult(null)}
          onSave={() => setRewriteResult(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          BB News Feed
        </h2>
        <div className="flex items-center gap-2">
          {refreshCount !== null && (
            <span className="text-sm text-green-600 dark:text-green-400">
              {refreshCount} new articles
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Articles list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">
          No news articles found. Try refreshing the feeds.
        </p>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0 overflow-hidden">
                  {article.thumbnail ? (
                    <img
                      src={article.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No img
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {article.used === 1 && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded text-xs font-medium">
                          Used
                        </span>
                      )}
                      {article.source_name && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 rounded text-xs">
                          {article.source_name}
                        </span>
                      )}
                      {article.published_at && (
                        <span className="text-xs text-slate-400">
                          {timeAgo(article.published_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {article.excerpt && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => handleScanAndCreate(article)}
                      disabled={scanningId === article.id}
                      className="px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-xs font-medium disabled:opacity-50"
                    >
                      {scanningId === article.id
                        ? "Scanning..."
                        : "Scan & Create"}
                    </button>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                    >
                      Open Original
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.current_page} of {pagination.total_pages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchArticles(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Previous
            </button>
            <button
              onClick={() => fetchArticles(page + 1)}
              disabled={page >= pagination.total_pages}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
