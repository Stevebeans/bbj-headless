"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { adminFetch, getFacebookPages, postPhotoToFacebook, queueQuickie } from "@/lib/api/admin";

const TOP_N = 8;
const proxied = (src) => `/api/social/img?src=${encodeURIComponent(src)}`;

// Inline an image as a data URL so html-to-image exports it deterministically.
async function toDataUrl(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Daily Fan Favorite snapshot card: current standings + 24h movers, exported
 * as a branded PNG for FB. The card itself carries the vote URL (photo posts
 * keep their reach; the pitch rides the image, not a link).
 */
export default function FanFavSnapshot() {
  const cardRef = useRef(null);
  const [data, setData] = useState(null);
  const [photos, setPhotos] = useState({});
  const [caption, setCaption] = useState(
    "Today's Fan Favorite standings. You can change your ballot every day - takes 30 seconds at bigbrotherjunkies.com/fan-favorites"
  );
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  const load = useCallback(async () => {
    setStatus(null);
    try {
      const res = await adminFetch("/fan-votes/tracker");
      setData(res);
      const top = (res.players || []).slice(0, TOP_N);
      const entries = await Promise.all(
        top.map(async (p) => [p.id, p.photo ? await toDataUrl(proxied(p.photo)) : null])
      );
      setPhotos(Object.fromEntries(entries));
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Failed to load standings" });
    }
  }, []);

  useEffect(() => {
    load();
    getFacebookPages()
      .then((res) => {
        const withToken = (res.pages || []).filter((p) => p.has_token);
        setPages(withToken);
        if (withToken.length) setPageId(withToken[0].id);
      })
      .catch(() => {});
  }, [load]);

  const top = (data?.players || []).slice(0, TOP_N);
  const photosReady = top.every((p) => !p.photo || photos[p.id] !== undefined);
  const biggestUp = top.reduce(
    (best, p) => ((p.delta24h || 0) > (best?.delta24h || 0) ? p : best),
    null
  );

  const dateLabel = new Date().toLocaleDateString([], {
    month: "long",
    day: "numeric",
  });

  const exportPng = useCallback(async () => {
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
    return dataUrl.split(",")[1];
  }, []);

  const postNow = async () => {
    if (!pageId) return;
    setBusy(true);
    setStatus(null);
    try {
      const image_data = await exportPng();
      const res = await postPhotoToFacebook({ page_id: pageId, message: caption, image_data });
      if (res.success) setStatus({ ok: true, msg: "Posted to Facebook ✓" });
      else setStatus({ ok: false, msg: res.error || "Facebook rejected the post" });
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Export failed" });
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
        message: caption,
        image_data,
      });
      if (res.success) setStatus({ ok: true, msg: `Queued for ${res.scheduled_at} (server time) ✓` });
      else setStatus({ ok: false, msg: res.message || "Queue failed" });
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Export failed" });
    } finally {
      setBusy(false);
    }
  };

  const downloadCard = async () => {
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `bbj-fanfav-${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Export failed" });
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">⭐ Fan Favorite Snapshot</h2>
        <button
          type="button"
          onClick={load}
          className="px-2.5 py-1 rounded-full text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
        >
          ↻
        </button>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Daily standings card with 24h movers. The vote URL rides on the image itself.
      </p>

      {!data && !status && <p className="text-sm text-slate-500">Loading standings…</p>}

      {data && (
        <>
          {/* The card - this DOM node IS the exported PNG. */}
          <div className="mx-auto" style={{ width: 600, maxWidth: "100%" }}>
            <div
              ref={cardRef}
              style={{
                width: 600,
                padding: "28px 32px 24px",
                background: "#16233b",
                color: "#f1f5f9",
                fontFamily: "Georgia, 'Times New Roman', serif",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 1 }}>
                  ⭐ FAN FAVORITE STANDINGS
                </div>
                <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
                  {dateLabel} · {data.total_voters} voters · ranked-ballot points
                </div>
              </div>

              {top.map((p, i) => {
                const d = Number(p.delta24h || 0);
                const isMover = biggestUp && p.id === biggestUp.id && d > 0;
                return (
                  <div
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "7px 10px",
                      borderRadius: 8,
                      background: isMover ? "rgba(251, 191, 36, 0.12)" : i % 2 ? "rgba(148,163,184,0.06)" : "transparent",
                    }}
                  >
                    <span style={{ width: 22, textAlign: "right", fontSize: 16, fontWeight: 700, color: "#94a3b8" }}>
                      {i + 1}
                    </span>
                    {photos[p.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photos[p.id]}
                        alt=""
                        width={34}
                        height={34}
                        style={{ borderRadius: "50%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: "#475569",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 15,
                          fontWeight: 700,
                        }}
                      >
                        {(p.name || "?").charAt(0)}
                      </div>
                    )}
                    <span style={{ flex: 1, fontSize: 17, fontWeight: 600 }}>
                      {p.name}
                      {isMover && (
                        <span style={{ fontSize: 12, color: "#fbbf24", fontFamily: "Arial, sans-serif" }}>
                          {"  "}🔥 biggest mover
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: 15, color: "#cbd5e1" }}>{p.share}%</span>
                    <span
                      style={{
                        width: 58,
                        textAlign: "right",
                        fontSize: 13,
                        fontFamily: "Arial, sans-serif",
                        color: d > 0 ? "#4ade80" : d < 0 ? "#f87171" : "#64748b",
                      }}
                    >
                      {d > 0 ? `▲ ${d.toFixed(1)}` : d < 0 ? `▼ ${Math.abs(d).toFixed(1)}` : "—"}
                    </span>
                  </div>
                );
              })}

              <div
                style={{
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: "1px solid rgba(148,163,184,0.25)",
                  textAlign: "center",
                  fontFamily: "Arial, sans-serif",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.4 }}>
                  BigBrotherJunkies.com/fan-favorites
                </div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  update your rankings daily 👁
                </div>
              </div>
            </div>
          </div>

          {/* Caption */}
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Post text</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
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
              disabled={busy || !pageId || !photosReady}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "Working…" : photosReady ? "Post now" : "Loading photos…"}
            </button>
            <button
              type="button"
              onClick={addToQueue}
              disabled={busy || !pageId || !photosReady}
              className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              Add to queue
            </button>
            <button
              type="button"
              onClick={downloadCard}
              disabled={!photosReady}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold disabled:opacity-50"
            >
              ⬇ Download
            </button>
          </div>
        </>
      )}

      {status && (
        <p className={`mt-3 text-sm ${status.ok ? "text-emerald-600" : "text-red-600"}`}>{status.msg}</p>
      )}
    </section>
  );
}
