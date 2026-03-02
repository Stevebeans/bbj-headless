"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getContentQueue,
  deleteContentDraft,
  rescheduleContent,
} from "@/lib/api/admin";
import DraftEditor from "./DraftEditor";

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const SOURCE_ICONS = {
  image_paste: "IMG",
  news_scan: "NEWS",
  template: "TPL",
  manual: "TXT",
  on_this_day: "OTD",
};

export default function Queue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [reschedulingId, setReschedulingId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getContentQueue();
      setItems(data.items || data.queue || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this scheduled post?")) return;
    try {
      await deleteContentDraft(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReschedule = async (id) => {
    if (!rescheduleDate) return;
    try {
      await rescheduleContent(id, rescheduleDate);
      setReschedulingId(null);
      setRescheduleDate("");
      fetchQueue();
    } catch (err) {
      setError(err.message);
    }
  };

  // Group items by date
  const grouped = items.reduce((acc, item) => {
    const dateKey = item.scheduled_at
      ? new Date(item.scheduled_at).toDateString()
      : "Unscheduled";
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  if (editingItem) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setEditingItem(null);
            fetchQueue();
          }}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &larr; Back to Queue
        </button>
        <DraftEditor
          initialBody={editingItem.body}
          source={editingItem.source}
          onSave={() => {
            setEditingItem(null);
            fetchQueue();
          }}
          onPost={() => {
            setEditingItem(null);
            fetchQueue();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Content Queue
      </h2>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">
          No scheduled posts. Create content to get started.
        </p>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, dateItems]) => (
            <div key={dateKey}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {formatDate(dateItems[0]?.scheduled_at || dateKey)}
              </h3>
              <div className="space-y-2">
                {dateItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 flex items-center gap-3"
                  >
                    {/* Time */}
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-20 flex-shrink-0">
                      {item.scheduled_at ? formatTime(item.scheduled_at) : "--"}
                    </span>

                    {/* Source icon */}
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-xs font-mono flex-shrink-0">
                      {SOURCE_ICONS[item.source] || "?"}
                    </span>

                    {/* Body preview */}
                    <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">
                      {item.body?.substring(0, 50)}
                      {item.body?.length > 50 ? "..." : ""}
                    </span>

                    {/* Target page badge */}
                    {item.target_page_name && (
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs flex-shrink-0">
                        {item.target_page_name}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="px-2 py-1 text-xs text-primary-500 hover:text-primary-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setReschedulingId(
                            reschedulingId === item.id ? null : item.id
                          );
                          setRescheduleDate("");
                        }}
                        className="px-2 py-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-1 text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Inline reschedule */}
                    {reschedulingId === item.id && (
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="datetime-local"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                        />
                        <button
                          onClick={() => handleReschedule(item.id)}
                          disabled={!rescheduleDate}
                          className="px-2 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
