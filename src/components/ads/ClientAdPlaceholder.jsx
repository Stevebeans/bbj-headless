"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Client-side Ad Placeholder - for use in Client Components
 * Fetches ad data on the client side using useEffect
 *
 * @param {string} slot - The ad slot identifier
 * @param {string} minHeight - Minimum height for CLS prevention
 * @param {string} className - Additional CSS classes
 */
export function ClientAdPlaceholder({ slot, minHeight = "250px", className = "" }) {
  const [adData, setAdData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const response = await fetch(`${API_URL}/bbjd/v1/ad/${slot}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        setAdData(data);
      } catch (err) {
        // Silently fail - ads are non-critical
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [slot]);

  // Loading state - show placeholder
  if (loading) {
    return (
      <div
        className={`v2-ad-container bg-slate-50 dark:bg-slate-800/50 animate-pulse ${className}`}
        style={{ minHeight }}
        data-ad-slot={slot}
      >
        <div className="flex items-center justify-center h-full min-h-[inherit] text-slate-300 dark:text-slate-600">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }

  // Error or no ad to show
  if (error || !adData?.show) {
    return null;
  }

  // Render ad content
  const hasAdContent = adData.show && adData.content;

  return (
    <div className={`ad-branded-container ${className}`} aria-label="Advertisement">
      {/* Header */}
      <div className="flex items-center justify-center py-1.5 border-b border-slate-200 dark:border-slate-700">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-medium">
          Advertisement
        </span>
      </div>

      {/* Ad Content */}
      <div
        className="v2-ad-container bg-slate-50 dark:bg-slate-800/50"
        style={{ minHeight }}
        data-ad-slot={slot}
      >
        {hasAdContent ? (
          <div dangerouslySetInnerHTML={{ __html: adData.content }} />
        ) : (
          <div className="flex items-center justify-center h-full min-h-[inherit] text-slate-300 dark:text-slate-600 text-sm">
            Ad Space
          </div>
        )}
      </div>

      {/* Footer with Go Ad-Free CTA */}
      <div className="flex items-center justify-center py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
        <Link
          href="/premium"
          className="group flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="font-medium">Go Ad-Free</span>
        </Link>
      </div>
    </div>
  );
}

export default ClientAdPlaceholder;
