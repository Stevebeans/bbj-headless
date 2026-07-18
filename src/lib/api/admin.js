/**
 * Admin API functions
 * All endpoints require authentication
 */

import { getToken, clearToken } from "@/lib/auth/cookies";
import { forceRefreshToken } from "@/lib/auth/refresh";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Make authenticated API request
 */
export async function adminFetch(endpoint, options = {}) {
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

  if (response.status === 401 && !options._retried) {
    // Could be a transient/expired token — try one sliding refresh, then retry.
    const fresh = await forceRefreshToken();
    if (fresh) {
      return adminFetch(endpoint, { ...options, _retried: true });
    }
  }

  if (response.status === 401) {
    // Refresh failed — genuinely unauthenticated.
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

  if (response.status === 204) {
    return null;
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

export async function purgeCache() {
  return adminFetch("/admin/purge-cache", { method: "POST" });
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

export async function simulatePermissions(role) {
  return adminFetch(`/admin/simulate-permissions?role=${encodeURIComponent(role)}`);
}

export async function getRoleMembers(role) {
  return adminFetch(`/admin/role-members?role=${encodeURIComponent(role)}`);
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
// ANNOUNCEMENTS
// ========================================

export async function getAnnouncements(page = 1, perPage = 20) {
  return adminFetch(`/admin/announcements?page=${page}&per_page=${perPage}`);
}

export async function createAnnouncement(message) {
  return adminFetch("/admin/announcements", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export async function deleteAnnouncement(id) {
  return adminFetch(`/admin/announcements/${id}`, {
    method: "DELETE",
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

// ========================================
// CONTENT ENGINE
// ========================================

export async function getContentDrafts(status = 'draft', page = 1) {
  return adminFetch(`/content-engine/drafts?status=${status}&page=${page}`);
}

export async function createContentDraft(data) {
  return adminFetch('/content-engine/drafts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContentDraft(id, data) {
  return adminFetch(`/content-engine/drafts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteContentDraft(id) {
  return adminFetch(`/content-engine/drafts/${id}`, {
    method: 'DELETE',
  });
}

export async function getContentQueue() {
  return adminFetch('/content-engine/queue');
}

export async function rescheduleContent(id, scheduledAt) {
  return adminFetch(`/content-engine/queue/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  });
}

export async function getPostLog(page = 1) {
  return adminFetch(`/content-engine/log?page=${page}`);
}

export async function getContentEngineSettings() {
  return adminFetch('/content-engine/settings');
}

export async function updateContentEngineSettings(data) {
  return adminFetch('/content-engine/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ========================================
// FACEBOOK
// ========================================

export async function getFacebookPages() {
  return adminFetch('/facebook/pages');
}

export async function postToFacebook(data) {
  return adminFetch('/facebook/post', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function postPhotoToFacebook(data) {
  return adminFetch('/facebook/post-photo', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ========================================
// AI
// ========================================

export async function generateCaption(imageData, mediaType = 'image/jpeg', context = '') {
  return adminFetch('/ai/caption', {
    method: 'POST',
    body: JSON.stringify({ image_data: imageData, media_type: mediaType, context }),
  });
}

export async function rewriteArticle(articleText, sourceUrl = '') {
  return adminFetch('/ai/rewrite', {
    method: 'POST',
    body: JSON.stringify({ article_text: articleText, source_url: sourceUrl }),
  });
}

export async function enhanceTemplate(templateText) {
  return adminFetch('/ai/enhance', {
    method: 'POST',
    body: JSON.stringify({ template_text: templateText }),
  });
}

// ========================================
// SOCIAL QUICKIES (FB pipeline)
// ========================================

export async function getTopSocialPosts(hours = 24, limit = 25, sort = 'top') {
  return adminFetch(`/social/top-posts?hours=${hours}&limit=${limit}&sort=${sort}`);
}

export async function generateQuickieCaption(text, handle) {
  return adminFetch('/social/quickie-caption', {
    method: 'POST',
    body: JSON.stringify({ text, handle }),
  });
}

export async function queueQuickie(data) {
  return adminFetch('/social/quickie-queue', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getRecentFeedUpdates() {
  return adminFetch('/social/feed-updates-recent');
}

export async function queueFeedShares(pageId, postIds, pageName = '') {
  return adminFetch('/social/feed-share-queue', {
    method: 'POST',
    body: JSON.stringify({ page_id: pageId, post_ids: postIds, page_name: pageName }),
  });
}

// ========================================
// NEWS
// ========================================

export async function getNewsFeed(page = 1) {
  return adminFetch(`/news/feed?page=${page}`);
}

export async function scanNewsArticle(url) {
  return adminFetch('/news/scan', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function refreshNewsFeeds() {
  return adminFetch('/news/refresh', {
    method: 'POST',
  });
}

export async function getNewsSources() {
  return adminFetch('/news/sources');
}
