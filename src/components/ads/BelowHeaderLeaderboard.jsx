"use client";

import { usePathname } from "next/navigation";
import { useAds } from "@/context/AdContext";
import { FreestarSlot } from "./FreestarSlot";

const PLACEMENT = "bigbrotherjunkies_leaderboard_top";

/**
 * Site-wide leaderboard BELOW the header, in page flow — the old theme's
 * `sep23-header` placement (leaderboard_atf, #5 earner in BB27). Lives under
 * the nav rather than above it, so it doesn't stack with the Freestar pushdown
 * overlay at the top edge — the two coexisted all last season in this layout.
 *
 * Same chrome-less treatment and mirrored gating as TopLeaderboard: the
 * disclosure label lives outside FreestarSlot, so gate here too or a bare
 * "Advertisement" shows without an ad. Kill switch = "Leaderboard ATF" toggle
 * in /admin/ads (disabled_placements).
 *
 * Two mounts share this component: the global layout (every page EXCEPT the
 * homepage, under the nav) and the homepage (below the live-thread banner,
 * where the slot lived in Steve's remembered layout — the faces strip sits
 * between the nav and content there). `onHomepage` picks which mount renders,
 * so the slot appears exactly once per page.
 */
export function BelowHeaderLeaderboard({ onHomepage = false }) {
  const pathname = usePathname();
  const { shouldShowAds, isPWA, isAdBlocked, disabledPlacements, pwaSuppressed, previewMode } = useAds();

  const isHome = pathname === "/";
  if (isHome !== onHomepage) return null;

  const show =
    previewMode ||
    (shouldShowAds &&
      !isAdBlocked &&
      !disabledPlacements.includes(PLACEMENT) &&
      !(isPWA && pwaSuppressed.includes(PLACEMENT)));

  if (!show) return null;

  return (
    <div className="bbj-ad-chrome flex w-full flex-col items-center px-2 py-2">
      <span className="mb-1 text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
        Advertisement
      </span>
      <FreestarSlot
        key={pathname}
        placementName={PLACEMENT}
        showBranding={false}
        className="w-full max-w-5xl"
      />
    </div>
  );
}

export default BelowHeaderLeaderboard;
