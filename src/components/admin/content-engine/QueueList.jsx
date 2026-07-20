"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getContentQueue,
  getContentQueueImage,
  updateContentDraft,
  deleteContentDraft,
  rescheduleContent,
} from "@/lib/api/admin";

const SOURCE_LABELS = {
  image_paste: "IMG",
  news_scan: "NEWS",
  template: "TPL",
  manual: "TXT",
  on_this_day: "OTD",
  social_quickie: "CARD",
  feed_share: "FEED",
};

const REFRESH_MS = 60000;

// scheduled_at is server time = UTC, stored 'Y-m-d H:i:s' with no zone marker.
function toDate(utc) {
  if (!utc) return null;
  const iso = utc.includes("T") ? utc : utc.replace(" ", "T");
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtLocal(utc) {
  const d = toDate(utc);
  if (!d) return utc || "--";
  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function countdown(utc, now) {
  const d = toDate(utc);
  if (!d) return "";
  const mins = Math.round((d.getTime() - now) / 60000);
  if (mins <= 0) return "due now";
  if (mins < 90) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 48) return `in ${h}h ${m}m`;
  return `in ${Math.round(h / 24)} days`;
}

// Prefill the reschedule picker with the item's current local time.
function toLocalInputValue(utc) {
  const d = toDate(utc) || new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// datetime-local value (browser-local) -> UTC 'Y-m-d H:i:s' for the cron's NOW() compare.
function localInputToUtc(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}

// Some queued text arrives emoji-entity-encoded (utf8mb3-era storage). Decode for display/edit.
function decodeEntities(str) {
  if (!str) return "";
  if (typeof document === "undefined") return str;
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

function imageSrc(data) {
  return data.startsWith("data:") ? data : `data:image/png;base64,${data}`;
}

export default function QueueList({ title = "Content Queue" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState({}); // id -> base64 (or null after a failed fetch)
  const [now, setNow] = useState(() => Date.now());

  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [reschedulingId, setReschedulingId] = useState(null);
  const [rescheduleValue, setRescheduleValue] = useState("");
  const [savingReschedule, setSavingReschedule] = useState(false);

  // Skip background refreshes mid-edit so typed text never gets clobbered.
  const busyRef = useRef(false);
  busyRef.current = editingId !== null || reschedulingId !== null;

  const fetchQueue = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const data = await getContentQueue();
      setItems(data.items || data.queue || []);
      setError(null);
    } catch (err) {
      if (!background) setError(err.message);
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const timer = setInterval(() => {
      setNow(Date.now());
      if (!busyRef.current) fetchQueue(true);
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchQueue]);

  // Lazy-load card previews for rows that have one. The queue is a handful of
  // items by design, so fetching each visible blob once is fine.
  useEffect(() => {
    items
      .filter((item) => Number(item.has_image) && images[item.id] === undefined)
      .forEach((item) => {
        setImages((prev) => ({ ...prev, [item.id]: null }));
        getContentQueueImage(item.id)
          .then((res) => {
            if (res?.image_data) {
              setImages((prev) => ({ ...prev, [item.id]: res.image_data }));
            }
          })
          .catch(() => {});
      });
  }, [items, images]);

  const startEdit = (item) => {
    setReschedulingId(null);
    setEditingId(item.id);
    setEditBody(decodeEntities(item.body || ""));
  };

  const saveEdit = async () => {
    if (!editBody.trim()) return;
    setSavingEdit(true);
    try {
      await updateContentDraft(editingId, { body: editBody });
      setItems((prev) =>
        prev.map((it) => (it.id === editingId ? { ...it, body: editBody } : it))
      );
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const startReschedule = (item) => {
    setEditingId(null);
    setReschedulingId(item.id);
    setRescheduleValue(toLocalInputValue(item.scheduled_at));
  };

  const saveReschedule = async () => {
    const utc = localInputToUtc(rescheduleValue);
    if (!utc) return;
    setSavingReschedule(true);
    try {
      await rescheduleContent(reschedulingId, utc);
      setItems((prev) =>
        prev.map((it) =>
          it.id === reschedulingId ? { ...it, scheduled_at: utc } : it
        )
      );
      setReschedulingId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingReschedule(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this scheduled post? It will not go out.")) return;
    try {
      await deleteContentDraft(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
        <button
          type="button"
          onClick={() => fetchQueue()}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          Refresh
        </button>
      </div>

      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm py-6 text-center">
          Nothing in the queue. Queued posts show up here before they go out.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-4"
            >
              {/* Header row: when + badges + actions */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {fmtLocal(item.scheduled_at)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  {countdown(item.scheduled_at, now)}
                </span>
                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-xs font-mono">
                  {SOURCE_LABELS[item.source] || item.source || "?"}
                </span>
                {item.target_page_name && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs">
                    {item.target_page_name}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => (editingId === item.id ? setEditingId(null) : startEdit(item))}
                    className="px-2 py-1 text-xs text-primary-500 hover:text-primary-700 font-medium"
                  >
                    {editingId === item.id ? "Cancel" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      reschedulingId === item.id ? setReschedulingId(null) : startReschedule(item)
                    }
                    className="px-2 py-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                  >
                    {reschedulingId === item.id ? "Cancel" : "Reschedule"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="px-2 py-1 text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Caption: full text, or editor */}
              {editingId === item.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
                  />
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={savingEdit || !editBody.trim()}
                    className="px-4 py-1.5 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium disabled:opacity-50"
                  >
                    {savingEdit ? "Saving..." : "Save caption"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {decodeEntities(item.body)}
                </p>
              )}

              {/* Inline reschedule */}
              {reschedulingId === item.id && (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="datetime-local"
                    value={rescheduleValue}
                    onChange={(e) => setRescheduleValue(e.target.value)}
                    className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={saveReschedule}
                    disabled={savingReschedule || !rescheduleValue}
                    className="px-3 py-1 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-medium disabled:opacity-50"
                  >
                    {savingReschedule ? "Saving..." : "Confirm"}
                  </button>
                  <span className="text-xs text-slate-400">Your local time</span>
                </div>
              )}

              {/* Card preview */}
              {images[item.id] && (
                <img
                  src={imageSrc(images[item.id])}
                  alt="Card preview"
                  className="mt-3 max-h-72 rounded-lg border border-slate-200 dark:border-slate-700"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
