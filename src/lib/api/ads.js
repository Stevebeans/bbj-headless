/**
 * Ads API client
 * Fetches ad data from WordPress bbjd/v1 endpoints
 */

import { bbjdFetch } from "./wordpress";

/**
 * Get ad data for a specific slot
 * @param {string} slotSlug - The slot identifier (e.g., "sidebar-top")
 * @returns {Promise<object>} Ad data including show_branding
 */
export async function getSlotAd(slotSlug) {
  try {
    const data = await bbjdFetch(`/ad/${slotSlug}`, {
      tags: ["ads", `ad-${slotSlug}`],
    });
    return data;
  } catch (error) {
    // Silently fail - don't spam console with ad errors
    return { show: false, reason: "fetch_error" };
  }
}

/**
 * Get ad data for multiple slots at once
 * @param {string[]} slots - Array of slot slugs
 * @returns {Promise<object>} Object keyed by slot slug with ad data
 */
export async function getMultipleSlotAds(slots) {
  try {
    const data = await bbjdFetch(`/ads?slots=${slots.join(",")}`, {
      tags: ["ads", ...slots.map((s) => `ad-${s}`)],
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch multiple ads:", error);
    // Return empty object for each slot
    return slots.reduce((acc, slot) => {
      acc[slot] = { show: false, reason: "fetch_error" };
      return acc;
    }, {});
  }
}

/**
 * Get header/footer ad scripts from WordPress
 * Returns global scripts (for all users) and ad scripts (blocked for supporters)
 */
export async function getAdScripts() {
  try {
    const data = await bbjdFetch("/ad-scripts", {
      tags: ["ad-scripts"],
      revalidate: 300,
    });
    return data;
  } catch (error) {
    return { global_header: "", global_footer: "", ad_header: "", ad_footer: "" };
  }
}

/**
 * Check if the current user should see ads
 * @returns {Promise<boolean>}
 */
export async function shouldShowAds() {
  try {
    const data = await bbjdFetch("/ads/should-show", {
      tags: ["ads-config"],
    });
    return data.show_ads;
  } catch (error) {
    console.error("Failed to check ad visibility:", error);
    return true; // Default to showing ads on error
  }
}
