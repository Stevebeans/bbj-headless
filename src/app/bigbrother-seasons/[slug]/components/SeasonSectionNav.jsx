"use client";

import { useState, useEffect } from "react";

/**
 * Sticky editorial section nav with scroll-spy.
 * `sections` = [{ id, label, count? }] in document order.
 */
export function SeasonSectionNav({ sections }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0.1 }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  function jump(e, id) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  return (
    <div className="sectionnav">
      {sections.map(({ id, label, count }) => (
        <a key={id} href={`#${id}`} onClick={(e) => jump(e, id)} className={activeId === id ? "on" : ""}>
          {label}
          {count != null ? <span className="ct">{count}</span> : null}
        </a>
      ))}
    </div>
  );
}
