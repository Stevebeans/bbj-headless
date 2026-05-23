"use client";

import { useState, useEffect } from "react";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "winners", label: "Winners" },
  { id: "cast", label: "Cast" },
  { id: "weeks", label: "Weeks" },
  { id: "eviction-order", label: "Eviction Order" },
  { id: "articles", label: "Articles" },
  { id: "feed-updates", label: "Feed Updates" },
  { id: "faq", label: "FAQ" },
];

/**
 * Sticky horizontal nav with scroll-spy — highlights active section
 */
export function SeasonJumpNav({ articleCount }) {
  const [activeId, setActiveId] = useState("overview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  return (
    <nav className="sticky top-[64px] z-20 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 -mx-4 px-4 overflow-x-auto">
      <div className="flex gap-1 py-2 min-w-max">
        {SECTIONS.map(({ id, label }) => {
          const displayLabel = id === "articles" && articleCount ? `${label} (${articleCount})` : label;
          return (
            <button key={id} onClick={() => scrollTo(id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap ${
                activeId === id
                  ? "bg-primary-500 text-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}>
              {displayLabel}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
