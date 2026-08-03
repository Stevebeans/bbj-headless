"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getBrandSafetySettings,
  updateTiers,
  runDryRun,
  runApply,
  getFlagged,
  setOverride,
  getLog,
  quarantineMedia,
} from "@/lib/api/brand-safety";

const TARGETS = [
  { key: "posts", label: "Posts", batch: 25 },
  { key: "comments", label: "Comments", batch: 500 },
  { key: "quotes", label: "Quotes", batch: 500 },
];

const TIER_OPTIONS = ["censor", "watch", "off"];

const TIER_BADGE = {
  censor: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  watch: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  off: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

const ACTION_BADGE = {
  censored: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  flagged: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  watched: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function initialBackfillState() {
  return { hasRun: false, applying: false, dryRunning: false, scanned: 0, hitsObjects: 0, hitsTotal: 0, report: [], initialRemaining: 0, remaining: 0, done: false, processed: 0, purged: 0, error: null, expanded: false };
}

function TierBadge({ tier }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${TIER_BADGE[tier] || TIER_BADGE.off}`}>
      {tier}
    </span>
  );
}

export default function BrandSafetySection() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [backfill, setBackfill] = useState({
    posts: initialBackfillState(),
    comments: initialBackfillState(),
    quotes: initialBackfillState(),
  });

  const [flagged, setFlagged] = useState([]);
  const [flaggedLoading, setFlaggedLoading] = useState(true);
  const [overrideLoading, setOverrideLoading] = useState(null);

  const [termSearch, setTermSearch] = useState("");
  const [tierSaving, setTierSaving] = useState(null);

  const [log, setLog] = useState({ rows: [], total: 0 });
  const [logPage, setLogPage] = useState(1);
  const [logLoading, setLogLoading] = useState(true);

  const [quarantineResult, setQuarantineResult] = useState(null);
  const [quarantining, setQuarantining] = useState(false);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBrandSafetySettings();
      setSettings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchFlagged = useCallback(async () => {
    setFlaggedLoading(true);
    try {
      const data = await getFlagged();
      setFlagged(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setFlaggedLoading(false);
    }
  }, []);

  const fetchLog = useCallback(async (page = 1) => {
    setLogLoading(true);
    try {
      const data = await getLog(page);
      setLog(data);
      setLogPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchFlagged();
    fetchLog(1);
  }, [fetchSettings, fetchFlagged, fetchLog]);

  const tierCounts = useMemo(() => {
    const counts = { censor: 0, watch: 0, off: 0 };
    if (settings?.tiers) {
      for (const tier of Object.values(settings.tiers)) {
        if (counts[tier] !== undefined) counts[tier]++;
      }
    }
    return counts;
  }, [settings]);

  const filteredTerms = useMemo(() => {
    if (!settings?.tiers) return [];
    const entries = Object.entries(settings.tiers);
    const q = termSearch.trim().toLowerCase();
    const filteredEntries = q ? entries.filter(([term]) => term.includes(q)) : entries;
    return filteredEntries.sort((a, b) => a[0].localeCompare(b[0]));
  }, [settings, termSearch]);

  const handleTierChange = async (term, newTier) => {
    setTierSaving(term);
    setError(null);
    // optimistic update
    setSettings((prev) => (prev ? { ...prev, tiers: { ...prev.tiers, [term]: newTier } } : prev));
    try {
      const data = await updateTiers({ [term]: newTier });
      setSettings(data);
      showSuccess(`"${term}" set to ${newTier}`);
    } catch (err) {
      setError(err.message);
      fetchSettings(); // revert to server truth
    } finally {
      setTierSaving(null);
    }
  };

  const handleDryRun = async (target) => {
    setBackfill((prev) => ({
      ...prev,
      [target]: { ...initialBackfillState(), dryRunning: true },
    }));
    setError(null);
    try {
      let res = await runDryRun(target);
      while (!res.done) {
        setBackfill((prev) => ({
          ...prev,
          [target]: { ...prev[target], scanned: res.scanned_so_far, hitsObjects: res.hits_objects_so_far },
        }));
        // Scan continuation spacing — a large table (e.g. comments) needs many
        // slices; give the server a beat between them rather than hammering it.
        await sleep(1000);
        res = await runDryRun(target);
      }
      setBackfill((prev) => ({
        ...prev,
        [target]: {
          ...initialBackfillState(),
          hasRun: true,
          scanned: res.scanned,
          hitsObjects: res.hits_objects,
          hitsTotal: res.hits_total,
          report: res.report || [],
          initialRemaining: res.hits_objects,
          remaining: res.hits_objects,
          done: res.hits_objects === 0,
        },
      }));
    } catch (err) {
      setError(err.message);
      setBackfill((prev) => ({ ...prev, [target]: { ...prev[target], dryRunning: false } }));
    }
  };

  const handleApply = async (target, purge = false) => {
    const batch = TARGETS.find((t) => t.key === target)?.batch || 25;
    setBackfill((prev) => ({ ...prev, [target]: { ...prev[target], applying: true, error: null } }));

    let done = false;
    let totalPurged = 0;
    let totalProcessed = 0;

    try {
      while (!done) {
        const res = await runApply(target, batch, purge && target === "posts");
        if (res.error) {
          setBackfill((prev) => ({ ...prev, [target]: { ...prev[target], applying: false, error: res.error } }));
          return;
        }
        totalPurged += res.purged || 0;
        totalProcessed += res.processed || 0;
        done = res.done;
        setBackfill((prev) => ({
          ...prev,
          [target]: { ...prev[target], remaining: res.remaining, done: res.done, processed: totalProcessed, purged: totalPurged },
        }));
        if (!done) {
          // Cost guardrail — do not shorten. Spaces out apply batches so a
          // backfill run doesn't stampede the purge/revalidate webhook.
          await sleep(2000);
        }
      }
      showSuccess(`${target}: backfill applied (${totalProcessed} processed${totalPurged ? `, ${totalPurged} purged` : ""})`);
      fetchFlagged();
      fetchLog(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setBackfill((prev) => ({ ...prev, [target]: { ...prev[target], applying: false } }));
    }
  };

  const handleApplyWithPurgeConfirm = (target) => {
    if (
      !confirm(
        "Apply + purge (PRODUCTION): this censors the matched content AND fires a live Cloudflare/ISR revalidate for every applied post. Continue?"
      )
    ) {
      return;
    }
    handleApply(target, true);
  };

  const handleToggleReport = (target) => {
    setBackfill((prev) => ({ ...prev, [target]: { ...prev[target], expanded: !prev[target].expanded } }));
  };

  const handleOverrideToggle = async (post) => {
    setOverrideLoading(post.id);
    setError(null);
    try {
      await setOverride(post.id, !post.overridden);
      setFlagged((prev) => prev.map((p) => (p.id === post.id ? { ...p, overridden: !post.overridden } : p)));
      showSuccess(`"${post.title}" marked ${!post.overridden ? "safe" : "unsafe"}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setOverrideLoading(null);
    }
  };

  const handleQuarantine = async () => {
    if (
      !confirm(
        "Move all locally-stored comment media into quarantine storage? This does not delete files, only relocates them out of the public upload path."
      )
    ) {
      return;
    }
    setQuarantining(true);
    setError(null);
    try {
      const res = await quarantineMedia();
      setQuarantineResult(res);
      showSuccess(`Quarantine run complete: ${res.moved} moved${res.errors?.length ? `, ${res.errors.length} errors` : ""}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setQuarantining(false);
    }
  };

  const logTotalPages = Math.max(1, Math.ceil((log.total || 0) / 50));

  if (loading) {
    return (
      <section className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
        <div className="animate-pulse space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-700">
      <h2 className="text-xl font-osw font-bold text-slate-800 dark:text-white mb-4">Brand Safety</h2>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Card 1: Status */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">Status</h3>
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              settings?.enabled
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
            }`}
          >
            {settings?.enabled ? "Scanning enabled" : "Scanning disabled"}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">(toggled outside this panel)</span>
        </div>
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="block text-2xl font-bold text-red-600 dark:text-red-400">{tierCounts.censor}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Censor</span>
          </div>
          <div className="px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="block text-2xl font-bold text-amber-600 dark:text-amber-400">{tierCounts.watch}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Watch</span>
          </div>
          <div className="px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
            <span className="block text-2xl font-bold text-slate-500 dark:text-slate-400">{tierCounts.off}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Off</span>
          </div>
        </div>

        {/* Quarantine */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Comment media quarantine</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Moves locally-stored comment uploads out of the public path. There&apos;s no read-only status
            endpoint for this — run it to see the current local count and result.
          </p>
          <button
            onClick={handleQuarantine}
            disabled={quarantining}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {quarantining ? "Quarantining..." : "Quarantine local uploads"}
          </button>
          {quarantineResult && (
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Moved <strong>{quarantineResult.moved}</strong>, {quarantineResult.errors?.length || 0} errors,{" "}
              <strong>{quarantineResult.remaining_local}</strong> still local.
              {quarantineResult.errors?.length > 0 && (
                <ul className="mt-1 list-disc list-inside text-red-500">
                  {quarantineResult.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Backfill */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">Legacy Content Backfill</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Dry-run first to see what would be affected, then apply in batches. Apply spaces batches 2s
          apart — a full backfill on a large target can take a while; leave the tab open.
        </p>

        <div className="space-y-6">
          {TARGETS.map(({ key, label, batch }) => {
            const state = backfill[key];
            const pct = state.initialRemaining > 0 ? Math.round(((state.initialRemaining - state.remaining) / state.initialRemaining) * 100) : state.hasRun ? 100 : 0;
            return (
              <div key={key} className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-semibold text-slate-800 dark:text-white">{label}</h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDryRun(key)}
                      disabled={state.applying || state.dryRunning}
                      className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50"
                    >
                      {state.dryRunning ? "Scanning..." : "Dry run"}
                    </button>
                    <button
                      onClick={() => handleApply(key, false)}
                      disabled={!state.hasRun || state.applying || state.dryRunning || state.done}
                      className="px-3 py-1.5 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {state.applying ? "Applying..." : "Apply"}
                    </button>
                    {key === "posts" && (
                      <button
                        onClick={() => handleApplyWithPurgeConfirm(key)}
                        disabled={!state.hasRun || state.applying || state.dryRunning || state.done}
                        className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Applies AND fires a live Cloudflare/ISR purge per post"
                      >
                        Apply + purge (production)
                      </button>
                    )}
                  </div>
                </div>

                {state.error && <p className="mt-2 text-sm text-red-500">{state.error}</p>}

                {state.dryRunning && (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    Scanning… {state.scanned} objects scanned so far{state.hitsObjects > 0 ? `, ${state.hitsObjects} flagged so far` : ""}.
                  </p>
                )}

                {state.hasRun && (
                  <div className="mt-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Scanned <strong>{state.scanned}</strong>, <strong>{state.hitsObjects}</strong> flagged (
                      {state.hitsTotal} term hits total).
                    </p>

                    {state.initialRemaining > 0 && (
                      <div className="mt-2">
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {state.remaining} remaining
                          {state.purged > 0 ? ` · ${state.purged} purged` : ""}
                          {state.done ? " · done" : ""}
                        </p>
                      </div>
                    )}

                    {state.report.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => handleToggleReport(key)}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          {state.expanded ? "Hide" : "Show"} report ({state.report.length} rows{state.hitsObjects > state.report.length ? `, showing first ${state.report.length}` : ""})
                        </button>
                        {state.expanded && (
                          <div className="mt-2 max-h-80 overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                            <table className="w-full text-sm">
                              <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                <tr>
                                  <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-300">Label</th>
                                  <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-300">Terms</th>
                                </tr>
                              </thead>
                              <tbody>
                                {state.report.map((row) => (
                                  <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                                    <td className="py-2 px-3 align-top">
                                      {row.url ? (
                                        <a href={row.url} target="_blank" rel="noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                                          {row.label || row.url}
                                        </a>
                                      ) : (
                                        <span className="text-slate-700 dark:text-slate-300">{row.label}</span>
                                      )}
                                    </td>
                                    <td className="py-2 px-3">
                                      <div className="flex flex-wrap gap-1">
                                        {row.terms.map((t, i) => (
                                          <span
                                            key={i}
                                            className={`px-1.5 py-0.5 rounded text-xs font-medium ${ACTION_BADGE[t.action] || ACTION_BADGE.flagged}`}
                                            title={`${t.tier} / ${t.action}`}
                                          >
                                            {t.term}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {!state.hasRun && (
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Run a dry-run to enable Apply. Batch size: {batch}.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Card 3: Flagged pages */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">Flagged Pages</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Pages currently marked ads-unsafe. Mark safe to restore ads without waiting for a re-scan.
        </p>

        {flaggedLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
            ))}
          </div>
        ) : flagged.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4">No flagged pages.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                  <th className="py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Title</th>
                  <th className="py-2 px-3 font-medium text-slate-500 dark:text-slate-400">URL</th>
                  <th className="py-2 px-3 font-medium text-slate-500 dark:text-slate-400 w-32">Status</th>
                  <th className="py-2 px-3 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {flagged.map((post) => (
                  <tr key={post.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2 px-3 text-slate-800 dark:text-white">{post.title || `#${post.id}`}</td>
                    <td className="py-2 px-3">
                      <a href={post.url} target="_blank" rel="noreferrer" className="text-primary-600 dark:text-primary-400 hover:underline">
                        {post.url}
                      </a>
                    </td>
                    <td className="py-2 px-3">
                      {post.overridden ? (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Marked safe
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Unsafe
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => handleOverrideToggle(post)}
                        disabled={overrideLoading === post.id}
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
                      >
                        {post.overridden ? "Unmark" : "Mark safe"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card 4: Word tiers + log */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">Word Tiers</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Censor = masked automatically. Watch = allowed but logged. Off = ignored entirely.
        </p>

        <input
          type="text"
          value={termSearch}
          onChange={(e) => setTermSearch(e.target.value)}
          placeholder="Search terms..."
          className="w-full max-w-xs mb-4 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
        />

        <div className="max-h-72 overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-6">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
              <tr>
                <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-300">Term</th>
                <th className="text-left py-2 px-3 font-medium text-slate-600 dark:text-slate-300 w-40">Tier</th>
              </tr>
            </thead>
            <tbody>
              {filteredTerms.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-4 px-3 text-center text-slate-400">
                    No matching terms.
                  </td>
                </tr>
              ) : (
                filteredTerms.map(([term, tier]) => (
                  <tr key={term} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-1.5 px-3 font-mono text-slate-700 dark:text-slate-300">{term}</td>
                    <td className="py-1.5 px-3">
                      <select
                        value={tier}
                        onChange={(e) => handleTierChange(term, e.target.value)}
                        disabled={tierSaving === term}
                        className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm disabled:opacity-50"
                      >
                        {TIER_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Recent Log</h4>
        {logLoading ? (
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />
            ))}
          </div>
        ) : log.rows.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-2">No log entries.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                    <th className="py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Type</th>
                    <th className="py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Object</th>
                    <th className="py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Term</th>
                    <th className="py-2 px-3 font-medium text-slate-500 dark:text-slate-400">Action</th>
                    <th className="py-2 px-3 font-medium text-slate-500 dark:text-slate-400">When</th>
                  </tr>
                </thead>
                <tbody>
                  {log.rows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">{row.object_type}</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">#{row.object_id}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-700 dark:text-slate-300">{row.term}</td>
                      <td className="py-1.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${ACTION_BADGE[row.action] || ACTION_BADGE.flagged}`}>
                          {row.action}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-slate-500 dark:text-slate-400">{new Date(row.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {logTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Page {logPage} of {logTotalPages} ({log.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchLog(logPage - 1)}
                    disabled={logPage <= 1}
                    className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchLog(logPage + 1)}
                    disabled={logPage >= logTotalPages}
                    className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
