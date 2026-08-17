"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  updateFeedUpdate,
  deleteFeedUpdate,
  getFeedUpdateForEdit,
} from "@/lib/api/adminFeedUpdates";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

/**
 * Owner controls for a feed-update card: pencil (inline edit) + trash
 * (two-step delete). Rendered only for the update's author or staff with
 * comment_moderation — the same rule the API enforces server-side.
 *
 * Idle: a small right-aligned icon row (parents mount it at the top of the
 * card body). Editing: the parent hides its own title/content (tracked via
 * onEditingChange) and this component renders the form in that space.
 */
export function FeedUpdateManage({ update, onSaved, onDeleted, onEditingChange }) {
  const { user, isAuthenticated } = useAuth();
  const { hasPermission, loading: permsLoading } = usePermissions();

  const [editing, setEditing] = useState(false);
  const [opening, setOpening] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthenticated || permsLoading) return null;

  const isAuthor =
    user?.id && update.author?.id && Number(user.id) === Number(update.author.id);
  const canManage =
    hasPermission("feed_updates") &&
    (isAuthor || hasPermission("comment_moderation"));
  if (!canManage) return null;

  // The form and the parent's hide-title/content flag always move together.
  const syncEditing = (value) => {
    setEditing(value);
    onEditingChange?.(value);
  };

  const startEdit = async () => {
    if (opening) return;
    setError("");
    setOpening(true);
    try {
      // Card payloads are ISR-cached and omit raw_content — edit the live copy.
      const fresh = await getFeedUpdateForEdit(update.slug);
      setTitle(fresh.title || "");
      setDetails(fresh.raw_content || "");
      syncEditing(true);
    } catch (err) {
      setError(err.message || "Couldn't load the update");
    } finally {
      setOpening(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSaving(true);
    try {
      const res = await updateFeedUpdate(update.id, { title, details });
      onSaved?.(res.update);
      syncEditing(false);
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setError("");
    setDeleting(true);
    try {
      await deleteFeedUpdate(update.id);
      onDeleted?.();
    } catch (err) {
      setError(err.message || "Delete failed");
      setDeleting(false);
      setConfirming(false);
    }
  };

  if (editing) {
    return (
      <form onSubmit={handleSave} className="mb-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Headline"
          className="w-full mb-2 p-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-gray-700 dark:text-white"
        />
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={6}
          className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-y focus:ring-2 focus:ring-primary-500 focus:outline-none dark:bg-gray-700 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Edits change the site only — the Facebook/Bluesky copies stay as posted.
        </p>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={() => syncEditing(false)}
            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-end gap-1 text-xs -mt-1">
      {confirming ? (
        <>
          <span className="text-gray-600 dark:text-gray-300">
            Delete from the site? (FB/Bluesky copies stay)
          </span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-2 py-0.5 text-red-600 dark:text-red-400 font-semibold hover:underline disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="px-2 py-0.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          {error && <span className="text-red-500 mr-1">{error}</span>}
          <button
            type="button"
            onClick={startEdit}
            disabled={opening}
            title="Edit update"
            aria-label="Edit update"
            className="p-1 text-gray-400 hover:text-primary-500 dark:hover:text-secondary-400 disabled:opacity-50"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            title="Delete update"
            aria-label="Delete update"
            className="p-1 text-gray-400 hover:text-red-500"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
