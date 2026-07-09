"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAds } from "@/context/AdContext";
import { fetchUpdatesSince } from "@/lib/api/liveThread";

const POLL_INTERVAL_MS = 30_000;

/**
 * Client-only: when the user is a supporter AND the thread is live, polls for
 * new updates and appends them into the existing timeline `<ol data-sortable>`.
 *
 * Free users render this component too, but it stays inert (no-op) so we don't
 * need conditional rendering up the tree.
 *
 * Token comes from `user.token` (set by AuthContext on login/hydration).
 */
export function LiveUpdatePoller({ postId, initialLastSeen }) {
  const { user, isAuthenticated } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const lastSeen = useRef(initialLastSeen || 0);
  const intervalRef = useRef(null);

  // Supporter status from AdContext — baseline roles + the admin-configured list
  const { isSupporter: supporterRole } = useAds();
  const isSupporter = isAuthenticated && supporterRole;

  // Token lives on user.token (set by AuthContext setUserAndCache)
  const token = user?.token || null;

  useEffect(() => {
    if (!isSupporter || !enabled) return undefined;

    const tick = async () => {
      try {
        const data = await fetchUpdatesSince(postId, lastSeen.current, token);
        if (data.thread_state === "closed") {
          // Thread closed — stop polling.
          setEnabled(false);
          return;
        }
        if (Array.isArray(data.updates) && data.updates.length > 0) {
          appendUpdatesToDom(data.updates);
          lastSeen.current = data.updates[data.updates.length - 1].time;
        }
      } catch (err) {
        // Swallow — next tick will try again.
        console.warn("[LiveUpdatePoller]", err.message);
      }
    };

    intervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [postId, token, isSupporter, enabled]);

  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-xs">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <span className="text-gray-500 dark:text-gray-400">
          {isSupporter ? "Auto-updates" : "Auto-updates ⭐ premium"}
        </span>
        <input
          type="checkbox"
          checked={isSupporter && enabled}
          disabled={!isSupporter}
          onChange={(e) => setEnabled(e.target.checked)}
          className="accent-red-500"
        />
      </label>
      {!isSupporter && (
        <a href="/become-supporter" className="text-primary-500 dark:text-primary-300 underline">
          Upgrade
        </a>
      )}
    </div>
  );
}

function appendUpdatesToDom(updates) {
  const list = document.querySelector("ol[data-sortable]");
  if (!list) return;
  for (const u of updates) {
    if (list.querySelector(`li[data-update-id="${u.id}"]`)) continue; // dedupe
    const node = renderUpdateLi(u);
    list.appendChild(node);
  }
  // Trigger a custom event for any onlookers (e.g. jump-to-latest pill)
  list.dispatchEvent(new CustomEvent("bbjd:live-update-appended", { bubbles: true }));
}

function renderUpdateLi(u) {
  const li = document.createElement("li");
  li.dataset.ts = String(u.time);
  li.dataset.updateId = String(u.id);
  li.className = "relative pb-5 list-none";
  li.innerHTML = `
    <span class="absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 bg-red-500 ring-2 ring-red-500/40 animate-pulse"></span>
    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
      ${u.breaking ? '<span class="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Breaking</span>' : ""}
      <time datetime="${u.time_iso || ""}">${formatTime(u.time)}</time>
    </div>
    ${u.title ? `<div class="font-bold text-primary-500 dark:text-primary-300 mb-1">${escapeHtml(u.title)}</div>` : ""}
    ${u.content ? `<div class="text-sm prose prose-sm dark:prose-invert max-w-none bg-red-50 dark:bg-red-950/30 border-l-2 border-red-500 pl-3 py-1 rounded-r">${u.content}</div>` : ""}
  `;
  return li;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function formatTime(unixSeconds) {
  if (!unixSeconds) return "";
  const dt = new Date(unixSeconds * 1000);
  return dt.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
}
