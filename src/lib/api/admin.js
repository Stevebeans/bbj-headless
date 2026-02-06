/**
 * Admin API functions
 * All endpoints require authentication
 */

import { getToken, clearToken } from "@/lib/auth/cookies";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Make authenticated API request
 */
async function adminFetch(endpoint, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`${API_URL}/bbjd/v1${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired or invalid
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login?redirect=/admin";
    }
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// ========================================
// DASHBOARD
// ========================================

export async function getDashboard() {
  return adminFetch("/admin/dashboard");
}

export async function getMyPermissions() {
  return adminFetch("/admin/my-permissions");
}

// ========================================
// REPORTS
// ========================================

export async function getReports(status = "pending", page = 1, perPage = 20) {
  return adminFetch(`/admin/reports?status=${status}&page=${page}&per_page=${perPage}`);
}

export async function getReportDetails(reportId) {
  return adminFetch(`/admin/reports/${reportId}`);
}

export async function actionReport(reportId, action) {
  return adminFetch(`/admin/reports/${reportId}/action`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export async function bulkActionReports(reportIds, action) {
  return adminFetch("/admin/reports/bulk-action", {
    method: "POST",
    body: JSON.stringify({ report_ids: reportIds, action }),
  });
}

// ========================================
// COMMENTS MODERATION
// ========================================

export async function getCommentsForModeration(filter = "reported", page = 1, perPage = 20) {
  return adminFetch(`/admin/comments?filter=${filter}&page=${page}&per_page=${perPage}`);
}

export async function moderateComment(commentId, action) {
  return adminFetch(`/admin/comments/${commentId}/moderate`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

// ========================================
// BLACKLIST
// ========================================

export async function getBlacklist(page = 1, perPage = 20, activeOnly = true) {
  return adminFetch(`/admin/blacklist?page=${page}&per_page=${perPage}&active_only=${activeOnly}`);
}

export async function addToBlacklist(data) {
  return adminFetch("/admin/blacklist", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function removeFromBlacklist(id) {
  return adminFetch(`/admin/blacklist/${id}`, {
    method: "DELETE",
  });
}

// ========================================
// SETTINGS
// ========================================

export async function getSettings() {
  return adminFetch("/admin/settings");
}

export async function updateSettings(settings) {
  return adminFetch("/admin/settings", {
    method: "POST",
    body: JSON.stringify(settings),
  });
}

export async function getRoles() {
  return adminFetch("/admin/roles");
}

// ========================================
// DATABASE / MIGRATIONS
// ========================================

export async function getDatabaseStatus() {
  return adminFetch("/admin/database/status");
}

export async function runMigration() {
  return adminFetch("/admin/database/migrate", {
    method: "POST",
  });
}

export async function getVoteMigrationPreview() {
  return adminFetch("/admin/database/vote-migration-preview");
}

export async function runVoteMigration(batchSize = 5000) {
  return adminFetch("/admin/database/migrate-votes", {
    method: "POST",
    body: JSON.stringify({ batch_size: batchSize }),
  });
}

export async function resetVoteMigration() {
  return adminFetch("/admin/database/reset-vote-migration", {
    method: "POST",
  });
}

export async function recalculateRanks(limit = 0) {
  return adminFetch("/admin/ranks/recalculate", {
    method: "POST",
    body: JSON.stringify({ limit }),
  });
}

// ========================================
// BUG REPORTS
// ========================================

export async function getBugReports(status = "open", severity = "all", type = "all", page = 1) {
  return adminFetch(`/bug-reports?status=${status}&severity=${severity}&type=${type}&page=${page}`);
}

export async function updateBugReport(id, data) {
  return adminFetch(`/bug-reports/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getBugReportStats() {
  return adminFetch("/bug-reports/stats");
}
