"use client";

import { useEffect, useState } from "react";

const FORMAT = {
  timeZone: "America/Los_Angeles",
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

function formatBbTime(date) {
  return date.toLocaleString("en-US", FORMAT);
}

/**
 * Live "BB Time" clock — Pacific time, auto-handles DST via the IANA zone.
 *
 * Without this, the timestamp was captured once at render and never updated,
 * so a user with the tab open drifted further behind real time the longer
 * they sat. SSR snapshot in the cached HTML compounded it (regeneration
 * moment could be hours stale before a visitor hydrates).
 *
 * State starts null (blank on the server / until mount) rather than seeded
 * with the current time: the ISR-cached HTML bakes an hours-old timestamp,
 * and if the initial client state already equals "now", the mount-time snap
 * is a no-op state update — React bails out of the re-render and the stale
 * suppressHydrationWarning'd server text stays in the DOM until the next
 * minute tick. null → time is always a real state change, so the DOM is
 * patched immediately on mount.
 *
 * Ticks on the next wall-clock minute boundary, then every 60s after.
 * Chrome freezes timers in long-backgrounded tabs, so the clock also
 * re-snaps whenever the tab becomes visible again.
 */
export function useBbTime() {
  const [time, setTime] = useState(null);

  useEffect(() => {
    const tick = () => setTime(formatBbTime(new Date()));
    tick();
    const now = new Date();
    const msToNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

    let interval;
    const timeout = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60000);
    }, msToNextMinute);

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return time;
}
