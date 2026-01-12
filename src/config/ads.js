/**
 * Ad Configuration
 *
 * Define where ads appear throughout the site
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

  // Slots used in different locations
  slots: {
    // Homepage
    indexTop: "index-top",
    indexMid: "index-mid",

    // Sidebar
    sidebarTop: "sidebar-top",
    sidebarBottom: "sidebar-bottom",

    // Single post
    beforeContent: "before-content",
    afterContent: "after-content",

    // Feed updates
    feedInterval: "feed-interval"
  }
};

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
