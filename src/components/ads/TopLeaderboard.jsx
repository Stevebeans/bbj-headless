"use client";

import { usePathname } from "next/navigation";
import { FreestarSlot } from "./FreestarSlot";

/**
 * Site-wide leaderboard rendered ABOVE the global header — replaces the
 * Freestar pushdown banner that was removed. Reuses the existing
 * `leaderboard_atf` placement (728×90 desktop / 320×100 mobile) so it fills
 * immediately and stays responsive on mobile + desktop.
 *
 * FreestarSlot self-gates on shouldShowAds / supporters / disabled placements /
 * preview mode, so this renders nothing (zero-height) for ad-free users.
 *
 * Keyed by pathname so the slot remounts and requests a fresh ad on each
 * client-side navigation — matching the per-page behavior of the in-page
 * leaderboards this consolidates.
 */
export function TopLeaderboard() {
  const pathname = usePathname();

  return (
    <div className="flex w-full justify-center">
      <FreestarSlot
        key={pathname}
        placementName="bigbrotherjunkies_leaderboard_atf"
        className="bbj-top-leaderboard w-full max-w-3xl px-2 py-2"
      />
    </div>
  );
}

export default TopLeaderboard;
