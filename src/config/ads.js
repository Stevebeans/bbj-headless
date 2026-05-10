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
    desktop: { width: 728, height: 90 },
    mobile: { width: 320, height: 100 },
    label: "Leaderboard ATF",
  },
  bigbrotherjunkies_incontent_reusable: {
    desktop: { width: 336, height: 280 },
    mobile: { width: 300, height: 250 },
    label: "In-Content Reusable",
  },
  bigbrotherjunkies_incontent_reusable_Homepage2: {
    desktop: { width: 336, height: 280 },
    mobile: { width: 300, height: 250 },
    label: "In-Content (Homepage 2)",
  },
  bigbrotherjunkies_middle_feed: {
    desktop: { width: 336, height: 280 },
    mobile: { width: 300, height: 250 },
    label: "Middle Feed",
  },
  bigbrotherjunkies_middle_post: {
    desktop: { width: 336, height: 280 },
    mobile: { width: 300, height: 250 },
    label: "Middle Post",
  },
  bigbrotherjunkies_siderail_right_1: {
    desktop: { width: 300, height: 250 },
    mobile: { width: 0, height: 0 },
    label: "Siderail Right 1",
  },
  bigbrotherjunkies_siderail_right_2: {
    desktop: { width: 300, height: 250 },
    mobile: { width: 0, height: 0 },
    label: "Siderail Right 2",
  },
  bigbrotherjunkies_sticky_siderail_right: {
    desktop: { width: 300, height: 250 },
    mobile: { width: 0, height: 0 },
    label: "Sticky Siderail",
  },
};

/**
 * Get slot configuration with size info
 * @param {string} placementName - The Freestar placement identifier
 * @returns {object} Slot config with desktop/mobile heights
 */
export function getSlotConfig(placementName) {
  return (
    adSlots[placementName] || {
      desktop: { width: 300, height: 250 },
      mobile: { width: 300, height: 250 },
      label: "Unknown Slot",
    }
  );
}
