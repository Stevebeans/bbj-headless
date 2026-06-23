"use client";

import { usePathname } from "next/navigation";
import { useAds } from "@/context/AdContext";
import { FreestarSlot } from "./FreestarSlot";

const PLACEMENT = "bigbrotherjunkies_leaderboard_top";

/**
 * Site-wide leaderboard above the global header — replaces the removed
 * Freestar pushdown. Uses the dedicated `leaderboard_top` placement Freestar
 * built for this slot (pure leaderboard: 728×90 desktop / 320×100 mobile),
 * replacing the earlier `leaderboard_atf` reuse. Still height-capped in
 * globals.css (.freestar-slot.bbj-top-leaderboard) as a safety net.
 *
 * Rendered chrome-less: no bordered card or "Go Ad-Free" footer (those read as
 * bulky at the very top of the page). We use FreestarSlot with
 * showBranding={false} and add only a tiny "Advertisement" disclosure label.
 *
 * Because the label lives outside FreestarSlot, we mirror FreestarSlot's own
 * gating here so a bare "Advertisement" never shows without an ad — supporters,
 * ad-free routes, PWA-suppressed placements, and ad-blocked sessions all render
 * nothing. Keyed by pathname so the slot refreshes per client-side navigation.
 */
export function TopLeaderboard() {
  const pathname = usePathname();
  const { shouldShowAds, isPWA, isAdBlocked, disabledPlacements, pwaSuppressed, previewMode } = useAds();

  const show =
    previewMode ||
    (shouldShowAds &&
      !isAdBlocked &&
      !disabledPlacements.includes(PLACEMENT) &&
      !(isPWA && pwaSuppressed.includes(PLACEMENT)));

  if (!show) return null;

  return (
    <div className="flex w-full flex-col items-center px-2 py-2">
      <span className="mb-1 text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
        Advertisement
      </span>
      <FreestarSlot
        key={pathname}
        placementName={PLACEMENT}
        showBranding={false}
        className="bbj-top-leaderboard w-full max-w-5xl"
      />
    </div>
  );
}

export default TopLeaderboard;
