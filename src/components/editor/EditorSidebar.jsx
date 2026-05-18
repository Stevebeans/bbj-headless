"use client";

import { useEffect, useState } from "react";
import CategoryPicker from "./CategoryPicker";
import ImageUploader from "./ImageUploader";
import SEOPanel from "./SEOPanel";
import PublishChecklist from "./PublishChecklist";

export default function EditorSidebar({
  categoryIds, setCategoryIds,
  featuredImageId, setFeaturedImageId,
  featuredImageUrl, setFeaturedImageUrl,
  cropData, onCropSave,
  title, slug, setSlug,
  metaDescription, setMetaDescription,
  checklist, reviewNote,
  editor, onSave, onSaveNow, onTitleChange, isEditMode,
  liveUpdates, liveStart, liveEnd, onLiveUpdatesChange,
}) {
  return (
    <div className="p-4 space-y-5">
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
            onUpload={(id, url, altText) => {
              setFeaturedImageId(id);
              setFeaturedImageUrl(url);
              setTimeout(() => onSaveNow?.(), 0);
            }}
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

      <SEOPanel
        title={title}
        slug={slug}
        setSlug={setSlug}
        onSave={onSave}
        onTitleChange={onTitleChange}
        editor={editor}
      />

      <PublishChecklist checklist={checklist} />

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
