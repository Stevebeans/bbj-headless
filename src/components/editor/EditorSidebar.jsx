"use client";

import { useEffect, useState } from "react";
import CategoryPicker from "./CategoryPicker";
import ImageUploader from "./ImageUploader";
import SEOPanel from "./SEOPanel";
import PublishChecklist from "./PublishChecklist";
import HistoryPanel from "./HistoryPanel";

export default function EditorSidebar({
  categoryIds, setCategoryIds,
  featuredImageId, setFeaturedImageId,
  featuredImageUrl, setFeaturedImageUrl,
  cropData, onCropSave,
  onFeaturedImageUpload,
  title, slug, setSlug,
  metaDescription, setMetaDescription,
  checklist, reviewNote,
  onSave, onTitleChange, isEditMode,
  liveUpdates, liveStart, liveEnd, onLiveUpdatesChange,
  postStatus, scheduledFor, canSchedule, scheduleReady, onSchedule, onUnschedule,
  postId, onRestoreRevision,
}) {
  // SEO + checklist collapse so the action bar stays on screen while typing.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const checklistDone = Object.values(checklist || {}).every(Boolean);

  return (
    <div className="p-4 space-y-5">
      {canSchedule && postStatus !== "publish" && postStatus !== "pending_review" && (
        <ScheduleBlock
          postStatus={postStatus}
          scheduledFor={scheduledFor}
          ready={scheduleReady}
          onSchedule={onSchedule}
          onUnschedule={onUnschedule}
        />
      )}

      <CategoryPicker
        categoryIds={categoryIds}
        setCategoryIds={setCategoryIds}
        onTitleSuggestion={onTitleChange}
        onSave={onSave}
        isEditMode={isEditMode}
      />

      <LiveUpdatesBlock
        liveUpdates={liveUpdates || false}
        liveStart={liveStart || 0}
        liveEnd={liveEnd || 0}
        onChange={(next) => {
          onLiveUpdatesChange?.(next);
        }}
      />

      <div>
        <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">
          Featured Image <span className="text-red-500">*</span>
        </label>
        <div className="mt-1">
          <ImageUploader
            imageId={featuredImageId}
            imageUrl={featuredImageUrl}
            cropData={cropData}
            onUpload={(id, url) => onFeaturedImageUpload(id, url)}
            onRemove={() => {
              setFeaturedImageId(null);
              setFeaturedImageUrl(null);
              onCropSave?.(null);
              onSave?.();
            }}
            onCropSave={onCropSave}
          />
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          className="w-full flex items-center justify-between text-xs font-semibold text-secondary-500 uppercase tracking-wider"
        >
          <span>SEO &amp; Checklist</span>
          <span className="flex items-center gap-2">
            {!checklistDone && (
              <span className="normal-case tracking-normal text-[10px] font-bold text-amber-600">
                incomplete
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform ${detailsOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </button>

        {detailsOpen && (
          <div className="mt-3 space-y-5">
            <SEOPanel
              title={title}
              slug={slug}
              setSlug={setSlug}
              onSave={onSave}
            />
            <PublishChecklist checklist={checklist} />
          </div>
        )}
      </div>

      {postId && <HistoryPanel postId={postId} onRestore={onRestoreRevision} />}

      {/* Review note (if returned from reviewer) */}
      {reviewNote && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="text-xs font-semibold text-red-600 uppercase mb-1">Review Note</h4>
          <p className="text-sm text-red-700">{reviewNote}</p>
        </div>
      )}
    </div>
  );
}

// Default = tomorrow 8 AM local: the write-tonight, post-in-the-morning case.
function defaultScheduleValue() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScheduleBlock({ postStatus, scheduledFor, ready, onSchedule, onUnschedule }) {
  const [value, setValue] = useState(defaultScheduleValue);
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  if (postStatus === "future" && scheduledFor) {
    // scheduledFor is UTC 'Y-m-d H:i:s' (or ISO) — render in local time.
    const local = new Date(
      scheduledFor.includes("T") ? scheduledFor : scheduledFor.replace(" ", "T") + "Z"
    );
    return (
      <div className="rounded-lg border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
          Scheduled
        </div>
        <div className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">
          {Number.isNaN(local.getTime())
            ? scheduledFor
            : local.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(onUnschedule)}
          className="mt-2 text-xs font-medium text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          Unschedule (back to draft)
        </button>
      </div>
    );
  }

  const valid = value && new Date(value).getTime() > Date.now() + 60_000;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-secondary-500">
        Schedule for later
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 min-w-0 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-800 dark:text-gray-200"
        />
        <button
          type="button"
          disabled={!valid || !ready || busy}
          onClick={() => run(() => onSchedule(value))}
          className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "..." : "Schedule"}
        </button>
      </div>
      {!ready && (
        <p className="mt-1.5 text-[11px] text-amber-600">
          Finish the publish checklist first (title, image, category, content).
        </p>
      )}
    </div>
  );
}

function LiveUpdatesBlock({
  liveUpdates,
  liveStart,
  liveEnd,
  onChange, // ({ liveUpdates, liveStart, liveEnd }) => void
}) {
  const [activeThread, setActiveThread] = useState(null); // { post_id, title, slug } | null
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);

  // Fetch current active thread when checkbox is first enabled
  useEffect(() => {
    if (!liveUpdates) {
      setActiveThread(null);
      setConflictAcknowledged(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "";
        const res = await fetch(`${apiUrl}/bbjd/v1/live-thread/current`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setActiveThread(data);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [liveUpdates]);

  function handleToggle(e) {
    const next = e.target.checked;
    if (!next) {
      onChange({ liveUpdates: false, liveStart: 0, liveEnd: 0 });
      setConflictAcknowledged(false);
      return;
    }
    onChange({ liveUpdates: true, liveStart: 0, liveEnd: 0 });
  }

  function setStartOfDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onChange({ liveUpdates, liveStart: Math.floor(today.getTime() / 1000), liveEnd });
  }

  function setEndChoice(value) {
    if (value === "continuous") {
      onChange({ liveUpdates, liveStart, liveEnd: 0 });
    } else if (value === "end_of_day") {
      const today = new Date();
      today.setHours(23, 59, 59, 0);
      onChange({ liveUpdates, liveStart, liveEnd: Math.floor(today.getTime() / 1000) });
    }
  }

  const isActive = liveUpdates;
  const hasUnresolvedConflict =
    isActive && activeThread && activeThread.post_id && !conflictAcknowledged;

  return (
    <div className={`mb-4 rounded-lg p-3 ${isActive ? "border-2 border-secondary-500 bg-white" : "border border-gray-200 bg-white"}`}>
      <label className="flex items-center gap-2 cursor-pointer mb-2">
        <input
          type="checkbox"
          checked={!!liveUpdates}
          onChange={handleToggle}
          className="w-4 h-4 accent-primary-500"
        />
        <span className="font-bold text-primary-500">Live Updates</span>
        {isActive && (
          <span className="ml-auto inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {"●"} LIVE
          </span>
        )}
      </label>

      {isActive && (
        <>
          {hasUnresolvedConflict && (
            <ConflictPrompt
              activeThread={activeThread}
              onConfirm={() => {
                // User acknowledges they want to displace the active thread.
                // The actual /take-over call happens at publish (handled in EditorPage)
                // so we never have a moment where two threads are partially active.
                setConflictAcknowledged(true);
              }}
              onCancel={() => onChange({ liveUpdates: false, liveStart: 0, liveEnd: 0 })}
            />
          )}
          <div className="mb-2">
            <div className="text-[11px] font-bold text-gray-500 mb-1">START</div>
            <div className="flex gap-1.5 items-stretch">
              <input
                value={liveStart > 0 ? new Date(liveStart * 1000).toLocaleString() : "On publish (default)"}
                readOnly
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5"
              />
              <button
                type="button"
                onClick={setStartOfDay}
                className="text-xs border border-gray-200 bg-white rounded px-2"
                title="Start at midnight today"
              >
                Day
              </button>
            </div>
          </div>
          <div className="mb-2">
            <div className="text-[11px] font-bold text-gray-500 mb-1">END</div>
            <select
              value={liveEnd === 0 ? "continuous" : "end_of_day"}
              onChange={(e) => setEndChoice(e.target.value)}
              className="w-full text-xs bg-white border border-gray-200 rounded px-2 py-1.5"
            >
              <option value="end_of_day">End of day (11:59pm)</option>
              <option value="continuous">Continuous (until displaced)</option>
            </select>
          </div>
          <div className="text-[11px] bg-yellow-50 border-l-2 border-secondary-500 text-yellow-900 p-2 rounded">
            Feed updates posted in this window stream into the post chronologically.
          </div>
        </>
      )}
    </div>
  );
}

function ConflictPrompt({ activeThread, onConfirm, onCancel }) {
  return (
    <div className="mb-3 p-3 rounded border-2 border-red-500 bg-red-50 text-sm">
      <div className="font-bold text-red-700 mb-1">A live thread is already active:</div>
      <div className="font-bold text-gray-800 mb-2">{activeThread.title}</div>
      <p className="mb-2 text-[11px] leading-snug text-gray-600">
        Nothing closes yet - the swap happens when this post actually
        publishes. If you schedule it, the current thread stays live until
        the scheduled time.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-2 py-1 border border-gray-300 bg-white rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="text-xs px-2 py-1 bg-red-500 text-white rounded font-bold"
        >
          Close it &amp; start this one
        </button>
      </div>
    </div>
  );
}
