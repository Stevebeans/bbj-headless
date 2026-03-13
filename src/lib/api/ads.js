/**
 * Ads API client
 * Fetches ad data from WordPress bbjd/v1 endpoints
 */

import { bbjdFetch } from "./wordpress";

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
