"use client";

import { useState } from "react";

/**
 * Collapsible FAQ accordion — auto-generated from season data
 */
export function SeasonFAQ({ questions }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!questions || questions.length === 0) return null;

  return (
    <section id="faq">
      <div className="sech"><h2>FAQ</h2><span className="sub">Common questions</span></div>
      <div className="card">
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {questions.map((q, i) => (
          <div key={q.question} className="py-3">
            <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{q.question}</span>
              <span className="text-gray-400 flex-shrink-0">{openIndex === i ? "▴" : "▾"}</span>
            </button>
            {openIndex === i && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{q.answer}</p>
            )}
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}
