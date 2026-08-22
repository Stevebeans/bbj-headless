"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getConductMember, conductAction } from "@/lib/api/adminConduct";

const fmtDate = (s) => (s ? new Date(s.replace(" ", "T") + "Z").toLocaleString() : "");
const REASON_LABELS = { spam: "Spam", abuse: "Abuse/Harassment", off_topic: "Off Topic", misinformation: "Misinformation", other: "Other" };
const ACTION_LABELS = { warning: "Formal warning", timeout: "Timeout", ban: "Ban", lift: "Restrictions lifted" };

export default function ConductMember() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null);
  const [note, setNote] = useState("");
  const [scope, setScope] = useState("both");
  const [duration, setDuration] = useState("24h");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await getConductMember(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const act = async (action) => {
    const labels = { warning: "send a formal warning to", timeout: `apply a ${duration} timeout to`, ban: "BAN", lift: "lift all restrictions on" };
    if (!confirm(`Really ${labels[action]} ${data.user.name}?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await conductAction(id, { action, scope: action === "timeout" ? scope : "", duration: action === "timeout" ? duration : "", note });
      setData((d) => ({ ...d, actions: res.actions, active: res.active }));
      setNote("");
      setSuccess(`${ACTION_LABELS[action]} applied${res.dm_sent ? ", member notified by DM" : ""}.`);
      setTimeout(() => setSuccess(null), 4000);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-gray-500">Loading...</div>;
  if (error && !data) return <div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>;
  if (!data) return null;

  return (
    <div>
      <button onClick={() => router.push("/admin/conduct")} className="text-sm text-primary-600 hover:underline mb-4">&larr; Back to Conduct</button>

      {/* Member header */}
      <div className="flex items-center gap-4 mb-6">
        {data.user.avatar && <img src={data.user.avatar} alt="" className="w-14 h-14 rounded-full" />}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{data.user.name}</h1>
          <p className="text-sm text-gray-500">@{data.user.login} · {data.user.roles.join(", ")}</p>
        </div>
      </div>

      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      {success && <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">{success}</div>}

      {/* Active restrictions banner */}
      {data.active?.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Active restrictions</div>
          {data.active.map((a) => (
            <div key={a.id} className="text-sm text-amber-700 dark:text-amber-400">
              {a.action === "ban" ? "Banned (permanent)" : `Timeout (${a.scope})${a.expires_at ? `, lifts ${fmtDate(a.expires_at)}` : ""}`}
            </div>
          ))}
        </div>
      )}

      {/* Enforcement ladder */}
      <div className="mb-8 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Take action</div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
          placeholder="Note to include in the member DM and the log (optional)"
          className="w-full mb-3 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-sm" />
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy} onClick={() => act("warning")}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50">
            Send formal warning
          </button>
          <div className="flex items-center gap-2">
            <select value={scope} onChange={(e) => setScope(e.target.value)}
              className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-sm">
              <option value="commenting">Commenting</option>
              <option value="dm_init">New DMs</option>
              <option value="both">Both</option>
            </select>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}
              className="px-2 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-sm">
              <option value="24h">24 hours</option>
              <option value="72h">72 hours</option>
              <option value="7d">7 days</option>
            </select>
            <button disabled={busy} onClick={() => act("timeout")}
              className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium disabled:opacity-50">
              Timeout
            </button>
          </div>
          <button disabled={busy} onClick={() => act("ban")}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50">
            Ban
          </button>
          {data.active?.length > 0 && (
            <button disabled={busy} onClick={() => act("lift")}
              className="px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm font-medium disabled:opacity-50">
              Lift restrictions
            </button>
          )}
        </div>
      </div>

      {/* Report timeline */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Reports ({data.reports.length})</h2>
      <div className="space-y-3 mb-8">
        {data.reports.map((r) => (
          <div key={`${r.type}-${r.id}`} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm mb-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.type === "dm" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"}`}>
                {r.type === "dm" ? "DM" : "Comment"}
              </span>
              <span className="font-medium">{REASON_LABELS[r.reason] || r.reason}</span>
              <span className="text-gray-400">reported by {r.reporter_name} · {fmtDate(r.created_at)}</span>
              <span className={`ml-auto text-xs ${r.status === "pending" ? "text-red-600" : "text-gray-400"}`}>{r.status}</span>
            </div>
            {r.details && <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">&ldquo;{r.details}&rdquo;</p>}
            {r.type === "comment" && r.evidence && (
              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800 text-sm">
                {r.evidence.post_title && <div className="text-xs text-gray-400 mb-1">On: {r.evidence.post_title}</div>}
                {r.evidence.content ? r.evidence.content : <span className="italic text-gray-400">(comment deleted)</span>}
              </div>
            )}
            {r.type === "dm" && r.evidence && (
              <div className="p-3 rounded bg-slate-50 dark:bg-slate-800 text-sm space-y-1.5">
                {r.evidence.context.map((c, i) => (
                  <div key={i} className="text-gray-500 dark:text-gray-400">
                    <span className="text-xs font-medium">{c.sender_name}:</span> {c.body}
                  </div>
                ))}
                <div className="text-red-700 dark:text-red-400 font-medium border-l-2 border-red-400 pl-2">
                  <span className="text-xs">{r.evidence.message.sender_name}:</span> {r.evidence.message.body}
                </div>
              </div>
            )}
            {r.type === "dm" && !r.evidence && (
              <p className="text-xs text-gray-400 italic">Conversation-level report (no specific message attached).</p>
            )}
          </div>
        ))}
      </div>

      {/* Enforcement history */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Enforcement history ({data.actions.length})</h2>
      <div className="space-y-2">
        {data.actions.length === 0 && <p className="text-sm text-gray-500">No actions taken yet.</p>}
        {data.actions.map((a) => (
          <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">
            <span className="font-medium">{ACTION_LABELS[a.action] || a.action}</span>
            {a.action === "timeout" && <span className="text-gray-500">{a.scope}{a.expires_at ? `, until ${fmtDate(a.expires_at)}` : ""}</span>}
            {a.revoked_at && <span className="text-xs text-gray-400">(lifted {fmtDate(a.revoked_at)})</span>}
            {a.note && <span className="text-gray-500 truncate">&ldquo;{a.note}&rdquo;</span>}
            <span className="ml-auto text-xs text-gray-400">by {a.moderator_name} · {fmtDate(a.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
