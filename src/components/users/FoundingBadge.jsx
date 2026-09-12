"use client";

import { FaSeedling } from "react-icons/fa";

const SIZES = { xs: "text-[9px] px-1 py-0", sm: "text-[10px] px-1.5 py-0.5" };

/** Founding Junkie - BB28-era founding badge. Era lives in the tooltip, not the art. */
export default function FoundingBadge({ size = "sm" }) {
  return (
    <span
      title="Founding Junkie — here since the BB28 era, 2026"
      className={`inline-flex items-center gap-1 rounded-full font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-1 ring-emerald-400/50 ${SIZES[size] || SIZES.sm}`}
    >
      <FaSeedling aria-hidden className="shrink-0" />
      Founding Junkie
    </span>
  );
}

export function FoundingBadgeInline() {
  return <FoundingBadge size="xs" />;
}
