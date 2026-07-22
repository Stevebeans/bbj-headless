"use client";

import { useEffect, useState } from "react";
import { getDmPrivacy, saveDmPrivacy, getBlocked, unblockUser } from "@/lib/api/dm";

const PRIVACY_OPTIONS = [
  { value: "everyone", label: "Everyone" },
  { value: "following", label: "Only people I follow" },
  { value: "nobody", label: "No one" },
];

/**
 * DmPrivacyPanel - "Who can message you" dropdown + blocked-members list.
 * Loads current privacy + block list on mount; saves privacy on change.
 * Rendered inside the Settings ProfileTab.
 */
export default function DmPrivacyPanel({ showToast }) {
  const [privacy, setPrivacy] = useState("everyone");
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [unblocking, setUnblocking] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [p, b] = await Promise.all([getDmPrivacy(), getBlocked()]);
        if (!active) return;
        if (p?.privacy) setPrivacy(p.privacy);
        setBlocked(b?.blocked || []);
      } catch {
        // Leave defaults; a failed load just shows "Everyone" + empty list.
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handlePrivacyChange = async (value) => {
    const previous = privacy;
    setPrivacy(value);
    setSaving(true);
    try {
      const res = await saveDmPrivacy(value);
      if (res?.privacy) setPrivacy(res.privacy);
      showToast?.("Message privacy updated");
    } catch (err) {
      setPrivacy(previous);
      showToast?.(err.message || "Could not update privacy", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (userId) => {
    setUnblocking(userId);
    try {
      await unblockUser(userId);
      setBlocked((prev) => prev.filter((u) => u.user_id !== userId));
      showToast?.("Member unblocked");
    } catch (err) {
      showToast?.(err.message || "Could not unblock member", "error");
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
        Private Messages
      </h3>

      {/* Who can message you */}
      <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div>
          <p className="font-medium text-gray-900 dark:text-white">Who can message you</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Choose who is allowed to start a private conversation with you.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {saving && (
            <svg className="animate-spin h-4 w-4 text-primary-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          <select
            value={privacy}
            onChange={(e) => handlePrivacyChange(e.target.value)}
            disabled={loading || saving}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none disabled:opacity-60"
          >
            {PRIVACY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Blocked members */}
      <div className="mt-4">
        <p className="font-medium text-gray-900 dark:text-white mb-2">Blocked Members</p>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            ))}
          </div>
        ) : blocked.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You haven&apos;t blocked anyone.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {blocked.map((u) => (
              <div
                key={u.user_id}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {u.display_name || u.username}
                  </p>
                  {u.username && (
                    <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                  )}
                </div>
                <button
                  onClick={() => handleUnblock(u.user_id)}
                  disabled={unblocking === u.user_id}
                  className="ml-3 px-3 py-1.5 text-sm font-medium text-primary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {unblocking === u.user_id ? "Unblocking..." : "Unblock"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
