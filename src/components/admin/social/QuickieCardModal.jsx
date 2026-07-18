"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  generateQuickieCaption,
  getFacebookPages,
  postPhotoToFacebook,
  queueQuickie,
} from "@/lib/api/admin";

const BACKGROUNDS = [
  { id: "navy", label: "Navy", style: { background: "#16233b" } },
  {
    id: "bean",
    label: "Bean",
    style: { background: "linear-gradient(135deg, #3b2f23 0%, #6b5334 100%)" },
  },
  {
    id: "slate",
    label: "Slate",
    style: { background: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)" },
  },
];

// Scale the card text down as posts get longer so everything fits 16:9.
function fontSizeFor(text) {
  const len = (text || "").length;
  if (len < 100) return 26;
  if (len < 200) return 22;
  if (len < 300) return 19;
  return 16;
}

function fmtPostedAt(utc) {
  if (!utc) return "";
  const d = new Date(utc.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function QuickieCardModal({ post, onClose }) {
  const cardRef = useRef(null);
  // Platform rides the post so a future paste-an-X-link path just sets
  // post.platform = "X" and every credit line follows. Bluesky is the default.
  const platform = post.platform || "Bluesky";
  const creditName = post.display_name || `@${post.handle}`;
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // {ok, msg}

  // Avatar via our same-origin proxy (/api/social/avatar): cdn.bsky.app sends
  // no CORS headers, so a direct fetch is browser-blocked and a direct <img>
  // would taint the html-to-image canvas. The <img> onError falls back to the
  // initials circle. Non-Bluesky posts (future X paste path) skip the lookup.
  useEffect(() => {
    setAvatarUrl(
      platform === "Bluesky"
        ? `/api/social/avatar?actor=${encodeURIComponent(post.handle)}`
        : null
    );
  }, [post.handle, platform]);

  // FB pages for the destination select.
  useEffect(() => {
    getFacebookPages()
      .then((res) => {
        const withToken = (res.pages || []).filter((p) => p.has_token);
        setPages(withToken);
        if (withToken.length) setPageId(withToken[0].id);
      })
      .catch(() => setStatus({ ok: false, msg: "Couldn't load Facebook pages" }));
  }, []);

  const fetchCaption = useCallback(async () => {
    setCaptionLoading(true);
    try {
      const res = await generateQuickieCaption(post.text, post.handle);
      if (res.success) setCaption(res.caption);
      else setStatus({ ok: false, msg: res.message || "Caption failed - write one manually" });
    } catch (e) {
      setStatus({ ok: false, msg: "Caption failed - write one manually" });
    } finally {
      setCaptionLoading(false);
    }
  }, [post.text, post.handle]);

  useEffect(() => {
    fetchCaption();
  }, [fetchCaption]);

  const exportPng = useCallback(async () => {
    // pixelRatio 2 turns the 600x338 DOM card into a 1200x676 PNG.
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
    return dataUrl.split(",")[1]; // strip data:image/png;base64,
  }, []);

  const fullMessage = useCallback(() => {
    const credit = `- via ${creditName} on ${platform}`;
    return caption.trim() ? `${caption.trim()}\n\n${credit}` : credit;
  }, [caption, creditName, platform]);

  const postNow = async () => {
    if (!pageId) return;
    setBusy(true);
    setStatus(null);
    try {
      const image_data = await exportPng();
      const res = await postPhotoToFacebook({ page_id: pageId, message: fullMessage(), image_data });
      if (res.success) setStatus({ ok: true, msg: "Posted to Facebook ✓" });
      else setStatus({ ok: false, msg: res.error || "Facebook rejected the post" });
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Card export failed" });
    } finally {
      setBusy(false);
    }
  };

  const addToQueue = async () => {
    if (!pageId) return;
    setBusy(true);
    setStatus(null);
    try {
      const image_data = await exportPng();
      const page = pages.find((p) => p.id === pageId);
      const res = await queueQuickie({
        page_id: pageId,
        page_name: page?.name || "",
        message: fullMessage(),
        image_data,
      });
      if (res.success) setStatus({ ok: true, msg: `Queued for ${res.scheduled_at} (server time) ✓` });
      else setStatus({ ok: false, msg: res.message || "Queue failed" });
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Card export failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">FB Quickie Card</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
        </div>

        {/* The card itself - this DOM node IS the exported PNG. */}
        <div className="mx-auto" style={{ width: 600, maxWidth: "100%" }}>
          <div
            ref={cardRef}
            style={{
              width: 600,
              height: 338,
              padding: 32,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              color: "#f1f5f9",
              fontFamily: "Georgia, 'Times New Roman', serif",
              borderRadius: 0,
              ...bg.style,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt=""
                  width={48}
                  height={48}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                  onError={() => setAvatarUrl(null)}
                />
              ) : (
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {(post.display_name || post.handle || "?").charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ lineHeight: 1.25 }}>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{post.display_name || post.handle}</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>
                  @{post.handle} · {fmtPostedAt(post.posted_at)}
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: fontSizeFor(post.text),
                lineHeight: 1.4,
                margin: "16px 0",
                overflow: "hidden",
                flex: 1,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span>{post.text}</span>
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "#94a3b8",
                fontFamily: "Arial, sans-serif",
              }}
            >
              <span>via {creditName} on {platform}</span>
              <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>BigBrotherJunkies.com 👁</span>
            </div>
          </div>
        </div>

        {/* Background picker */}
        <div className="flex items-center gap-2 mt-3">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBg(b)}
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                bg.id === b.id
                  ? "border-primary-500 text-primary-600"
                  : "border-slate-200 dark:border-slate-600 text-slate-500"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Caption */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Caption (Steve's line)
            </label>
            <button
              type="button"
              onClick={fetchCaption}
              disabled={captionLoading}
              className="text-xs text-primary-600 hover:underline disabled:opacity-50"
            >
              {captionLoading ? "Generating…" : "↻ Regenerate"}
            </button>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-slate-800 dark:text-slate-100"
            placeholder={captionLoading ? "Asking the Bean…" : "One dry line"}
          />
          <p className="text-xs text-slate-400 mt-1">
            Posted as: caption + "- via {creditName} on {platform}"
          </p>
        </div>

        {/* Destination + actions */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <select
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={postNow}
            disabled={busy || !pageId}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Working…" : "Post now"}
          </button>
          <button
            type="button"
            onClick={addToQueue}
            disabled={busy || !pageId}
            className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            Add to queue
          </button>
        </div>

        {status && (
          <p className={`mt-3 text-sm ${status.ok ? "text-emerald-600" : "text-red-600"}`}>
            {status.msg}
          </p>
        )}
      </div>
    </div>
  );
}
