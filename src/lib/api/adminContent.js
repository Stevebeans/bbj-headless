/**
 * Admin Players & Seasons CRUD client.
 * All calls require the admin JWT (handled inside adminFetch).
 */
import { adminFetch } from "./admin";

/**
 * Build a query string from list params, dropping empties/zeros.
 * Pure + unit-tested. Maps perPage -> per_page.
 * @param {{search?:string, season?:number, status?:string, page?:number, perPage?:number}} params
 * @returns {string} e.g. "?search=Jane&status=publish" or ""
 */
export function buildListQuery(params = {}) {
  const map = {
    search: params.search,
    season: params.season,
    status: params.status,
    page: params.page,
    per_page: params.perPage,
  };
  const parts = [];
  for (const [key, value] of Object.entries(map)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (typeof value === "number" && value === 0) continue;
    parts.push(`${key}=${encodeURIComponent(value)}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

// ---------- Players ----------

export async function listAdminPlayers(params = {}) {
  return adminFetch(`/admin/players${buildListQuery(params)}`);
}

export async function createPlayer(data) {
  return adminFetch("/admin/players", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function trashPlayer(id) {
  return adminFetch(`/admin/players/${id}/trash`, { method: "POST" });
}

export async function restorePlayer(id) {
  return adminFetch(`/admin/players/${id}/restore`, { method: "POST" });
}

// ---------- Seasons ----------

export async function listAdminSeasons(params = {}) {
  return adminFetch(`/admin/seasons${buildListQuery(params)}`);
}

export async function createSeason(data) {
  return adminFetch("/admin/seasons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function trashSeason(id) {
  return adminFetch(`/admin/seasons/${id}/trash`, { method: "POST" });
}

export async function restoreSeason(id) {
  return adminFetch(`/admin/seasons/${id}/restore`, { method: "POST" });
}
