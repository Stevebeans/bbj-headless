/**
 * Analytics API functions
 * All endpoints require analytics_dashboard permission
 */

import { getToken, clearToken } from "@/lib/auth/cookies";

const API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  "https://bigbrotherjunkies.com/wp-json";

async function analyticsFetch(endpoint, params = {}) {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  const query = new URLSearchParams(params).toString();
  const url = `${API_URL}/bbjd/v1${endpoint}${query ? `?${query}` : ""}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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

export async function getAnalyticsOverview(startDate, endDate) {
  return analyticsFetch("/admin/analytics/overview", {
    start_date: startDate,
    end_date: endDate,
  });
}

export async function getAnalyticsPages(startDate, endDate) {
  return analyticsFetch("/admin/analytics/pages", {
    start_date: startDate,
    end_date: endDate,
  });
}

export async function getAnalyticsSources(startDate, endDate) {
  return analyticsFetch("/admin/analytics/sources", {
    start_date: startDate,
    end_date: endDate,
  });
}

export async function getAnalyticsAudience(startDate, endDate) {
  return analyticsFetch("/admin/analytics/audience", {
    start_date: startDate,
    end_date: endDate,
  });
}

export async function getAnalyticsAdBlocker(startDate, endDate) {
  return analyticsFetch("/admin/analytics/adblocker", {
    start_date: startDate,
    end_date: endDate,
  });
}

export async function getSearchConsole(startDate, endDate) {
  return analyticsFetch("/admin/analytics/search-console", {
    start_date: startDate,
    end_date: endDate,
  });
}
