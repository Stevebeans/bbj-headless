"use client";

import Link from "next/link";

/**
 * "Auto-updates" affordance for live feed lists (homepage + hub).
 * Paid: working toggle + a brief "• live" pulse when new cards drop in.
 * Free: disabled toggle labeled "⭐ premium" + Upgrade link — a quiet,
 * always-visible conversion carrot (no banner, zero layout shift).
 */
export function LiveIndicatorToggle({ isPremium, live, onToggle, pulse = false }) {
  return (
    <div className="flex items-center justify-end gap-2 text-xs mb-2">
      {pulse && isPremium && (
        <span className="text-red-500 font-semibold animate-pulse" aria-live="polite">
          • live
        </span>
      )}
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <span className="text-gray-500 dark:text-gray-400">
          {isPremium ? "Auto-updates" : "Auto-updates ⭐ premium"}
        </span>
        <input
          type="checkbox"
          checked={Boolean(isPremium && live)}
          disabled={!isPremium}
          onChange={(event) => onToggle?.(event.target.checked)}
          className="accent-red-500"
        />
      </label>
      {!isPremium && (
        <Link
          href="/become-supporter"
          className="text-primary-500 dark:text-primary-300 underline"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}
