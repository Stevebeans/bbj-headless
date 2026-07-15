"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listFeedUpdates,
  updateFeedUpdate,
  deleteFeedUpdate,
} from "@/lib/api/adminFeedUpdates";

const PER_PAGE = 20;

// PT wall-clock, same presentation as the public feed cards
function formatBbTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Los_Angeles",
    });
  } catch {
    return "";
  }
}

export default function AdminFeedUpdates() {
  const [updates, setUpdates] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  // Editing state — one row at a time
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Two-step inline delete confirm
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listFeedUpdates({ perPage: PER_PAGE, offset: 0 });
      setUpdates(data.updates || []);
      setHasMore(!!data.has_more);
    } catch (err) {
      setError(err.message || "Failed to load feed updates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await listFeedUpdates({ perPage: PER_PAGE, offset: updates.length });
      setUpdates((prev) => [...prev, ...(data.updates || [])]);
      setHasMore(!!data.has_more);
    } catch (err) {
      setError(err.message || "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  };

  const startEdit = (u) => {
    setConfirmDeleteId(null);
    setEditingId(u.id);
    setEditTitle(u.title || "");
    // raw_content is the unfiltered post body (server adds it for feed_updates users)
    setEditContent(u.raw_content ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = async (id) => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await updateFeedUpdate(id, { title: editTitle, details: editContent });
      // The PUT response returns the re-formatted update; merge it so the row
      // shows the rendered content without a full reload.
      setUpdates((prev) =>
        prev.map((u) =>
          u.id === id
            ? { ...u, ...(res?.update || {}), title: editTitle, raw_content: editContent }
            : u
        )
      );
      cancelEdit();
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (deletingId) return;
    setDeletingId(id);
    setError("");
    try {
      await deleteFeedUpdate(id);
      setUpdates((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.message || "Delete failed");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white">
          Feed Updates
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          Refresh
        </button>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Latest updates first. Posting new updates stays on the site (&ldquo;New
        Feed&rdquo; button) — this is for fixing or removing existing ones.
      </p>

      {error && (
        <div className="mb-4 px-3 py-2 text-sm rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : updates.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">No feed updates yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {updates.map((u) => (
            <li
              key={u.id}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="font-osw">{formatBbTime(u.modified || u.date)} PT</span>
                {u.author?.name && <span>@{u.author.name}</span>}
                <span>
                  {u.comment_count > 0
                    ? `${u.comment_count} ${u.comment_count === 1 ? "comment" : "comments"}`
                    : "no comments"}
                </span>
                <Link
                  href={`/live-feed-updates/${u.slug}`}
                  className="text-primary-500 dark:text-secondary-500 hover:underline"
                >
                  View →
                </Link>
              </div>

              {editingId === u.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    placeholder="Title"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none resize-y"
                    placeholder="Update text"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={cancelEdit}
                      disabled={saving}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(u.id)}
                      disabled={saving || !editTitle.trim()}
                      className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-medium text-slate-800 dark:text-white leading-snug">
                      {u.title}
                    </h3>
                    {u.excerpt && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                        {u.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {confirmDeleteId === u.id ? (
                      <>
                        <span className="text-xs text-red-600 dark:text-red-400 self-center">
                          Delete permanently?
                        </span>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === u.id ? "Deleting..." : "Yes, delete"}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(u)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDeleteId(u.id);
                            cancelEdit();
                          }}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {hasMore && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
