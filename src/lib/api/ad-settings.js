/**
 * Ad Settings API client
 * Uses adminFetch pattern for authenticated requests
 */

import { getToken, clearToken } from "@/lib/auth/cookies";
import { forceRefreshToken } from "@/lib/auth/refresh";

const API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  "https://bigbrotherjunkies.com/wp-json";

const ADS_REDIRECT = "/login?redirect=/admin/ads";

/**
 * Authenticated fetch for ad-settings endpoints. On a 401, attempts one
 * sliding-refresh + retry before clearing the session and redirecting.
 * Returns the raw Response (callers handle !res.ok + json()).
 */
async function adFetch(url, init = {}, _retried = false) {
  const token = getToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401 && !_retried) {
    const fresh = await forceRefreshToken();
    if (fresh) return adFetch(url, init, true);
  }

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = ADS_REDIRECT;
    }
    throw new Error("Session expired");
  }

  return res;
}

export async function getAdSettings() {
  const res = await adFetch(`${API_URL}/bbjd/v1/ad-settings`, {
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch ad settings");
  return res.json();
}

export async function updateAdSettings(settings) {
  if (!getToken()) {
    throw new Error("Not authenticated");
  }

  const res = await adFetch(`${API_URL}/bbjd/v1/ad-settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(settings),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update ad settings");
  }

  return res.json();
}
