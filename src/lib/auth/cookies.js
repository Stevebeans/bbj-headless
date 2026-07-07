/**
 * Client-side cookie utilities for JWT token management.
 * Replaces localStorage/sessionStorage for auth token storage.
 */

const TOKEN_COOKIE = "bbj_token";
const REMEMBER_COOKIE = "bbj_remember";
const USER_CACHE_COOKIE = "bbj_user";

const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";

/**
 * Read a cookie value by name from document.cookie
 */
function readCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Get the JWT token from cookie
 */
export function getToken() {
  return readCookie(TOKEN_COOKIE);
}

/**
 * Set the JWT token cookie
 * @param {string} token - JWT token
 * @param {boolean} remember - If true, persist for 30 days; if false, session cookie
 */
export function setToken(token, remember) {
  if (typeof document === "undefined") return;

  // Priority=High (Chromium-only, ignored elsewhere): the ad stack churns
  // dozens of first-party cookies per session; when the ~180-cookie/domain
  // jar overflows, Chromium evicts Low/Medium-priority cookies first. Without
  // this, auth cookies sit in the same eviction bucket as ad-sync cookies —
  // the likely cause of members' "logged out every visit despite keep-me-
  // logged-in" reports (2026-07-07).
  let cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; SameSite=Lax; Priority=High`;

  if (remember) {
    cookie += "; max-age=2592000"; // 30 days
  }

  if (isSecure) {
    cookie += "; Secure";
  }

  document.cookie = cookie;

  // Store remember preference
  let rememberCookie = `${REMEMBER_COOKIE}=${remember ? "1" : "0"}; path=/; SameSite=Lax; Priority=High; max-age=2592000`;
  if (isSecure) {
    rememberCookie += "; Secure";
  }
  document.cookie = rememberCookie;
}

/**
 * Clear all auth cookies
 */
export function clearToken() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${REMEMBER_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${USER_CACHE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Cache minimal user profile data in a cookie for SSR.
 * Called after successful token validation so the server can
 * render the avatar, display name, and roles on first paint.
 * @param {{ name?: string, avatar?: string, roles?: string[] }} data
 */
export function setUserCache(data) {
  if (typeof document === "undefined") return;
  const json = JSON.stringify({
    n: data.name || "",
    a: data.avatar || "",
    r: data.roles || [],
  });
  let cookie = `${USER_CACHE_COOKIE}=${encodeURIComponent(json)}; path=/; SameSite=Lax; Priority=High; max-age=2592000`;
  if (isSecure) {
    cookie += "; Secure";
  }
  document.cookie = cookie;
}

/**
 * Read cached user profile data from cookie (client-side).
 * @returns {{ name: string, avatar: string, roles: string[] } | null}
 */
export function getUserCache() {
  const raw = readCookie(USER_CACHE_COOKIE);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return { name: data.n || "", avatar: data.a || "", roles: data.r || [] };
  } catch {
    return null;
  }
}

/**
 * Get the "remember me" preference
 * @returns {boolean} true if user chose to stay logged in
 */
export function getRememberPreference() {
  const val = readCookie(REMEMBER_COOKIE);
  // Default to true if not set
  return val !== "0";
}

/**
 * Get Authorization header object for API calls
 * @returns {{ Authorization?: string }} Header object
 */
export function getAuthHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
