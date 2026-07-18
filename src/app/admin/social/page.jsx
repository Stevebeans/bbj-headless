"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/admin";
import { usePermissions } from "@/hooks/usePermissions";
import TopPostsBoard from "@/components/admin/social/TopPostsBoard";

const MODEL_OPTIONS = [
  { id: "claude-sonnet-5", label: "Sonnet 5 (default)" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5 (cheapest)" },
  { id: "claude-opus-4-8", label: "Opus 4.8 (best)" },
];

const INTERVAL_OPTIONS = [5, 10, 15, 30];
const BEANBOT_INTERVALS = [30, 45, 60];
const DRAFT_WINDOWS = [
  { id: "1h", label: "Last 1h" },
  { id: "today", label: "Today" },
  { id: "12h", label: "Last 12h" },
  { id: "24h", label: "Last 24h" },
];
const HISTORY_KINDS = [
  { id: "digest", label: "Digest" },
  { id: "facebook", label: "Facebook" },
  { id: "blog", label: "Blog" },
];
const PER_PAGE = 50;

// Bluesky post text arrives emoji-entity-encoded (utf8mb3 storage). Decode for display.
function decodeEntities(str) {
  if (!str) return "";
  if (typeof document === "undefined") return str;
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.value;
}

// Stored timestamps are UTC 'Y-m-d H:i:s' with no zone marker. Render site-local.
function fmtTime(utc) {
  if (!utc) return "";
  const iso = utc.includes("T") ? utc : utc.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return utc;
  return d.toLocaleString();
}

// Pill switch that states the current fact and flips it. Replaces the header
// checkboxes whose "X disabled" label read like an instruction ("check to
// disable") instead of a status.
function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 cursor-pointer select-none"
    >
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary-500" : "bg-slate-300 dark:bg-slate-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </span>
      <span
        className={`text-xs font-bold uppercase tracking-wide ${
          checked ? "text-primary-600 dark:text-primary-400" : "text-slate-400"
        }`}
      >
        {checked ? "On" : "Off"}
      </span>
    </button>
  );
}

function truncate(str, max = 200) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// Render **bold** spans as <strong> while keeping everything as React text
// nodes (no dangerouslySetInnerHTML). Splitting on a single capture group
// yields alternating plain/bold segments, so odd indices are the bold ones.
function renderBold(text) {
  if (!text) return text;
  return String(text)
    .split(/\*\*([^*]+)\*\*/g)
    .map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

// Split a summary's markdown into its three "## " sections, keyed by a match hint.
function splitSummary(content) {
  const out = { timeline: null, missed: null, facebook: null, other: [] };
  if (!content) return out;
  const parts = content.split(/^##\s+/m);
  for (const part of parts) {
    if (!part.trim()) continue;
    const nl = part.indexOf("\n");
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    // Drop the model's "- " list dashes — the digest is copy-paste material
    // and the leading dash reads badly stacked against "~" time estimates.
    const body = (nl === -1 ? "" : part.slice(nl + 1)).trim().replace(/^-\s+/gm, "");
    const h = heading.toLowerCase();
    const section = { heading, body };
    if (h.includes("confirmed") || h.includes("timeline")) out.timeline = section;
    else if (h.includes("missed")) out.missed = section;
    else if (h.includes("facebook") || h.includes("draft")) out.facebook = section;
    else out.other.push(section);
  }
  return out;
}

// Strip the parenthesized source attributions — "(@handle)", "(@a, @b — echoed
// by 100+ tag posts)" — for clean copy-paste. Only parentheticals containing an
// @ are removed, so normal prose parentheses survive.
function stripSources(text) {
  return String(text || "").replace(/\s*\([^()]*@[^()]*\)/g, "");
}

export default function AdminSocialPage() {
  const { hasPermission, loading: permLoading } = usePermissions();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message }

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [handleInput, setHandleInput] = useState("");

  // Collector
  const [posts, setPosts] = useState([]);
  const [postsTotal, setPostsTotal] = useState(0);
  const [postsPage, setPostsPage] = useState(1);
  const [postsLoading, setPostsLoading] = useState(false);
  const [sourceFilter, setSourceFilter] = useState(""); // '' | 'trusted' | 'tag'
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState(null);
  const [trustingUri, setTrustingUri] = useState(null);

  // Digest
  const [latestSummary, setLatestSummary] = useState(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState(null);
  const [hideSources, setHideSources] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Bean Bot
  const [beanbot, setBeanbot] = useState(null);
  const [beanbotMissing, setBeanbotMissing] = useState(false);
  const [beanbotSaving, setBeanbotSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview] = useState(null);

  // Drafts
  const [draftWindow, setDraftWindow] = useState("today");
  const [draftBusy, setDraftBusy] = useState(null); // 'facebook' | 'blog' | 'batch'
  const [batchPosts, setBatchPosts] = useState([]);
  const [batchCopiedIdx, setBatchCopiedIdx] = useState(null);
  const [draft, setDraft] = useState(null);
  const [draftError, setDraftError] = useState(null);
  const [draftCopied, setDraftCopied] = useState(false);

  // Summary history (Digest / Facebook / Blog), lives in the Drafts card
  const [historyKind, setHistoryKind] = useState("digest");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ---- Loaders --------------------------------------------------------------
  const loadConfig = useCallback(async () => {
    const data = await adminFetch("/social/config");
    setSettings(data.settings);
    return data.settings;
  }, []);

  const loadPosts = useCallback(async (page = 1, source = sourceFilter, search = searchTerm) => {
    setPostsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) });
      if (source) params.set("source", source);
      if (search) params.set("search", search);
      const data = await adminFetch(`/social/posts?${params.toString()}`);
      setPosts(data.items || []);
      setPostsTotal(data.total || 0);
      setPostsPage(page);
    } catch (err) {
      showToast("error", err.message || "Failed to load posts.");
    } finally {
      setPostsLoading(false);
    }
  }, [sourceFilter, searchTerm, showToast]);

  // Latest digest panel: only digest rows count, else a facebook/blog draft
  // (also stored in /social/summaries) would render as the "latest digest".
  const loadSummaries = useCallback(async () => {
    const data = await adminFetch("/social/summaries?kind=digest");
    const list = Array.isArray(data) ? data : (data.summaries || data.items || []);
    if (list.length > 0) setLatestSummary(list[0]);
    return list;
  }, []);

  // Bean Bot settings. Absent on older plugins, so failures degrade gracefully
  // (card shows a "plugin update required" note) instead of blocking the page.
  const loadBeanbot = useCallback(async () => {
    try {
      const data = await adminFetch("/social/beanbot");
      setBeanbot(data.settings);
      setBeanbotMissing(false);
    } catch {
      setBeanbotMissing(true);
    }
  }, []);

  const loadHistory = useCallback(async (kind) => {
    setHistoryLoading(true);
    try {
      const data = await adminFetch(`/social/summaries?kind=${encodeURIComponent(kind)}`);
      const list = Array.isArray(data) ? data : (data.summaries || data.items || []);
      setHistory(list);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permLoading) return;
    if (!hasPermission("social_monitor")) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        await Promise.all([
          loadConfig(),
          loadPosts(1),
          loadSummaries(),
          loadBeanbot(),
          loadHistory("digest"),
        ]);
      } catch (err) {
        setLoadError(err.message || "Failed to load Social Intel.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permLoading]);

  // Re-fetch posts when filter changes (search is submit-driven).
  useEffect(() => {
    if (loading) return;
    loadPosts(1, sourceFilter, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceFilter, searchTerm]);

  // Re-fetch summary history when the kind chip changes (initial load is in mount effect).
  useEffect(() => {
    if (loading) return;
    setExpandedId(null);
    loadHistory(historyKind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyKind]);

  // ---- Settings mutations ---------------------------------------------------
  const patchSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const addHandle = () => {
    const raw = handleInput.trim().replace(/^@/, "");
    if (!raw) return;
    setSettings((prev) => {
      const handles = prev.handles || [];
      if (handles.some((h) => h.toLowerCase() === raw.toLowerCase())) return prev;
      return { ...prev, handles: [...handles, raw] };
    });
    setHandleInput("");
  };

  const removeHandle = (handle) => {
    setSettings((prev) => ({
      ...prev,
      handles: (prev.handles || []).filter((h) => h !== handle),
    }));
  };

  const buildConfigPayload = (base) => {
    const payload = {
      enabled: !!base.enabled,
      tag: base.tag || "",
      handles: base.handles || [],
      poll_minutes: Number(base.poll_minutes) || 10,
      model: base.model || "claude-sonnet-5",
    };
    // Only send the key when a new one is typed; empty leaves the stored key unchanged.
    if (apiKeyInput.trim()) payload.anthropic_api_key = apiKeyInput.trim();
    return payload;
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const data = await adminFetch("/social/config", {
        method: "POST",
        body: JSON.stringify(buildConfigPayload(settings)),
      });
      setSettings(data.settings);
      setApiKeyInput("");
      showToast("success", "Settings saved.");
    } catch (err) {
      showToast("error", err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Collector actions ----------------------------------------------------
  const handlePollNow = async () => {
    setPolling(true);
    setPollResult(null);
    try {
      const data = await adminFetch("/social/poll", { method: "POST" });
      setPollResult(data);
      await loadPosts(1, sourceFilter, searchTerm);
    } catch (err) {
      showToast("error", err.message || "Poll failed.");
    } finally {
      setPolling(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
  };

  // One-click promote: append a tag author to trusted handles and persist.
  const handleTrust = async (handle, uri) => {
    if (!settings || !handle) return;
    setTrustingUri(uri);
    const raw = handle.replace(/^@/, "");
    const nextHandles = (settings.handles || []).some((h) => h.toLowerCase() === raw.toLowerCase())
      ? settings.handles
      : [...(settings.handles || []), raw];
    try {
      const data = await adminFetch("/social/config", {
        method: "POST",
        body: JSON.stringify(buildConfigPayload({ ...settings, handles: nextHandles })),
      });
      setSettings(data.settings);
      setApiKeyInput("");
      showToast("success", `Now trusting @${raw}.`);
    } catch (err) {
      showToast("error", err.message || "Could not trust handle.");
    } finally {
      setTrustingUri(null);
    }
  };

  const isTrusted = (handle) =>
    !!handle &&
    (settings?.handles || []).some((h) => h.toLowerCase() === handle.replace(/^@/, "").toLowerCase());

  // ---- Digest actions -------------------------------------------------------
  const handleSummarize = async () => {
    setSummarizing(true);
    setSummarizeError(null);
    try {
      const data = await adminFetch("/social/summarize", { method: "POST" });
      if (data && data.success && data.summary) {
        setLatestSummary(data.summary);
        showToast("success", "Digest generated.");
      } else {
        setSummarizeError((data && data.message) || "Summarize returned no summary.");
      }
    } catch (err) {
      // adminFetch throws the API message verbatim for non-2xx responses.
      setSummarizeError(err.message || "Summarize failed.");
    } finally {
      setSummarizing(false);
    }
  };

  const copyToClipboard = async (text, setCopiedState) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch {
      showToast("error", "Copy failed. Select the text manually.");
    }
  };

  // ---- Bean Bot actions -----------------------------------------------------
  const patchBeanbot = (key, value) => {
    setBeanbot((prev) => ({ ...prev, [key]: value }));
  };

  const handleBeanbotSave = async () => {
    if (!beanbot) return;
    setBeanbotSaving(true);
    try {
      const data = await adminFetch("/social/beanbot", {
        method: "POST",
        body: JSON.stringify({
          enabled: !!beanbot.enabled,
          interval_minutes: Number(beanbot.interval_minutes) || 30,
          max_per_day: Math.min(96, Math.max(1, Number(beanbot.max_per_day) || 1)),
          bluesky_enabled: !!beanbot.bluesky_enabled,
        }),
      });
      setBeanbot(data.settings);
      showToast("success", "Bean Bot settings saved.");
    } catch (err) {
      showToast("error", err.message || "Save failed.");
    } finally {
      setBeanbotSaving(false);
    }
  };

  // Dry run: the server never publishes here, it only reports what it would do.
  const handlePreview = async () => {
    setPreviewing(true);
    setPreview(null);
    try {
      const data = await adminFetch("/social/beanbot/preview", { method: "POST" });
      setPreview(data);
    } catch (err) {
      setPreview({ action: "error", message: err.message || "Preview failed." });
    } finally {
      setPreviewing(false);
    }
  };

  // ---- Drafts actions -------------------------------------------------------
  const handleDraft = async (kind) => {
    setDraftBusy(kind);
    setDraftError(null);
    try {
      const data = await adminFetch("/social/draft", {
        method: "POST",
        body: JSON.stringify({ kind, window: draftWindow }),
      });
      if (data && data.success && data.draft) {
        setDraft(data.draft);
        // Surface the new item in history for its kind.
        if (kind === historyKind) loadHistory(kind);
        else setHistoryKind(kind);
      } else {
        setDraftError((data && data.message) || "Draft returned no content.");
      }
    } catch (err) {
      // adminFetch throws the API message verbatim for non-2xx responses.
      setDraftError(err.message || "Draft generation failed.");
    } finally {
      setDraftBusy(null);
    }
  };

  // Batch mode: 1-5 queueable FB posts covering everything since the last batch.
  const handleDraftBatch = async () => {
    setDraftBusy("batch");
    setDraftError(null);
    try {
      const data = await adminFetch("/social/draft-batch", { method: "POST" });
      if (data && data.success && Array.isArray(data.posts) && data.posts.length) {
        setBatchPosts(data.posts);
        setDraft(null); // batch cards replace the single-draft card
        if (historyKind === "facebook") loadHistory("facebook");
        else setHistoryKind("facebook");
      } else {
        setDraftError((data && data.message) || "Batch returned no posts.");
      }
    } catch (err) {
      setDraftError(err.message || "Batch generation failed.");
    } finally {
      setDraftBusy(null);
    }
  };


  // ---- Render guards --------------------------------------------------------
  if (permLoading || loading) {
    return (
      <div className="animate-pulse space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!hasPermission("social_monitor") || loadError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="w-14 h-14 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm">
          {loadError || "You do not have permission to access Social Intel."}
        </p>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(postsTotal / PER_PAGE));
  const sections = splitSummary(latestSummary?.content);

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm border ${
            toast.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white">Social Intel</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">Bluesky feed monitor</span>
      </div>

      {/* ============================= SETTINGS ============================= */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-osw font-bold text-slate-800 dark:text-white">Settings</h3>
          <ToggleSwitch
            checked={!!settings?.enabled}
            onChange={(v) => patchSetting("enabled", v)}
            label="Monitoring"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Tag */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search tag
            </label>
            <input
              value={settings?.tag || ""}
              onChange={(e) => patchSetting("tag", e.target.value)}
              placeholder="#BB28"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">Hashtag polled from Bluesky search.</p>
          </div>

          {/* Interval */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Poll interval
            </label>
            <select
              value={settings?.poll_minutes ?? 10}
              onChange={(e) => patchSetting("poll_minutes", parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {INTERVAL_OPTIONS.map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Summary model
            </label>
            <select
              value={settings?.model || "claude-sonnet-5"}
              onChange={(e) => patchSetting("model", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* API key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Anthropic API key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={settings?.anthropic_api_key_set ? "configured (leave blank to keep)" : "sk-ant-..."}
              autoComplete="new-password"
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">
              {settings?.anthropic_api_key_set
                ? "A key is stored. Enter a new value only to replace it."
                : "Required before generating digests."}
            </p>
          </div>
        </div>

        {/* Trusted handles chip editor */}
        <div className="mt-5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Trusted handles
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(settings?.handles || []).length === 0 && (
              <span className="text-xs text-slate-400">No trusted handles yet.</span>
            )}
            {(settings?.handles || []).map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
              >
                @{h}
                <button
                  type="button"
                  onClick={() => removeHandle(h)}
                  className="hover:text-blue-900 dark:hover:text-blue-100"
                  aria-label={`Remove ${h}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
          <input
            value={handleInput}
            onChange={(e) => setHandleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addHandle();
              }
            }}
            placeholder="handle.bsky.social then Enter"
            className="w-full max-w-md px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </section>

      {/* ============================= COLLECTOR ============================= */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-base font-osw font-bold text-slate-800 dark:text-white">Collector</h3>
          <button
            onClick={handlePollNow}
            disabled={polling}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {polling && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {polling ? "Polling..." : "Poll now"}
          </button>
        </div>

        {pollResult && (
          <div className="mb-4 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm">
            {pollResult.skipped ? (
              <p className="text-slate-700 dark:text-slate-300">
                Polling is disabled. Enable monitoring in Settings and save first.
              </p>
            ) : (
              <p className="text-slate-700 dark:text-slate-300">
                Added <strong>{pollResult.trusted ?? 0}</strong> trusted and{" "}
                <strong>{pollResult.tag ?? 0}</strong> tag posts.
              </p>
            )}
            {Array.isArray(pollResult.errors) && pollResult.errors.length > 0 && (
              <ul className="mt-2 list-disc list-inside text-red-600 dark:text-red-400">
                {pollResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex gap-1">
            {[
              { id: "", label: "All" },
              { id: "trusted", label: "Trusted" },
              { id: "tag", label: "Tag" },
            ].map((chip) => (
              <button
                key={chip.id || "all"}
                onClick={() => setSourceFilter(chip.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  sourceFilter === chip.id
                    ? "bg-primary-500 border-primary-500 text-white"
                    : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
          <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[180px] flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search post text..."
              className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              Search
            </button>
          </form>
        </div>

        {/* Posts table */}
        {postsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm py-8 text-center">No posts collected yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                    <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">Time</th>
                    <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Source</th>
                    <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Handle</th>
                    <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400">Text</th>
                    <th className="py-2 px-2 font-medium text-slate-500 dark:text-slate-400 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => {
                    const decoded = decodeEntities(p.text);
                    return (
                      <tr key={p.id} className="border-b border-slate-100 dark:border-slate-800 align-top hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-2 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {fmtTime(p.posted_at)}
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
                        <td className="py-2 px-2 whitespace-nowrap">
                          <a
                            href={`https://bsky.app/profile/${p.handle}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-500 hover:text-primary-600 font-medium"
                          >
                            @{p.handle}
                          </a>
                          {p.display_name && (
                            <div className="text-xs text-slate-400">{decodeEntities(p.display_name)}</div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-slate-700 dark:text-slate-300 max-w-md">
                          <span title={decoded}>{truncate(decoded, 200)}</span>
                        </td>
                        <td className="py-2 px-2 text-right whitespace-nowrap">
                          {p.source === "tag" && (
                            isTrusted(p.handle) ? (
                              <span className="text-xs text-slate-400">Trusted</span>
                            ) : (
                              <button
                                onClick={() => handleTrust(p.handle, p.uri)}
                                disabled={trustingUri === p.uri}
                                className="px-2 py-1 text-xs font-medium rounded-lg border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50"
                              >
                                {trustingUri === p.uri ? "..." : "Trust"}
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Page {postsPage} of {totalPages} ({postsTotal} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadPosts(postsPage - 1)}
                    disabled={postsPage <= 1}
                    className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => loadPosts(postsPage + 1)}
                    disabled={postsPage >= totalPages}
                    className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <TopPostsBoard />

      {/* ============================= DIGEST ============================= */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-base font-osw font-bold text-slate-800 dark:text-white">Digest</h3>
          <button
            onClick={handleSummarize}
            disabled={summarizing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {summarizing && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {summarizing ? "Summarizing..." : "Summarize since last run"}
          </button>
        </div>

        {summarizeError && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {summarizeError}
          </div>
        )}

        {latestSummary ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {fmtTime(latestSummary.created_at)} &middot; {latestSummary.model} &middot;{" "}
              {latestSummary.post_count} posts
              {typeof latestSummary.trusted_count === "number" && ` (${latestSummary.trusted_count} trusted)`}
              {latestSummary.window_from && latestSummary.window_to && (
                <> &middot; {fmtTime(latestSummary.window_from)} to {fmtTime(latestSummary.window_to)}</>
              )}
            </p>

            <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideSources}
                onChange={(e) => setHideSources(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500"
              />
              Hide sources (clean copy/paste)
            </label>

            {sections.timeline && (
              <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">{sections.timeline.heading}</h4>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{renderBold(hideSources ? stripSources(sections.timeline.body) : sections.timeline.body)}</div>
              </div>
            )}

            {sections.missed && (
              <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">{sections.missed.heading}</h4>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{renderBold(hideSources ? stripSources(sections.missed.body) : sections.missed.body)}</div>
              </div>
            )}

            {sections.facebook && (
              <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">{sections.facebook.heading}</h4>
                  <button
                    onClick={() => copyToClipboard(sections.facebook.body, setCopied)}
                    className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{renderBold(sections.facebook.body)}</div>
              </div>
            )}

            {sections.other.map((s, i) => (
              <div key={i} className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">{s.heading}</h4>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{renderBold(hideSources ? stripSources(s.body) : s.body)}</div>
              </div>
            ))}

            {/* Fallback: no recognizable sections, render raw content. */}
            {!sections.timeline && !sections.missed && !sections.facebook && sections.other.length === 0 && (
              <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{renderBold(latestSummary.content)}</div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-sm py-4">No digests yet.</p>
        )}
      </section>

      {/* ============================= BEAN BOT ============================= */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-base font-osw font-bold text-slate-800 dark:text-white">Bean Bot</h3>
          {beanbot && (
            <ToggleSwitch
              checked={!!beanbot.enabled}
              onChange={(v) => patchBeanbot("enabled", v)}
              label="Auto-posting"
            />
          )}
        </div>

        {beanbotMissing ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm py-4">
            Bean Bot is unavailable. A plugin update is required before automated posting can be configured.
          </p>
        ) : !beanbot ? (
          <p className="text-slate-500 dark:text-slate-400 text-sm py-4">Loading Bean Bot...</p>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              {/* Interval */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Post interval
                </label>
                <select
                  value={beanbot.interval_minutes ?? 30}
                  onChange={(e) => patchBeanbot("interval_minutes", parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {BEANBOT_INTERVALS.map((m) => (
                    <option key={m} value={m}>{m} minutes</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">How often the bot may post when enabled.</p>
              </div>

              {/* Max per day */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Max posts per day
                </label>
                <input
                  type="number"
                  min={1}
                  max={96}
                  value={beanbot.max_per_day ?? 1}
                  onChange={(e) => patchBeanbot("max_per_day", parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Between 1 and 96.</p>
              </div>
            </div>

            {/* Bluesky cross-post */}
            <div className="mt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!beanbot.bluesky_enabled}
                  onChange={(e) => patchBeanbot("bluesky_enabled", e.target.checked)}
                  className="w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Cross-post to Bluesky
                </span>
              </label>
            </div>

            {/* Status line */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
              Last run {beanbot.last_run ? fmtTime(beanbot.last_run) : "never"} &middot;{" "}
              {beanbot.posts_today ?? 0} posted today &middot; cursor #{beanbot.cursor_post_id ?? 0}
            </p>

            {beanbot.last_error && (
              <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {beanbot.last_error}
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleBeanbotSave}
                disabled={beanbotSaving}
                className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {beanbotSaving ? "Saving..." : "Save Settings"}
              </button>
              <button
                onClick={handlePreview}
                disabled={previewing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {previewing && (
                  <span className="w-4 h-4 border-2 border-slate-300 border-t-primary-500 rounded-full animate-spin" />
                )}
                {previewing ? "Checking..." : "Preview next post"}
              </button>
            </div>

            {/* Preview result. Nothing is published here. */}
            {preview && (
              preview.action === "posted" ? (
                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                      Preview only
                    </span>
                    {preview.bluesky && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        Would cross-post to Bluesky
                      </span>
                    )}
                    {preview.window && typeof preview.window.count === "number" && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {preview.window.count} new trusted reports
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
                    <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {decodeEntities(preview.text)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Nothing was published. This is what Bean Bot would post next.
                  </p>
                </div>
              ) : (
                <div className="mt-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 mr-2">
                    {preview.action || "skipped"}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {preview.message || "Nothing to post right now."}
                  </span>
                </div>
              )
            )}
          </>
        )}
      </section>

      {/* ============================= DRAFTS ============================= */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-base font-osw font-bold text-slate-800 dark:text-white">Drafts</h3>
        </div>

        {/* Window chips */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">Window</span>
          <div className="flex gap-1">
            {DRAFT_WINDOWS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setDraftWindow(chip.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  draftWindow === chip.id
                    ? "bg-primary-500 border-primary-500 text-white"
                    : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleDraft("facebook")}
            disabled={!!draftBusy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {draftBusy === "facebook" && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {draftBusy === "facebook" ? "Generating..." : "Facebook post"}
          </button>
          <button
            onClick={() => handleDraft("blog")}
            disabled={!!draftBusy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {draftBusy === "blog" && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {draftBusy === "blog" ? "Generating..." : "Blog recap"}
          </button>
          <button
            onClick={handleDraftBatch}
            disabled={!!draftBusy}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-secondary-500 hover:bg-secondary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Splits everything since the last batch into 1-5 queueable FB posts"
          >
            {draftBusy === "batch" && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {draftBusy === "batch" ? "Generating batch..." : "FB batch since last"}
          </button>
        </div>

        {draftError && (
          <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {draftError}
          </div>
        )}

        {batchPosts.length > 0 && (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {batchPosts.length} post{batchPosts.length === 1 ? "" : "s"} — copy each into
              Facebook&apos;s scheduler, spaced out however you like.
            </p>
            {batchPosts.map((post, idx) => (
              <div
                key={post.id ?? idx}
                className="rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Post {idx + 1}
                    {post.covers && <> &middot; covers {post.covers} PT</>}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(decodeEntities(post.content), (on) =>
                        setBatchCopiedIdx(on ? idx : null)
                      )
                    }
                    className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    {batchCopiedIdx === idx ? "Copied" : "Copy"}
                  </button>
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {decodeEntities(post.content)}
                </div>
              </div>
            ))}
          </div>
        )}

        {draft && (
          <div className="mt-5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {draft.kind} &middot; {fmtTime(draft.window_from)} &rarr; {fmtTime(draft.window_to)} &middot;{" "}
                {draft.post_count} posts
              </span>
              <button
                onClick={() => copyToClipboard(decodeEntities(draft.content), setDraftCopied)}
                className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {draftCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {renderBold(decodeEntities(draft.content))}
            </div>
          </div>
        )}

        {/* History (Digest / Facebook / Blog) */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400">History</h4>
            <div className="flex gap-1">
              {HISTORY_KINDS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setHistoryKind(chip.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    historyKind === chip.id
                      ? "bg-primary-500 border-primary-500 text-white"
                      : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {historyLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm py-4">No {historyKind} history yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {history.map((s) => {
                const open = expandedId === s.id;
                return (
                  <li key={s.id} className="bg-white dark:bg-slate-800">
                    <button
                      onClick={() => setExpandedId(open ? null : s.id)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {fmtTime(s.created_at)}
                        <span className="text-slate-400"> &middot; {s.post_count} posts</span>
                        {s.window_from && s.window_to && (
                          <span className="text-slate-400"> &middot; {fmtTime(s.window_from)} to {fmtTime(s.window_to)}</span>
                        )}
                      </span>
                      <svg
                        className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {open && (
                      <div className="px-4 pb-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap border-t border-slate-100 dark:border-slate-700 pt-3">
                        {renderBold(s.content)}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
