"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/admin";

/**
 * Admin editor for the Bean's shared fact sheet (bbj_bean_memory row
 * user_id=0). Conversational "save that to memory for others" writes land
 * here; this card lets Steve prune or rewrite them directly.
 */
export default function BeanFactsEditor() {
  const [facts, setFacts] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    adminFetch("/bean/facts")
      .then((res) => {
        setFacts(res.facts || "");
        setLoaded(true);
      })
      .catch(() => setStatus({ ok: false, msg: "Failed to load the fact sheet" }));
  }, []);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await adminFetch("/bean/facts", {
        method: "POST",
        body: JSON.stringify({ facts }),
      });
      setFacts(res.facts || "");
      setDirty(false);
      setStatus({ ok: true, msg: "Saved ✓" });
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">🫘 Bean Shared Facts</h2>
      <p className="text-xs text-slate-400 mb-3">
        Injected into every user's Bean chat. Conversational saves ("save that to memory for
        others") append here — prune or rewrite freely; an empty sheet is fine.
      </p>
      <textarea
        value={facts}
        onChange={(e) => {
          setFacts(e.target.value);
          setDirty(true);
        }}
        rows={8}
        disabled={!loaded}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-2 text-sm text-slate-800 dark:text-slate-100 font-mono disabled:opacity-50"
        placeholder={loaded ? "No shared facts yet." : "Loading…"}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || !loaded || !dirty}
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save facts"}
        </button>
        {status && (
          <span className={`text-sm ${status.ok ? "text-emerald-600" : "text-red-600"}`}>{status.msg}</span>
        )}
      </div>
    </section>
  );
}
