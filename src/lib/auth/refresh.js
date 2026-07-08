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

/**
 * Refresh regardless of threshold. Two modes:
 *  - live JS token → classic Bearer refresh (as before)
 *  - no readable token → anchor recovery: the HttpOnly bbj_token_s cookie
 *    rides along via credentials:'include' and authenticates the mint.
 *
 * Three-value return contract (callers must branch on all three):
 *  - `string` — the fresh token, on success
 *  - `false`  — definitive rejection: the server responded but refused
 *               (`!res.ok`), or an ok response came back without a token
 *  - `null`   — thrown fetch/network error (also returned by inflight
 *               de-dupe pass-through); treat as "unknown," not "rejected"
 */
export async function forceRefreshToken() {
  let token = getToken();
  if (token && isTokenExpired(token)) token = null;
  if (inflight) return inflight;

  const remember = getRememberPreference();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  inflight = (async () => {
    try {
      const res = await fetch(`${API_URL}/bbjd/v1/auth/refresh`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ remember_me: remember }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data && data.token) {
        setToken(data.token, remember);
        return data.token;
      }
      return false;
    } catch {
      return null; // network blip — keep the existing token, try again next tick
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
