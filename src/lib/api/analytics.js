/**
 * Analytics API functions
 * All endpoints require analytics_dashboard permission
 */

import { getToken, clearToken } from "@/lib/auth/cookies";
import { forceRefreshToken } from "@/lib/auth/refresh";

const API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  "https://bigbrotherjunkies.com/wp-json";

async function analyticsFetch(endpoint, params = {}, _retried = false) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const query = new URLSearchParams(params).toString();
  const url = `${API_URL}/bbjd/v1${endpoint}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401 && !_retried) {
    const fresh = await forceRefreshToken();
    if (fresh) {
      return analyticsFetch(endpoint, params, true);
    }
  }

  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login?redirect=/admin/stats";
    }
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }

  return response.json();
}

function createDateEndpoint(path) {
  return function (startDate, endDate) {
    return analyticsFetch(path, { start_date: startDate, end_date: endDate });
  };
}

export const getAnalyticsOverview = createDateEndpoint("/admin/analytics/overview");
export const getAnalyticsPages = createDateEndpoint("/admin/analytics/pages");
export const getAnalyticsSources = createDateEndpoint("/admin/analytics/sources");
export const getAnalyticsAudience = createDateEndpoint("/admin/analytics/audience");
export const getAnalyticsAdBlocker = createDateEndpoint("/admin/analytics/adblocker");
export const getSearchConsole = createDateEndpoint("/admin/analytics/search-console");
export const getRankTracker = createDateEndpoint("/admin/analytics/rank-tracker");

export async function saveTrackedKeywords(keywords) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_URL}/bbjd/v1/admin/analytics/tracked-keywords`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ keywords }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `API error: ${response.status}`);
  }

  return response.json();
}
