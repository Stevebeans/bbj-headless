/**
 * Weekly editor admin client. All routes are gated on season_management.
 * seasonId 0 = "current season" (resolved server-side from bbj_v2_current_season).
 */
import { adminFetch } from "./admin";

export async function getWeeklyBundle(seasonId = 0) {
  return adminFetch(`/admin/seasons/${seasonId}/weeks`);
}

export async function createWeek(seasonId, data = {}) {
  return adminFetch(`/admin/seasons/${seasonId}/weeks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function saveWeek(weekId, payload) {
  return adminFetch(`/admin/weeks/${weekId}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteWeek(weekId) {
  return adminFetch(`/admin/weeks/${weekId}`, { method: "DELETE" });
}
