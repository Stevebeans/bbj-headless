/**
 * Ad Configuration
 *
 * Define where ads appear throughout the site
 * Includes sizes for CLS (Cumulative Layout Shift) prevention
 */

export const adConfig = {
  // In-content ads for blog posts
  // Position = after which paragraph (1-indexed)
  inContent: [
    { position: 2, slot: "in-content-1", type: "taboola" },
    { position: 4, slot: "in-content-2", type: "adsense" },
    { position: 7, slot: "in-content-3", type: "taboola" },
    { position: 12, slot: "in-content-4", type: "adsense" },
    { position: 16, slot: "in-content-5", type: "taboola" },
    { position: 20, slot: "in-content-6", type: "adsense" }
  ],

  // Minimum paragraphs required to show in-content ads
  minParagraphs: 5,

  /**
   * Slot definitions with sizes for CLS prevention
   * Heights are reserved to prevent layout shift when ads load
   *
   * Common ad sizes:
   * - Leaderboard: 728x90
   * - Medium Rectangle: 300x250
   * - Large Rectangle: 336x280
   * - Mobile Banner: 320x100
   */
  slots: {
    // Homepage - horizontal banners
    index_top: {
      desktop: { height: 280 },   // 336x280 large rectangle
      mobile: { height: 100 },    // 320x100 mobile banner
    },
    index_mid: {
      desktop: { height: 280 },
      mobile: { height: 100 },
    },

    // Sidebar - medium rectangles (only show on desktop)
    sidebar_top: {
      desktop: { height: 250 },   // 300x250 medium rectangle
      mobile: { height: 0 },      // Hidden on mobile
    },
    sidebar_bottom: {
      desktop: { height: 250 },
      mobile: { height: 0 },
    },

    // Single post
    before_content: {
      desktop: { height: 90 },    // 728x90 leaderboard
      mobile: { height: 100 },
    },
    after_post: {
      desktop: { height: 280 },
      mobile: { height: 250 },
    },

    // Feed updates - in-feed ads
    between_feeds: {
      desktop: { height: 280 },
      mobile: { height: 250 },
    },

    // In-content ads (default for dynamic slots)
    default: {
      desktop: { height: 280 },
      mobile: { height: 250 },
    },
  },
};

/**
 * Get slot configuration with size info
 * @param {string} slotSlug - The slot identifier
 * @returns {object} Slot config with desktop/mobile heights
 */
export function getSlotConfig(slotSlug) {
  return adConfig.slots[slotSlug] || adConfig.slots.default;
}

/**
 * Get in-content ad placements for a given paragraph count
 * Filters out positions that exceed the content length
 */
export function getInContentPlacements(paragraphCount) {
  if (paragraphCount < adConfig.minParagraphs) {
    return [];
  }

  return adConfig.inContent.filter(
    // Don't place ads in the last 2 paragraphs
    placement => placement.position < paragraphCount - 1
  );
}
