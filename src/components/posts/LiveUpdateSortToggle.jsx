"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bbjd_live_sort";

/**
 * Client component: toggles the rendered order of the timeline.
 * Reads/writes the user's preference to localStorage. On mount, if the
 * preference is "newest", it reverses the static `<ol data-sortable>`
 * served by the server.
 */
export function LiveUpdateSortToggle() {
  const [sort, setSort] = useState("oldest");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "newest" || stored === "oldest") {
        setSort(stored);
        applySort(stored);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function toggle() {
    const next = sort === "oldest" ? "newest" : "oldest";
    setSort(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    applySort(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      aria-label="Toggle sort order"
    >
      {sort === "oldest" ? "↑ Oldest first" : "↓ Newest first"}
    </button>
  );
}

function applySort(sort) {
  if (typeof document === "undefined") return;
  const list = document.querySelector("ol[data-sortable]");
  if (!list) return;
  const items = Array.from(list.children).filter((c) => c.tagName === "LI");
  const inAscOrder = items.length < 2 ||
    (items[0].dataset.ts || "") <= (items[items.length - 1].dataset.ts || "");
  const wantsAsc = sort === "oldest";
  if (inAscOrder !== wantsAsc) {
    items.reverse().forEach((node) => list.appendChild(node));
  }
}
