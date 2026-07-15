import { adminFetch } from "./admin";

// --- Admin Feed Updates (list / edit / delete) ---
// Reuses the public list route (which adds raw_content for feed_updates users)
// and the updater PUT/DELETE routes.

export async function listFeedUpdates({ perPage = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({ per_page: perPage, offset });
  return adminFetch(`/feed-updates?${params}`);
}

export async function updateFeedUpdate(id, { title, details }) {
  return adminFetch(`/feed-updates/${id}`, {
    method: "PUT",
    body: JSON.stringify({ title, details }),
  });
}

export async function deleteFeedUpdate(id) {
  return adminFetch(`/feed-updates/${id}`, {
    method: "DELETE",
  });
}
