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
 * Ticks on the next wall-clock minute boundary, then every 60s after.
 */
export function useBbTime() {
  const [time, setTime] = useState(() => formatBbTime(new Date()));

  useEffect(() => {
    // Snap to "now" immediately on hydration so a stale SSR value gets overwritten.
    setTime(formatBbTime(new Date()));

    const tick = () => setTime(formatBbTime(new Date()));
    const now = new Date();
    const msToNextMinute = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

    let interval;
    const timeout = setTimeout(() => {
      tick();
      interval = setInterval(tick, 60000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);

  return time;
}
