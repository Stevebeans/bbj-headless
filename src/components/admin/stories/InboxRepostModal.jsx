"use client";

import { useEffect, useState } from "react";
import { getInboxPrefill, queueInboxQuickie } from "@/lib/api/stories";
import { getFacebookPages, getContentSlots } from "@/lib/api/admin";

export default function InboxRepostModal({ item, onClose, onQueued }) {
  const [caption, setCaption] = useState("");
  const [credit, setCredit] = useState("");
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getInboxPrefill(item.id).then((res) => { setCaption(res.caption || ""); setCredit(res.credit || ""); }).catch((e) => setStatus({ ok: false, msg: e.message }));
    getFacebookPages().then((res) => {
      const withToken = (res.pages || []).filter((p) => p.has_token);
      setPages(withToken);
      if (withToken.length) setPageId(withToken[0].id);
    }).catch(() => setStatus({ ok: false, msg: "Couldn't load Facebook pages" }));
    getContentSlots().then((res) => setSlots(res.slots || [])).catch(() => setSlots([]));
  }, [item.id]);

  const creditHandle = credit.match(/@[\w.]+|u\/[\w-]+/)?.[0] || "";
  const hasCredit = creditHandle ? caption.toLowerCase().includes(creditHandle.toLowerCase()) : true;

  const queue = async () => {
    if (!pageId || !hasCredit) return;
    setBusy(true); setStatus(null);
    try {
      const page = pages.find((p) => p.id === pageId);
      const res = await queueInboxQuickie(item.id, { page_id: pageId, page_name: page?.name || "", caption, scheduled_at: slot });
      if (res.success) { setStatus({ ok: true, msg: `Queued for ${res.scheduled_at}` }); onQueued(); }
      else setStatus({ ok: false, msg: res.message || "Queue failed" });
    } catch (e) { setStatus({ ok: false, msg: e.message }); } finally { setBusy(false); }
  };

  const preview = item.media_type === "video" || item.media_type === "carousel" ? item.thumbnail_url : (item.media_url || item.thumbnail_url);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded bg-white p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="font-semibold">Queue to Facebook</h3><button type="button" onClick={onClose} className="text-slate-400 text-xl">✕</button></div>
        <div className="flex gap-3">
          {preview && <img src={preview} alt="" className="h-40 w-40 rounded object-cover" referrerPolicy="no-referrer" />}
          <div className="text-sm text-slate-600 space-y-1">
            <div>{item.author} · {item.source}{item.media_type === "video" && " · video: the thumbnail is posted, the link goes in the caption"}</div>
            <a href={item.url} target="_blank" rel="noreferrer" className="underline break-all">{item.url}</a>
          </div>
        </div>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={8} className="w-full rounded border p-2 text-sm" />
        {!hasCredit && <p className="text-sm text-red-600">The caption must credit {creditHandle}. Put it back before queueing.</p>}
        <div className="flex flex-wrap gap-2 text-sm items-center">
          <select value={pageId} onChange={(e) => setPageId(e.target.value)} className="border rounded px-1">{pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select value={slot} onChange={(e) => setSlot(e.target.value)} className="border rounded px-1"><option value="">Auto (next free slot)</option>{slots.filter((s) => !s.taken).map((s) => <option key={s.at} value={s.at}>{s.label || s.at}</option>)}</select>
          <button type="button" disabled={busy || !pageId || !hasCredit || !caption.trim()} onClick={queue} className="rounded bg-slate-900 px-4 py-2 text-white">Queue post</button>
          {status && <span className={status.ok ? "text-green-700" : "text-red-600"}>{status.msg}</span>}
        </div>
      </div>
    </div>
  );
}
