/**
 * Brand Safety admin API client
 * Thin wrappers over adminFetch (see lib/api/admin.js) for the
 * bbjd/v1/brand-safety/* routes — settings/tiers, legacy-content backfill
 * (dry-run + batched apply), the flagged-posts review queue, the hit log,
 * and the local-media quarantine trigger. Requires the `brand_safety`
 * admin permission (administrator-only).
 */

import { adminFetch } from "@/lib/api/admin";

export async function getBrandSafetySettings() {
  return adminFetch("/brand-safety/settings");
}

export async function updateTiers(tierOverrides) {
  return adminFetch("/brand-safety/settings", {
    method: "PUT",
    body: JSON.stringify({ tier_overrides: tierOverrides }),
  });
}

export async function runDryRun(target) {
  return adminFetch("/brand-safety/dry-run", {
    method: "POST",
    body: JSON.stringify({ target }),
  });
}

// purge is posts-only and must be opted into explicitly by the caller —
// it triggers a real CF/ISR revalidate per applied post (prod by default).
export async function runApply(target, batch, purge = false) {
  const body = { target, batch };
  if (purge) body.purge = true;
  return adminFetch("/brand-safety/apply", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getFlagged() {
  return adminFetch("/brand-safety/flagged");
}

export async function setOverride(postId, safe) {
  return adminFetch("/brand-safety/override", {
    method: "POST",
    body: JSON.stringify({ post_id: postId, safe }),
  });
}

export async function getLog(page = 1) {
  return adminFetch(`/brand-safety/log?page=${page}`);
}

export async function quarantineMedia() {
  return adminFetch("/brand-safety/quarantine-media", {
    method: "POST",
  });
}
