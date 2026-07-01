"use client";

import { useEffect, useRef, useState } from "react";
import { usePremium } from "@/hooks/usePremium";
import { fetchRecentFeedUpdates } from "@/lib/api/feedUpdates";

const POLL_INTERVAL_MS = 30_000;

/**
 * Premium live-feed polling + optimistic composer inserts.
 *
 * - Paid members: while the tab is visible and the toggle is on, polls the
 *   shared 20s-micro-cached /feed-updates/recent every 30s and calls
 *   `onNewUpdates(updates)` with the raw polled array. Callers merge with
 *   mergeUpdates() (dedupe by id / prepend / optional cap).
 * - EVERY tier: forwards `bbjd:feed-update-created` (dispatched by
 *   FloatingUpdater on a successful post) so posters see their update
 *   instantly without a refresh.
 * - Poll errors are swallowed; the next tick retries. The server-rendered
 *   list is never affected.
 *
 * `enabled` lets callers pause polling (e.g. hub view is filtered/sorted).
 * Returns { isPremium, live, setLive } for the LiveIndicatorToggle UI.
 */
export function useLiveFeedUpdates({ enabled = true, onNewUpdates }) {
  const { isPremium } = usePremium();
  const [live, setLive] = useState(true);
  const handlerRef = useRef(onNewUpdates);
  handlerRef.current = onNewUpdates;

  // Optimistic insert — all tiers, independent of the premium gate.
  useEffect(() => {
    const onCreated = (event) => {
      if (event.detail?.id) handlerRef.current?.([event.detail]);
    };
    window.addEventListener("bbjd:feed-update-created", onCreated);
    return () => window.removeEventListener("bbjd:feed-update-created", onCreated);
  }, []);

  // Premium polling — visible tab only, immediate catch-up tick on return.
  useEffect(() => {
    if (!isPremium || !live || !enabled) return undefined;

    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const updates = await fetchRecentFeedUpdates();
        if (updates.length > 0) handlerRef.current?.(updates);
      } catch (err) {
        console.warn("[useLiveFeedUpdates]", err.message);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") tick();
    };

    const timer = setInterval(tick, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isPremium, live, enabled]);

  return { isPremium, live, setLive };
}
