"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/admin";
import { suggestPlayer } from "@/lib/social/quoteMatch";

function todayPT() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());
}

// Stored timestamps are UTC 'Y-m-d H:i:s' with no zone marker. Render house (PT) time.
function fmtHouseTime(posted_at) {
  if (!posted_at) return "";
  const iso = posted_at.includes("T") ? posted_at : posted_at.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return posted_at;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });
}

const VISIBLE_STEP = 250;

function truncate(str, max = 200) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// Blank draft for a new approval card. `source_count` defaults to 1 for a
// star-prefilled single post; a generated candidate overrides it with its
// echo_count.
function blankDraft({ quote_text = "", speaker = "", context = "", said_on, source_count = 1 }) {
  return { quote_text, speaker, context, said_on, source_count };
}

export function TranscriptCard({ currentSeason }) {
  const [date, setDate] = useState(todayPT);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState("");
  // Busy days collect 1000+ posts; rendering them all at once makes the page
  // crawl. Window the table and let Steve pull more as he skims.
  const [visibleCount, setVisibleCount] = useState(VISIBLE_STEP);

  const [candidates, setCandidates] = useState(null); // null = none generated/stored yet
  const [candLoading, setCandLoading] = useState(false);
  const [candError, setCandError] = useState(null);

  const [houseTx, setHouseTx] = useState(null); // null = not generated for this day
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState(null);

  const [roster, setRoster] = useState([]);

  const [approved, setApproved] = useState([]);
  const [approvedLoading, setApprovedLoading] = useState(false);

  // Open approval cards, keyed by a locally-generated key so a star-opened row
  // and a generated candidate can coexist without id collisions.
  const [drafts, setDrafts] = useState([]); // [{ key, quote_text, speaker, player_id, context, said_on, source_count }]
  const [approvingKey, setApprovingKey] = useState(null);

  const showError = useCallback((setter, err, fallback) => {
    setter((err && err.message) || fallback);
  }, []);

  // Re-window when the day or the filter changes.
  useEffect(() => {
    setVisibleCount(VISIBLE_STEP);
  }, [date, filter]);

  // ---- Loaders --------------------------------------------------------------
  const loadTranscript = useCallback(async (d) => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await adminFetch(`/social/transcript?date=${d}`);
      setPosts(data.posts || []);
    } catch (err) {
      setPosts([]);
      showError(setLoadError, err, "Failed to load transcript.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadCandidates = useCallback(async (d) => {
    try {
      const data = await adminFetch(`/social/quotes/candidates?date=${d}`);
      setCandidates(data.candidates || null);
    } catch {
      setCandidates(null);
    }
  }, []);

  const loadHouseTx = useCallback(async (d) => {
    try {
      const data = await adminFetch(`/social/house-transcript?date=${d}`);
      setHouseTx(Array.isArray(data.lines) ? data.lines : null);
    } catch {
      setHouseTx(null);
    }
  }, []);

  const loadApproved = useCallback(async () => {
    setApprovedLoading(true);
    try {
      const data = await adminFetch("/social/quotes");
      setApproved(data.quotes || []);
    } catch {
      setApproved([]);
    } finally {
      setApprovedLoading(false);
    }
  }, []);

  // Roster rides the /social/config payload (the public season endpoint is
  // CORS-blocked for browser fetches). suggestPlayer reads .name/.nickname.
  useEffect(() => {
    setRoster(Array.isArray(currentSeason?.players) ? currentSeason.players : []);
  }, [currentSeason]);

  useEffect(() => {
    loadTranscript(date);
    loadCandidates(date);
    loadHouseTx(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  useEffect(() => {
    loadApproved();
  }, [loadApproved]);

  // ---- Candidates -------------------------------------------------------
  const handleFindCandidates = async () => {
    setCandLoading(true);
    setCandError(null);
    try {
      const data = await adminFetch("/social/quotes/candidates", {
        method: "POST",
        body: JSON.stringify({ date }),
      });
      if (data && data.success) {
        setCandidates(data.candidates || []);
      } else {
        setCandError((data && data.message) || "Candidate generation returned no result.");
      }
    } catch (err) {
      showError(setCandError, err, "Candidate generation failed.");
    } finally {
      setCandLoading(false);
    }
  };

  // ---- House transcript ---------------------------------------------------
  const handleGenerateTranscript = async () => {
    setTxLoading(true);
    setTxError(null);
    try {
      const data = await adminFetch("/social/house-transcript", {
        method: "POST",
        body: JSON.stringify({ date, roster: roster.map((p) => p.name) }),
      });
      if (data && data.success) {
        setHouseTx(data.lines || []);
      } else {
        setTxError((data && data.message) || "Transcript generation returned no result.");
      }
    } catch (err) {
      showError(setTxError, err, "Transcript generation failed.");
    } finally {
      setTxLoading(false);
    }
  };

  const openDraftFromLine = (line, idx) => {
    const key = `tx-${idx}`;
    if (drafts.some((d) => d.key === key)) return;
    const suggested = suggestPlayer(line.speaker, roster);
    setDrafts((prev) => [
      ...prev,
      {
        key,
        ...blankDraft({
          quote_text: line.quote,
          speaker: line.speaker,
          said_on: date,
          source_count: 1,
        }),
        player_id: suggested ? suggested.id : 0,
      },
    ]);
  };

  // ---- Draft cards (approval flow) ---------------------------------------
  const openDraftFromCandidate = (candidate, idx) => {
    const key = `cand-${idx}`;
    if (drafts.some((d) => d.key === key)) return;
    const suggested = suggestPlayer(candidate.speaker, roster);
    setDrafts((prev) => [
      ...prev,
      {
        key,
        ...blankDraft({
          quote_text: candidate.quote,
          speaker: candidate.speaker,
          said_on: date,
          source_count: candidate.echo_count || 1,
        }),
        player_id: suggested ? suggested.id : 0,
      },
    ]);
  };

  const openDraftFromPost = (post) => {
    const key = `post-${post.id}`;
    if (drafts.some((d) => d.key === key)) return;
    setDrafts((prev) => [
      ...prev,
      {
        key,
        ...blankDraft({ quote_text: post.text, said_on: date, source_count: 1 }),
        player_id: 0,
      },
    ]);
  };

  const dismissDraft = (key) => {
    setDrafts((prev) => prev.filter((d) => d.key !== key));
  };

  const patchDraft = (key, field, value) => {
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, [field]: value } : d)));
  };

  const approveDraft = async (draft) => {
    setApprovingKey(draft.key);
    try {
      const data = await adminFetch("/social/quotes", {
        method: "POST",
        body: JSON.stringify({
          quote_text: draft.quote_text,
          player_id: draft.player_id || 0,
          said_on: draft.said_on,
          context: draft.context || "",
          source_count: draft.source_count || 1,
        }),
      });
      if (data && data.success) {
        dismissDraft(draft.key);
        await loadApproved();
      }
    } catch (err) {
      showError(setCandError, err, "Approve failed.");
    } finally {
      setApprovingKey(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminFetch(`/social/quotes/${id}`, { method: "DELETE" });
      await loadApproved();
    } catch {
      // No dedicated error slot for the approved list; a failed delete just
      // leaves the row in place and the admin can retry.
    }
  };

  const filteredPosts = filter.trim()
    ? posts.filter((p) => (p.text || "").toLowerCase().includes(filter.trim().toLowerCase()))
    : posts;
  const visiblePosts = filteredPosts.slice(0, visibleCount);

  return (
    <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-base font-osw font-bold text-slate-800 dark:text-white">Transcript</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={handleFindCandidates}
            disabled={candLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {candLoading && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {candLoading ? "Finding..." : "Find candidates"}
          </button>
        </div>
      </div>

      {candError && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {candError}
        </div>
      )}

      {/* Candidate batch */}
      {Array.isArray(candidates) && candidates.length > 0 && (
        <div className="mb-6 space-y-2">
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">Quote candidates</h4>
          <div className="flex flex-wrap gap-2">
            {candidates.map((c, idx) => {
              const key = `cand-${idx}`;
              const opened = drafts.some((d) => d.key === key);
              return (
                <button
                  key={key}
                  onClick={() => openDraftFromCandidate(c, idx)}
                  disabled={opened}
                  className="text-left px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed max-w-sm"
                >
                  <span className="block text-slate-700 dark:text-slate-300">&ldquo;{truncate(c.quote, 120)}&rdquo;</span>
                  <span className="text-xs text-slate-400">
                    {c.speaker || "Unknown"} &middot; {c.echo_count || 1}x
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* House transcript — the day as a screenplay, distilled from the posts below */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">House Transcript</h4>
          <button
            onClick={handleGenerateTranscript}
            disabled={txLoading}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {txLoading && (
              <span className="w-4 h-4 border-2 border-slate-400/40 border-t-slate-500 rounded-full animate-spin" />
            )}
            {txLoading ? "Generating..." : houseTx ? "Regenerate" : "Generate"}
          </button>
        </div>
        {txError && (
          <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {txError}
          </div>
        )}
        {houseTx === null ? (
          !txLoading && (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No transcript generated for this day yet.
            </p>
          )
        ) : houseTx.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Nothing quotable found for this day.
          </p>
        ) : (
          <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60 max-h-[32rem] overflow-y-auto">
            {houseTx.map((line, idx) => (
              <div key={`tx-${idx}`} className="flex items-baseline gap-3 px-4 py-2 text-sm">
                <span className="text-xs text-slate-400 whitespace-nowrap w-16 shrink-0">{line.time}</span>
                <span className="min-w-0 flex-grow text-slate-700 dark:text-slate-300 break-words">
                  <span className="font-medium text-slate-800 dark:text-white">
                    {line.speaker}
                    {line.to ? ` → ${line.to}` : ""}
                  </span>
                  {": "}
                  {line.kind === "paraphrase" ? (
                    <em className="text-slate-500 dark:text-slate-400">{line.quote}</em>
                  ) : (
                    <>&ldquo;{line.quote}&rdquo;</>
                  )}
                  {line.source && (
                    <span className="text-xs text-slate-400"> &middot; @{line.source}</span>
                  )}
                </span>
                <button
                  onClick={() => openDraftFromLine(line, idx)}
                  className="text-slate-300 hover:text-secondary-500 shrink-0"
                  title="Make this a quote"
                >
                  ★
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approval cards */}
      {drafts.length > 0 && (
        <div className="mb-6 space-y-3">
          {drafts.map((d) => (
            <div key={d.key} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Quote</label>
                  <textarea
                    value={d.quote_text}
                    onChange={(e) => patchDraft(d.key, "quote_text", e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Player</label>
                  <select
                    value={d.player_id || 0}
                    onChange={(e) => patchDraft(d.key, "player_id", parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={0}>— season only —</option>
                    {roster.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={d.said_on || date}
                    onChange={(e) => patchDraft(d.key, "said_on", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Context</label>
                  <input
                    value={d.context || ""}
                    onChange={(e) => patchDraft(d.key, "context", e.target.value)}
                    placeholder="Optional context, e.g. what prompted it"
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => approveDraft(d)}
                  disabled={approvingKey === d.key || !d.quote_text.trim()}
                  className="px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {approvingKey === d.key ? "Approving..." : "Approve"}
                </button>
                <button
                  onClick={() => dismissDraft(d.key)}
                  className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search-in-day filter */}
      <div className="mb-4">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter this day's posts..."
          className="w-full max-w-md px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {loadError}
        </div>
      )}

      {/* Transcript table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">
          {posts.length === 0 ? "No posts for this day." : "No posts match your filter."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Time</th>
                <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Source</th>
                <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Handle</th>
                <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Text</th>
                <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {visiblePosts.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800 align-top hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {fmtHouseTime(p.posted_at)}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        p.source === "trusted"
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {p.source === "trusted" ? "trusted" : "tag"}
                    </span>
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap max-w-[240px]">
                    <span className="text-primary-500 font-medium block truncate">@{p.handle}</span>
                    {p.display_name && (
                      <div className="text-xs text-slate-400 truncate" title={p.display_name}>
                        {p.display_name}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-slate-700 dark:text-slate-300 max-w-md break-words">
                    <span title={p.text}>{truncate(p.text, 200)}</span>
                  </td>
                  <td className="py-2 px-2 text-right whitespace-nowrap">
                    <button
                      onClick={() => openDraftFromPost(p)}
                      disabled={drafts.some((d) => d.key === `post-${p.id}`)}
                      className="px-2 py-1 text-xs font-medium rounded-lg border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Mark as quote candidate"
                    >
                      ★
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPosts.length > visibleCount && (
            <div className="text-center py-3">
              <button
                onClick={() => setVisibleCount((n) => n + VISIBLE_STEP)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Show more ({filteredPosts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Approved quotes */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Approved quotes</h4>
        {approvedLoading ? (
          <div className="text-center py-6">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
          </div>
        ) : approved.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm py-4">No approved quotes yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {approved.map((q) => (
              <li key={q.id} className="bg-white dark:bg-slate-800 flex items-center justify-between gap-3 px-4 py-3">
                <div className="text-sm text-slate-700 dark:text-slate-300 min-w-0">
                  <span className="text-slate-400">{q.said_on}</span> &middot; &ldquo;{q.quote_text}&rdquo;{" "}
                  <span className="text-slate-400">&mdash; {q.player_name || "the house"}</span>
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="px-2 py-1 text-xs font-medium rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 shrink-0"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
