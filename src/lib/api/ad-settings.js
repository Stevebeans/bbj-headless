/**
 * Ad Settings API client
 * Uses adminFetch pattern for authenticated requests
 */

import { getToken, clearToken } from "@/lib/auth/cookies";

const API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  "https://bigbrotherjunkies.com/wp-json";

export async function getAdSettings() {
  const token = getToken();
  const res = await fetch(`${API_URL}/bbjd/v1/ad-settings`, {
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login?redirect=/admin/ads";
    }
    throw new Error("Session expired");
  }

  if (!res.ok) throw new Error("Failed to fetch ad settings");
  return res.json();
}

export async function updateAdSettings(settings) {
  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated");
  }

  const res = await fetch(`${API_URL}/bbjd/v1/ad-settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(settings),
  });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login?redirect=/admin/ads";
    }
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update ad settings");
  }

  return res.json();
}
