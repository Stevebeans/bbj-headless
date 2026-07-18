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
  { id: "navy", label: "Navy", text: "#f1f5f9", muted: "#94a3b8", style: { background: "#16233b" } },
  {
    id: "bean",
    label: "Bean",
    text: "#f1f5f9",
    muted: "#c9b99a",
    style: { background: "linear-gradient(135deg, #3b2f23 0%, #6b5334 100%)" },
  },
  {
    id: "slate",
    label: "Slate",
    text: "#f1f5f9",
    muted: "#94a3b8",
    style: { background: "linear-gradient(160deg, #1e293b 0%, #0f172a 100%)" },
  },
  {
    id: "paper",
    label: "Paper",
    text: "#0f172a",
    muted: "#64748b",
    style: { background: "#f8fafc" },
  },
  {
    id: "cream",
    label: "Cream",
    text: "#3b2f23",
    muted: "#8a7a63",
    style: { background: "linear-gradient(135deg, #fdf6e9 0%, #f3e5cd 100%)" },
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

// Fetch a (same-origin) image and inline it as a data URL so html-to-image
// rasterizes it deterministically. A plain URL src can silently drop out of
// the export when the library's re-fetch races or fails - that's how the
// first live card posted without its avatar (7/18).
function useDataUrl(src) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    let alive = true;
    setDataUrl(null);
    if (!src) return undefined;
    (async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onload = () => alive && setDataUrl(reader.result);
        reader.readAsDataURL(blob);
      } catch {
        if (alive) setDataUrl(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [src]);
  return dataUrl;
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
  // Data-URL image sources: fully loaded before export, or initials fallback.
  const avatarData = useDataUrl(
    platform === "Bluesky"
      ? `/api/social/avatar?actor=${encodeURIComponent(post.handle)}`
      : post.avatar || null
  );
  const imageData = useDataUrl(post.image || null);
  const [caption, setCaption] = useState("");
  const [captionLoading, setCaptionLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // {ok, msg}

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
              // Text-only cards stay 16:9; image cards grow to fit the whole
              // image (Benny-style tall cards) instead of center-cropping.
              height: post.image ? "auto" : 338,
              minHeight: 338,
              padding: 32,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              color: bg.text,
              fontFamily: "Georgia, 'Times New Roman', serif",
              borderRadius: 0,
              ...bg.style,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {avatarData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarData}
                  alt=""
                  width={48}
                  height={48}
                  style={{ borderRadius: "50%", objectFit: "cover" }}
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
                <div style={{ fontSize: 13, color: bg.muted }}>
                  @{post.handle} · {fmtPostedAt(post.posted_at)}
                </div>
              </div>
            </div>

            {post.image ? (
              <>
                <p
                  style={{
                    fontSize: Math.min(fontSizeFor(post.text), 16),
                    lineHeight: 1.35,
                    margin: "10px 0",
                    flex: "0 0 auto",
                  }}
                >
                  {post.text}
                </p>
                <div style={{ overflow: "hidden", borderRadius: 8, marginBottom: 10 }}>
                  {imageData && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageData}
                      alt=""
                      style={{
                        width: "100%",
                        maxHeight: 680,
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  )}
                </div>
              </>
            ) : (
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
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: bg.muted,
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
            disabled={busy || !pageId || (!!post.image && !imageData)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Working…" : post.image && !imageData ? "Loading image…" : "Post now"}
          </button>
          <button
            type="button"
            onClick={addToQueue}
            disabled={busy || !pageId || (!!post.image && !imageData)}
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
