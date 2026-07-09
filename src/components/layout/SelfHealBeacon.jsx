"use client";

import { useEffect } from "react";

// Counterpart to SelfHealScript: marks the app as successfully booted so the
// inline watchdog stands down, re-arms the one-shot guard for future visits,
// and cleans the bbjheal cache-buster out of the address bar.
export function SelfHealBeacon() {
  useEffect(() => {
    window.__BBJ_HYDRATED = true;
    try {
      sessionStorage.removeItem("bbj_heal");
      if (window.location.search.includes("bbjheal=")) {
        const url = new URL(window.location.href);
        url.searchParams.delete("bbjheal");
        window.history.replaceState(
          null,
          "",
          url.pathname + url.search + url.hash
        );
      }
    } catch {
      // sessionStorage unavailable (private mode) — watchdog already no-ops there.
    }
  }, []);

  return null;
}
