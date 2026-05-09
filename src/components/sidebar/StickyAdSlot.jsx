"use client";

import { FreestarSlot } from "../ads/FreestarSlot";

/**
 * Sticky sidebar ad wrapper.
 * Defaults to the homepage_sidebar_sticky placement; pass `placementName`
 * to override (e.g. on other pages with their own sticky slots).
 */
export function StickyAdSlot({ placementName = "bigbrotherjunkies_siderail_sticky" }) {
  return (
    <div className="lg:sticky lg:top-24">
      <FreestarSlot placementName={placementName} />
    </div>
  );
}
