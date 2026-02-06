/**
 * Bug Report API functions
 * Submit endpoints use user auth, admin endpoints use admin auth
 */

import { getToken } from "@/lib/auth/cookies";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Get a valid auth token or throw
 */
function requireToken() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return token;
}

/**
 * Make authenticated JSON API request to bug report endpoints
 */
async function bugReportFetch(endpoint, options = {}) {
  const token = requireToken();

  const response = await fetch(`${API_URL}/bbjd/v1${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  return response.json();
}

// ========================================
// USER ENDPOINTS
// ========================================

/**
 * Submit a bug report
 */
export async function submitBugReport(data) {
  return bugReportFetch("/bug-reports", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Upload a screenshot for a bug report
 * Uses FormData (no Content-Type header - browser sets multipart boundary)
 */
export async function uploadBugScreenshot(file) {
  const token = requireToken();

  const formData = new FormData();
  formData.append("screenshot", file);

  const response = await fetch(`${API_URL}/bbjd/v1/bug-reports/upload-screenshot`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload screenshot");
  }

  return response.json();
}
