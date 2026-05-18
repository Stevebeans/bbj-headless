"use client";

import { useEffect, useState } from "react";

/**
 * Client-only floating pill: visible only when the newest timeline item is
 * below the viewport. Clicking scrolls to it.
 *
 * Listens for `bbjd:live-update-appended` (fired by LiveUpdatePoller after
 * a new item is injected) to re-check visibility without waiting for scroll.
 *
 * Positioning: bottom-20 right-6 (sits above JumpToComments at bottom-6).
 */
export function JumpToLatestPill() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function check() {
      const list = document.querySelector("ol[data-sortable]");
      if (!list) {
        setVisible(false);
        return;
      }
      const items = list.querySelectorAll("li");
      if (items.length === 0) {
        setVisible(false);
        return;
      }
      const newest = items[items.length - 1];
      const rect = newest.getBoundingClientRect();
      const offscreen = rect.top > window.innerHeight - 80;
      setVisible(offscreen);
    }

    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    document.addEventListener("bbjd:live-update-appended", check);

    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      document.removeEventListener("bbjd:live-update-appended", check);
    };
  }, []);

  function scrollToLatest() {
    const list = document.querySelector("ol[data-sortable]");
    if (!list) return;
    const items = list.querySelectorAll("li");
    if (items.length === 0) return;
    items[items.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToLatest}
      className="fixed bottom-20 right-6 z-40 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg shadow-red-500/30 inline-flex items-center gap-1.5"
    >
      ↓ Latest update
    </button>
  );
}
