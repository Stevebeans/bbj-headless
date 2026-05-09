"use client";

import { FreestarSlot } from "../ads/FreestarSlot";

/**
 * Sticky sidebar ad wrapper.
 * Defaults to bigbrotherjunkies_siderail_right_2 (an already-configured Freestar
 * placement). Override via the `placementName` prop if a dedicated sticky slot
 * gets registered at Freestar later.
 */
export function StickyAdSlot({ placementName = "bigbrotherjunkies_siderail_right_2" }) {
  return (
    <div className="lg:sticky lg:top-24">
      <FreestarSlot placementName={placementName} />
    </div>
  );
}
