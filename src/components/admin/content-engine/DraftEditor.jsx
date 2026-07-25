"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getFacebookPages,
  postToFacebook,
  postPhotoToFacebook,
  createContentDraft,
  getContentSlots,
} from "@/lib/api/admin";

// UTC "Y-m-d H:i:s" -> localized "Sat 6:30 PM"
function formatSlotLabel(at) {
  const d = new Date(at.replace(" ", "T") + "Z");
  return d.toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DraftEditor({
  initialBody = "",
  initialImage = null,
  source = "manual",
  onSave,
  onPost,
}) {
  const [body, setBody] = useState(initialBody);
  const [image, setImage] = useState(initialImage);
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState("");
  const [alsoPublishBlog, setAlsoPublishBlog] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [showScheduler, setShowScheduler] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState(null);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    setBody(initialBody);
  }, [initialBody]);

  useEffect(() => {
    setImage(initialImage);
  }, [initialImage]);

  useEffect(() => {
    getFacebookPages()
      .then((data) => {
        const list = data.pages || data || [];
        setPages(list);
        if (list.length > 0) setSelectedPage(list[0].id);
      })
      .catch(() => {});
  }, []);

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    setSlotsError(false);
    try {
      const data = await getContentSlots();
      const fresh = data?.slots || [];
      setSlots(fresh);
      // A slot picked earlier may have been taken since (or scrolled out of
      // the grid) — clear a selection that is no longer a free slot so a
      // stale pick can never submit into an occupied slot.
      setSelectedSlot((prev) =>
        prev && fresh.some((s) => s.at === prev && !s.taken) ? prev : ""
      );
    } catch {
      // Never block scheduling — fall back to the custom-time input.
      setSlots([]);
      setSlotsError(true);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  // Fetch slots once each time the scheduler opens.
  useEffect(() => {
    if (showScheduler) loadSlots();
  }, [showScheduler, loadSlots]);

  const handlePostNow = async () => {
    if (!body.trim()) return;
    setLoading(true);
    setAction("posting");
    try {
      const payload = {
        message: body,
        page_id: selectedPage,
      };
      let result;
      if (image) {
        result = await postPhotoToFacebook({
          ...payload,
          image_data: image,
        });
      } else {
        result = await postToFacebook(payload);
      }
      // Save to log as posted
      await createContentDraft({
        body,
        source,
        status: "posted",
        content_type: alsoPublishBlog ? "both" : "facebook_post",
        target_page: selectedPage,
        target_page_name: pages.find((p) => p.id === selectedPage)?.name || "",
        image_data: image || undefined,
        fb_post_id: result?.post_id || result?.id || null,
      });
      showFeedback("success", "Posted successfully!");
      onPost?.(result);
      setBody("");
      setImage(null);
    } catch (err) {
      showFeedback("error", err.message || "Failed to post");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  // Custom-time input is used when the operator picks it, or as an automatic
  // fallback if the slots endpoint failed.
  const usingCustomTime = useCustomTime || slotsError;

  const handleSchedule = async () => {
    if (!body.trim()) return;

    let scheduledAt;
    if (usingCustomTime) {
      if (!scheduleDate) return;
      // datetime-local is local wall time — convert to UTC "Y-m-d H:i:s".
      const parsed = new Date(scheduleDate);
      if (isNaN(parsed.getTime())) {
        showFeedback("error", "That date and time could not be read. Pick it again.");
        return;
      }
      scheduledAt = parsed.toISOString().slice(0, 19).replace("T", " ");
    } else {
      if (!selectedSlot) return;
      // Slot "at" is already UTC "Y-m-d H:i:s" — send verbatim.
      scheduledAt = selectedSlot;
    }

    setLoading(true);
    setAction("scheduling");
    try {
      const result = await createContentDraft({
        body,
        source,
        status: "scheduled",
        scheduled_at: scheduledAt,
        content_type: alsoPublishBlog ? "both" : "facebook_post",
        target_page: selectedPage,
        target_page_name: pages.find((p) => p.id === selectedPage)?.name || "",
        image_data: image || undefined,
      });
      showFeedback("success", "Scheduled successfully!");
      // Stamp the action onto the callback arg — the server response carries
      // only {success, id}, and consumers need to tell schedule from draft.
      onSave?.({ ...result, status: "scheduled" });
      setBody("");
      setImage(null);
      setScheduleDate("");
      setSelectedSlot("");
      setUseCustomTime(false);
      setShowScheduler(false);
    } catch (err) {
      showFeedback("error", err.message || "Failed to schedule");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  const canSchedule = usingCustomTime ? !!scheduleDate : !!selectedSlot;

  const handleSlotChange = (value) => {
    if (value === "__custom__") {
      setUseCustomTime(true);
      setSelectedSlot("");
    } else {
      setUseCustomTime(false);
      setSelectedSlot(value);
    }
  };

  const handleSaveDraft = async () => {
    if (!body.trim()) return;
    setLoading(true);
    setAction("saving");
    try {
      const result = await createContentDraft({
        body,
        source,
        status: "draft",
        content_type: alsoPublishBlog ? "both" : "facebook_post",
        target_page: selectedPage,
        target_page_name: pages.find((p) => p.id === selectedPage)?.name || "",
        image_data: image || undefined,
      });
      showFeedback("success", "Draft saved!");
      onSave?.({ ...result, status: "draft" });
    } catch (err) {
      showFeedback("error", err.message || "Failed to save draft");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
      {/* Body textarea */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your post content..."
        rows={4}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-y"
      />

      {/* Image preview */}
      {image && (
        <div className="relative inline-block">
          <img
            src={image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`}
            alt="Attached"
            className="max-h-40 rounded-lg border border-slate-200 dark:border-slate-700"
          />
          <button
            onClick={() => setImage(null)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
          >
            x
          </button>
        </div>
      )}

      {/* Facebook page selector */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Target Page:
        </label>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
        >
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
          {pages.length === 0 && <option value="">No pages configured</option>}
        </select>

        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ml-auto">
          <input
            type="checkbox"
            checked={alsoPublishBlog}
            onChange={(e) => setAlsoPublishBlog(e.target.checked)}
            className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          Also publish as blog post
        </label>
      </div>

      {/* Schedule picker */}
      {showScheduler && (
        <div className="flex flex-wrap items-center gap-3">
          {!slotsError && (
            <>
              <select
                value={useCustomTime ? "__custom__" : selectedSlot}
                onChange={(e) => handleSlotChange(e.target.value)}
                disabled={slotsLoading}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white disabled:opacity-50"
              >
                <option value="">
                  {slotsLoading ? "Loading slots..." : "Choose a time..."}
                </option>
                {slots.map((s) => (
                  <option key={s.at} value={s.at} disabled={s.taken}>
                    {s.taken
                      ? `${formatSlotLabel(s.at)} - ${s.label || "taken"}`
                      : `${formatSlotLabel(s.at)}${s.cbs_caution ? " (during episode)" : ""}`}
                  </option>
                ))}
                <option value="__custom__">Custom time...</option>
              </select>
              <button
                type="button"
                onClick={loadSlots}
                disabled={slotsLoading}
                title="Refresh slots"
                className="px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                {slotsLoading ? "..." : "↻"}
              </button>
            </>
          )}

          {usingCustomTime && (
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
          )}

          <button
            onClick={handleSchedule}
            disabled={loading || !canSchedule}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50"
          >
            {action === "scheduling" ? "Scheduling..." : "Confirm Schedule"}
          </button>
          <button
            onClick={() => {
              setShowScheduler(false);
              setSelectedSlot("");
              setUseCustomTime(false);
            }}
            className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handlePostNow}
          disabled={loading || !body.trim()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium disabled:opacity-50"
        >
          {action === "posting" ? "Posting..." : "Post Now"}
        </button>
        <button
          onClick={() => setShowScheduler(!showScheduler)}
          disabled={loading || !body.trim()}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium disabled:opacity-50"
        >
          Schedule
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={loading || !body.trim()}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium disabled:opacity-50 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
        >
          {action === "saving" ? "Saving..." : "Save Draft"}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            feedback.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
