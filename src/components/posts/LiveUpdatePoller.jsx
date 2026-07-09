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
          lastSeen.current = updateTs(data.updates[data.updates.length - 1]);
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

// The API's `time` field is a display string ("3:42 pm") — the unix timestamp
// lives in `time_unix` (newer plugin) or is derivable from the ISO `date`.
function updateTs(u) {
  if (u.time_unix) return u.time_unix;
  const parsed = Date.parse(u.date);
  return Number.isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
}

// Mirrors the server-rendered card in LiveUpdateTimeline (homepage FeedUpdateCard
// layout: time rail + dot + card). Freshly-polled updates are always "fresh" → red time.
function renderUpdateLi(u) {
  const li = document.createElement("li");
  li.dataset.ts = String(updateTs(u));
  li.dataset.updateId = String(u.id);
  li.className = "list-none";
  const time = formatTime(updateTs(u));
  const body = u.content || u.raw_content || "";
  const thumb = u.thumbnail
    ? `<div class="mb-3 w-[90%] md:max-w-[75%] mx-auto"><img src="${escapeHtml(u.thumbnail)}" alt="${escapeHtml(u.title || "Big Brother feed update")}" class="rounded-lg w-full h-auto" loading="lazy" /></div>`
    : "";
  li.innerHTML = `
    <article id="${escapeHtml(u.slug || "")}" class="group flex gap-4 py-4">
      <div class="hidden sm:block w-20 shrink-0 text-right">
        <time datetime="${u.date || ""}" class="block font-osw text-sm text-red-500">${time}</time>
        <div class="text-[11px] text-red-500" data-nosnippet>just now</div>
      </div>
      <div class="relative flex-shrink-0">
        <span class="block w-3 h-3 rounded-full mt-1.5 bg-red-500 ring-2 ring-red-500/40 animate-pulse" aria-hidden="true"></span>
      </div>
      <div class="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div class="sm:hidden text-xs mb-1"><time datetime="${u.date || ""}" class="text-red-500">${time}</time></div>
        ${u.breaking ? '<span class="inline-block bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide mb-2">Breaking</span>' : ""}
        ${u.title ? `<h3 class="font-display text-lg md:text-xl leading-snug mb-2 text-primary-500 dark:text-secondary-500"><a href="/live-feed-updates/${escapeHtml(u.slug || "")}" class="hover:text-primary-600 dark:hover:text-secondary-400">${escapeHtml(u.title)}</a></h3>` : ""}
        ${body ? `<div class="text-sm text-gray-700 dark:text-gray-300 mb-3 feed-content">${body}</div>` : ""}
        ${thumb}
      </div>
    </article>
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

// BB time (PT), same format as the homepage feed cards
function formatTime(unixSeconds) {
  if (!unixSeconds) return "";
  const dt = new Date(unixSeconds * 1000);
  return dt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Los_Angeles",
  });
}
