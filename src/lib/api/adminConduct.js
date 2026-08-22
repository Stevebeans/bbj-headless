/**
 * Conduct queue admin API (member-grouped reports + enforcement ladder).
 */
import { adminFetch } from "./admin";

export async function getConductMembers(page = 1) {
  return adminFetch(`/admin/conduct/members?page=${page}`);
}

export async function getConductMember(userId) {
  return adminFetch(`/admin/conduct/members/${userId}`);
}

export async function conductAction(userId, payload) {
  return adminFetch(`/admin/conduct/members/${userId}/action`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
