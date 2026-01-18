"use client";

import { useState, useEffect } from "react";
import { getHelpData } from "@/lib/api/settings";

// Color mapping for Tailwind classes (must be explicit for JIT compiler)
const colorClasses = {
  // Text colors
  "gray-500": "text-gray-500",
  "orange-600": "text-orange-600",
  "cyan-600": "text-cyan-600",
  "yellow-600": "text-yellow-600",
  "purple-600": "text-purple-600",
  "teal-600": "text-teal-600",
  "red-600": "text-red-600",
  "blue-600": "text-blue-600",
  "pink-600": "text-pink-600",
  "amber-500": "text-amber-500",
};

const bgColorClasses = {
  "gray-100": "bg-gray-100 dark:bg-gray-800",
  "orange-100": "bg-orange-100 dark:bg-orange-900/30",
  "cyan-100": "bg-cyan-100 dark:bg-cyan-900/30",
  "yellow-100": "bg-yellow-100 dark:bg-yellow-900/30",
  "purple-100": "bg-purple-100 dark:bg-purple-900/30",
  "teal-100": "bg-teal-100 dark:bg-teal-900/30",
  "red-100": "bg-red-100 dark:bg-red-900/30",
  "blue-100": "bg-blue-100 dark:bg-blue-900/30",
  "amber-100": "bg-amber-100 dark:bg-amber-900/30",
  "pink-100": "bg-pink-100 dark:bg-pink-900/30",
};

/**
 * Icon components for ranks
 */
function RankIcon({ icon, className }) {
  const icons = {
    medal: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
    gem: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 9l10 13 10-13-10-7zm0 3.84L18.55 9 12 19.08 5.45 9 12 5.84z" />
      </svg>
    ),
    trophy: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
      </svg>
    ),
    crown: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .55-.45 1-1 1H6c-.55 0-1-.45-1-1v-1h14v1z" />
      </svg>
    ),
    shield: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
      </svg>
    ),
    star: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ),
  };

  return icons[icon] || null;
}

/**
 * Help/FAQ tab with dynamic rank information
 */
export default function HelpTab() {
  const [helpData, setHelpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await getHelpData();
        if (result.success) {
          setHelpData(result.help);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <HelpSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load help data. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Rank System */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Community Rank System
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {helpData?.ranks?.explanation?.progression}
        </p>

        {/* Regular Ranks */}
        <div className="space-y-3 mb-8">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Progression Ranks
          </h4>
          <div className="grid gap-3">
            {helpData?.ranks?.regular?.map((rank) => {
              const bgClass = bgColorClasses[rank.bg_color] || "bg-gray-100 dark:bg-gray-800";
              const textClass = colorClasses[rank.color] || "text-gray-500";
              return (
                <div
                  key={rank.key}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full ${bgClass} flex items-center justify-center`}>
                      {rank.icon ? (
                        <RankIcon icon={rank.icon} className={`w-4 h-4 ${textClass}`} />
                      ) : (
                        <span className={`text-xs font-bold ${textClass}`}>
                          {rank.name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${textClass}`}>
                        {rank.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {rank.min_comments > 0 || rank.min_karma > 0 ? (
                          <>
                            {rank.min_comments}+ comments, {rank.min_karma}+ karma
                          </>
                        ) : (
                          "Starting rank"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Karma Explanation */}
        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg mb-8">
          <h4 className="font-medium text-primary-700 dark:text-primary-300 mb-2">
            What is Karma?
          </h4>
          <p className="text-sm text-primary-600 dark:text-primary-400">
            {helpData?.ranks?.explanation?.karma}
          </p>
        </div>

        {/* Special Ranks */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Special Ranks
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {helpData?.ranks?.explanation?.special}
          </p>
          <div className="flex flex-wrap gap-2">
            {helpData?.ranks?.special?.map((rank) => {
              const bgClass = bgColorClasses[rank.bg_color] || "bg-gray-100 dark:bg-gray-800";
              const textClass = colorClasses[rank.color] || "text-gray-500";
              return (
                <div
                  key={rank.key}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${bgClass} rounded-full`}
                >
                  {rank.icon && (
                    <RankIcon icon={rank.icon} className={`w-3.5 h-3.5 ${textClass}`} />
                  )}
                  <span className={`text-sm font-medium ${textClass}`}>
                    {rank.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h3>
        <div className="space-y-2">
          {helpData?.faq?.map((item, index) => (
            <div
              key={index}
              className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.question}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedFaq === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HelpSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
      <div>
        <div className="h-6 w-56 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
