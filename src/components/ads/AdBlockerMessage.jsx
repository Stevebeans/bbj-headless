"use client";

import Link from "next/link";
import { useAdBlockDetector } from "@/hooks/useAdBlockDetector";

/**
 * Friendly message shown when ad blocker is detected
 */
function BlockerMessage() {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
        <span className="text-base mr-1.5">👋</span>
        Hey, we see you&apos;re using an ad blocker.
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Totally get it! But those ads help keep BBJ running and the feed updates flowing.
        If you want an ad-free experience plus some cool extras, check out Premium.
      </p>
      <Link
        href="/premium"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Explore Premium
      </Link>
    </div>
  );
}

/**
 * Wrapper that shows ad content or blocker message
 *
 * @param {boolean} hasRealAd - Whether there's actual ad content to show
 * @param {string} slot - Slot name (for placeholder display)
 * @param {React.ReactNode} children - The actual ad content
 */
export function AdBlockerWrapper({ hasRealAd, slot, children }) {
  const { isBlocked, isChecked } = useAdBlockDetector();

  // Not checked yet - show nothing or placeholder to avoid flash
  if (!isChecked) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 p-4">
        <p className="text-[10px] text-gray-300 dark:text-gray-600">{slot}</p>
      </div>
    );
  }

  // No real ad assigned - always show placeholder with slot name
  if (!hasRealAd) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 p-4">
        <p className="text-[10px] text-gray-300 dark:text-gray-600">{slot}</p>
      </div>
    );
  }

  // Real ad assigned but blocked - show friendly message
  if (isBlocked) {
    return <BlockerMessage />;
  }

  // Real ad assigned and not blocked - show the ad
  return <>{children}</>;
}
