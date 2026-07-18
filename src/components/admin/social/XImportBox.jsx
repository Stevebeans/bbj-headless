"use client";

import { useState } from "react";
import QuickieCardModal from "./QuickieCardModal";

/**
 * Paste an X post URL, rebuild it as a BBJ quickie card (text, avatar, and
 * any attached photo) via /api/social/tweet. Bluesky posts come from the
 * Top Posts board; this is the manual lane for X.
 */
export default function XImportBox() {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [cardPost, setCardPost] = useState(null);

  const importTweet = async () => {
    if (!url.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/social/tweet?url=${encodeURIComponent(url.trim())}`);
      const data = await res.json();
      if (data.success) {
        setCardPost(data.post);
        setUrl("");
      } else {
        setError(data.message || "Import failed");
      }
    } catch {
      setError("Import failed - try again in a minute.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">𝕏 Import a Post</h2>
      <p className="text-xs text-slate-400 mb-3">
        Paste an X post URL to rebuild it as a BBJ card - their text, avatar, and any attached photo.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && importTweet()}
          placeholder="https://x.com/user/status/…"
          className="flex-1 min-w-[260px] rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-slate-800 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={importTweet}
          disabled={busy || !url.trim()}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {busy ? "Importing…" : "Import"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {cardPost && <QuickieCardModal post={cardPost} onClose={() => setCardPost(null)} />}
    </section>
  );
}
