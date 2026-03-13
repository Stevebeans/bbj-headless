/**
 * Freestar Ad Configuration
 *
 * Placement names match Freestar dashboard (pubos.freestar.io)
 * Heights are reserved for CLS (Cumulative Layout Shift) prevention
 */

// Placements that Freestar auto-manages (SDK injects these — no divs from us)
export const AUTO_MANAGED_PLACEMENTS = [
  "bigbrotherjunkies_articles_dynamic_incontent",
  "bigbrotherjunkies_comments_dynamic_incontent",
  "bigbrotherjunkies_sticky_footer",
  "bigbrotherjunkies_sticky_pushdown",
  "bigbrotherjunkies_google_interstitial",
  "FreeStarVideoAdContainer_Slider",
];

// Placements to suppress in PWA standalone mode (configurable via admin)
export const DEFAULT_PWA_SUPPRESSED = [
  "bigbrotherjunkies_sticky_footer",
  "bigbrotherjunkies_google_interstitial",
];

// Manual placement slot definitions with CLS prevention heights
export const adSlots = {
  bigbrotherjunkies_leaderboard_atf: {
    desktop: { height: 90 },    // 728x90 leaderboard
    mobile: { height: 100 },    // 320x100 mobile banner
  },
  bigbrotherjunkies_incontent_reusable: {
    desktop: { height: 280 },   // 336x280 large rectangle
    mobile: { height: 250 },    // 300x250 medium rectangle
  },
  bigbrotherjunkies_incontent_reusable_Homepage2: {
    desktop: { height: 280 },
    mobile: { height: 250 },
  },
  bigbrotherjunkies_middle_feed: {
    desktop: { height: 280 },
    mobile: { height: 250 },
  },
  bigbrotherjunkies_middle_post: {
    desktop: { height: 280 },
    mobile: { height: 250 },
  },
  bigbrotherjunkies_siderail_right_1: {
    desktop: { height: 250 },   // 300x250 medium rectangle
    mobile: { height: 0 },      // Hidden on mobile
  },
  bigbrotherjunkies_siderail_right_2: {
    desktop: { height: 250 },
    mobile: { height: 0 },
  },
};

/**
 * Get slot configuration with size info
 * @param {string} placementName - The Freestar placement identifier
 * @returns {object} Slot config with desktop/mobile heights
 */
export function getSlotConfig(placementName) {
  return adSlots[placementName] || { desktop: { height: 250 }, mobile: { height: 250 } };
}
