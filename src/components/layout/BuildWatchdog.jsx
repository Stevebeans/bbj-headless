"use client";

import { useEffect } from "react";
import { findOwnBuildAsset, isNewerBuildLive, installStaleHandlers } from "@/lib/buildWatchdog";

const PROBE_INTERVAL_MS = 10 * 60 * 1000;

// Keeps long-lived tabs from dying on their first click after a deploy.
// See lib/buildWatchdog.js for the mechanism. Probes only while the tab is
// visible, once more when it becomes visible again, and stops for good the
// moment a newer build is known to be live (handlers take over from there).
export function BuildWatchdog() {
  useEffect(() => {
    const asset = findOwnBuildAsset(document);
    if (!asset) return undefined;

    let stale = false;
    let uninstall = null;
    let timer = null;

    const probe = async () => {
      if (stale || document.visibilityState !== "visible") return;
      if (!(await isNewerBuildLive(window.fetch.bind(window), asset.dpl))) return;
      stale = true;
      clearInterval(timer);
      uninstall = installStaleHandlers({ doc: document, location: window.location });
    };

    timer = setInterval(probe, PROBE_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") probe();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      uninstall?.();
    };
  }, []);

  return null;
}
