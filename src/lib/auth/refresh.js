import { getToken, setToken, getRememberPreference } from "./cookies";
import { isTokenExpired, shouldRefresh } from "./token";

const API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  "https://bigbrotherjunkies.com/wp-json";

// De-dupe concurrent refreshes (hydration + heartbeat can race).
let inflight = null;

/**
 * Re-mint the token only when it's past ~50% of its life and still valid.
 * Re-writing the cookie via setToken() also resets Safari's ITP 7-day
 * script-cookie clock, so weekly-active users stay logged in.
 */
export async function maybeRefreshToken() {
  const token = getToken();
  if (!token || isTokenExpired(token)) return null;
  if (!shouldRefresh(token)) return token;
  return forceRefreshToken();
}

/** Attempt a refresh regardless of threshold (only if a non-expired token exists). */
export async function forceRefreshToken() {
  const token = getToken();
  if (!token || isTokenExpired(token)) return null;
  if (inflight) return inflight;

  const remember = getRememberPreference();
  inflight = (async () => {
    try {
      const res = await fetch(`${API_URL}/bbjd/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ remember_me: remember }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data && data.token) {
        setToken(data.token, remember);
        return data.token;
      }
      return null;
    } catch {
      return null; // network blip — keep the existing token, try again next tick
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
