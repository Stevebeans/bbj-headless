"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  getToken,
  setToken,
  clearToken,
  getRememberPreference,
  setUserCache,
  getUserCache,
  cookiesWritable,
  getSessionHint,
  clearSessionHint,
} from "@/lib/auth/cookies";
import { isTokenExpired, decodeUserFromToken, normalizeRoles } from "@/lib/auth/token";
import { maybeRefreshToken, forceRefreshToken } from "@/lib/auth/refresh";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Enhance generic fetch errors with debugging context.
 * "Failed to fetch" tells us nothing — this adds the URL, error type, and hints.
 */
function describeError(err, endpoint) {
  const url = `${API_URL}${endpoint}`;

  if (err.name === "AbortError") {
    return `Request timed out reaching ${url}`;
  }

  if (err.message === "Failed to fetch" || err.message === "NetworkError when attempting to fetch resource.") {
    return `Network error: Could not reach ${url}. This is usually a CORS, SSL, or connectivity issue. Check browser console for details.`;
  }

  // If it has an HTTP status, include it
  if (err.status) {
    return `HTTP ${err.status} from ${url}: ${err.message}`;
  }

  return `${err.message} (endpoint: ${url})`;
}

const AuthContext = createContext(null);

/**
 * One-time migration from localStorage/sessionStorage to cookies.
 * Ensures existing logged-in users don't get logged out.
 */
function migrateFromStorage() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("bbj_auth_migrated")) return;

  const token =
    localStorage.getItem("bbj_token") || sessionStorage.getItem("bbj_token");

  if (token) {
    // Always migrate as remembered. Migrating sessionStorage-era tokens as
    // "not remembered" branded those users bbj_remember=0 — a sticky opt-out
    // they never chose (see the always-checked default in LoginView.jsx).
    setToken(token, true);

    // Clean up old storage
    localStorage.removeItem("bbj_token");
    sessionStorage.removeItem("bbj_token");
    localStorage.removeItem("bbj_remember");
  }

  localStorage.setItem("bbj_auth_migrated", "1");
}

export function AuthProvider({ children }) {
  // Always start anonymous. Client-side hydration runs in useEffect below.
  // Header components use `loading` to show a skeleton during the brief
  // ~20-80ms window before hydration completes — no "Login → Welcome" flash.
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // True when a login succeeded but the browser refused to store the cookie
  // (security suites, per-site blocks). The session works in-memory but dies
  // on the next page load — surface a banner so members can fix their side.
  const [cookiesBlocked, setCookiesBlocked] = useState(false);
  const didHydrate = useRef(false);

  // After any setToken(), confirm the cookie actually persisted.
  const checkCookiePersistence = useCallback(() => {
    setCookiesBlocked(!getToken() || !cookiesWritable());
  }, []);

  // Update user state and cache profile (cache is read back on next mount)
  const setUserAndCache = useCallback((userData) => {
    if (userData) {
      // Normalize roles before storing - PHP can send objects instead of arrays
      userData = { ...userData, user_roles: normalizeRoles(userData.user_roles) };
      // Ensure display name is always a string (WP can return objects)
      const displayName = userData.user_display_name || userData.display_name || "";
      userData.user_display_name = typeof displayName === "string" ? displayName : String(displayName?.name || displayName || "");
      const avatar = userData.user_avatar || userData.avatar;
      setUserCache({
        name: userData.user_display_name,
        avatar: avatar || "",
        roles: userData.user_roles,
      });
    }
    setUser(userData);
  }, []);

  // On mount: hydrate auth state purely from client-side cookies.
  // Two cookie sources combined for a complete picture:
  //   1. bbj_token   — JWT with id/email/display_name/roles (authoritative)
  //   2. bbj_user    — cached profile blob with name/avatar/roles (has avatar)
  //
  // This replaces the old SSR-based getInitialAuthState() approach, which
  // called cookies() in the root layout and opted every page into dynamic
  // rendering (see memory/project_vercel_cost_incident.md).
  useEffect(() => {
    migrateFromStorage();

    if (didHydrate.current) return;
    didHydrate.current = true;

    // True when hydration had the bbj_user profile-cache cookie available.
    // Cookie cleaners (ESET etc.) wipe it together with the JS token; after an
    // anchor recovery the member is logged in but has no avatar until the next
    // real login — unless we re-fetch the profile (see refreshUser calls below).
    let hadProfileCache = false;
    // True when that cache is older than the TTL. Without this, a profile
    // change made on another device (new avatar, name, role grant) never
    // reaches this one — the cache was only rebuilt when missing entirely.
    let profileCacheStale = false;
    const PROFILE_CACHE_TTL_MS = 15 * 60 * 1000;

    // Decode a token into user state (+ cache enrichment). False = unusable.
    const applyToken = (token) => {
      if (isTokenExpired(token)) return false;
      const jwtData = decodeUserFromToken(token);
      if (!jwtData) return false;

      // Enrich with cached profile data (avatar, possibly more recent name/roles)
      const cache = getUserCache();
      hadProfileCache = !!cache;
      if (cache) {
        profileCacheStale = Date.now() - (cache.cachedAt || 0) > PROFILE_CACHE_TTL_MS;
        if (cache.avatar) jwtData.avatar = cache.avatar;
        if (cache.name) jwtData.user_display_name = cache.name;
        if (Array.isArray(cache.roles) && cache.roles.length > 0) {
          jwtData.user_roles = normalizeRoles(cache.roles);
        }
      }

      setUserAndCache(jwtData);
      return true;
    };

    const token = getToken();

    if (token) {
      if (!applyToken(token)) {
        // JWT is malformed or expired — clear and bail out
        clearToken();
        setUser(null);
      } else {
        // Sliding refresh: if the token is past ~half its life, re-mint it now
        // (and re-arm the cookie / reset Safari's ITP clock). Non-blocking.
        maybeRefreshToken();
        // Cache cookie wiped but token survived: repaint avatar + rebuild cache.
        // Also refresh when the cache is stale so avatar/name/role changes made
        // on another device propagate here within the TTL (non-blocking).
        if (!hadProfileCache || profileCacheStale) refreshUser();
      }
      setLoading(false);
      return;
    }

    // No JS token. If the server hinted that an HttpOnly anchor exists
    // (bbj_session_hint), recover silently: one credentialed refresh re-mints
    // the working token. Anonymous visitors have no hint → zero extra calls.
    if (getSessionHint()) {
      forceRefreshToken().then((result) => {
        const recovered = typeof result === "string" && applyToken(result);
        if (recovered && (!hadProfileCache || profileCacheStale)) {
          // Recovered session has no avatar (JWT carries none, cache was wiped
          // with the JS token) — one background /auth/me repaints it.
          refreshUser();
        }
        if (!recovered) {
          // Definitive rejection (or a token that won't decode) = the anchor
          // is dead: drop the hint so we don't retry every pageview. A network
          // blip (null) keeps the hint — recovery stays armed for next load.
          if (result !== null) clearSessionHint();
          setUser(null);
        }
        setLoading(false);
      });
      return;
    }

    setUser(null);
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch current user data from WordPress (used after login and for refresh)
  const fetchCurrentUser = async (token) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_URL}/bbjd/v1/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error("Invalid token");
        error.status = response.status;
        throw error;
      }

      return response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        const error = new Error("Request timeout");
        error.isNetworkError = true;
        throw error;
      }
      if (!err.status) {
        err.isNetworkError = true;
      }
      throw err;
    }
  };

  // Login with email/password
  const login = useCallback(async (username, password, rememberMe = true) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/jwt-auth/v1/token`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, remember_me: rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      setToken(data.token, rememberMe);
      checkCookiePersistence();

      const userData = await fetchCurrentUser(data.token);

      setUserAndCache({
        ...userData,
        token: data.token,
      });

      return { success: true };
    } catch (err) {
      clearToken();
      const msg = describeError(err, "/jwt-auth/v1/token");
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Login with Google
  const loginWithGoogle = useCallback(async (credential, rememberMe = true) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/bbjd/v1/auth/google`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential, remember_me: rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google login failed");
      }

      if (data.needs_linking) {
        return {
          success: false,
          needs_linking: true,
          credential: credential,
          google_user: data.google_user,
          rememberMe: rememberMe,
        };
      }

      setToken(data.token, rememberMe);
      checkCookiePersistence();

      setUserAndCache({
        ...data.user,
        token: data.token,
        user_display_name: data.user.display_name,
        user_email: data.user.email,
        user_roles: normalizeRoles(data.user.roles),
        avatar: data.user.avatar,
      });

      return { success: true };
    } catch (err) {
      const msg = describeError(err, "/bbjd/v1/auth/google");
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Link Google account to existing BBJ account
  const linkGoogleAccount = useCallback(async (credential, username, password, rememberMe = true) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/bbjd/v1/auth/link-google`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential, username, password, remember_me: rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to link account");
      }

      setToken(data.token, rememberMe);
      checkCookiePersistence();

      setUserAndCache({
        ...data.user,
        token: data.token,
        user_display_name: data.user.display_name,
        user_email: data.user.email,
        user_roles: normalizeRoles(data.user.roles),
        avatar: data.user.avatar,
      });

      return { success: true };
    } catch (err) {
      const msg = describeError(err, "/bbjd/v1/auth/link-google");
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new BBJ account from Google
  const createFromGoogle = useCallback(async (credential, rememberMe = true) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/bbjd/v1/auth/create-from-google`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential, remember_me: rememberMe }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create account");
      }

      setToken(data.token, rememberMe);
      checkCookiePersistence();

      setUserAndCache({
        ...data.user,
        token: data.token,
        user_display_name: data.user.display_name,
        user_email: data.user.email,
        user_roles: normalizeRoles(data.user.roles),
        avatar: data.user.avatar,
      });

      return { success: true };
    } catch (err) {
      const msg = describeError(err, "/bbjd/v1/auth/create-from-google");
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    // Clear the server-set HttpOnly anchor (JS can't). Fire-and-forget:
    // local logout must not wait on the network.
    fetch(`${API_URL}/bbjd/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
    clearToken();
    setUser(null);
    setError(null);
  }, []);

  // Refresh user data (call after profile/avatar updates)
  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) return;

    try {
      const userData = await fetchCurrentUser(token);
      const avatar = userData.user_avatar || userData.avatar;
      setUser((prev) => ({
        ...prev,
        ...userData,
        token,
        avatar,
      }));
      setUserCache({
        name: userData.user_display_name || userData.display_name || "",
        avatar: avatar || "",
        roles: userData.user_roles || [],
      });
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, []);

  // Set user from registration/external auth response
  const setUserFromResponse = useCallback((data, rememberMe = true) => {
    if (data.token) {
      setToken(data.token, rememberMe);
      checkCookiePersistence();
    }
    setUserAndCache({
      ...data.user,
      token: data.token,
      user_roles: normalizeRoles(data.user?.roles || data.user?.user_roles),
      avatar: data.user?.avatar,
    });
  }, [setUserAndCache]);

  // Get auth header for API calls
  const getAuthHeader = useCallback(() => {
    if (user?.token) {
      return { Authorization: `Bearer ${user.token}` };
    }
    return {};
  }, [user]);

  // Check if user has a specific role
  const hasRole = useCallback(
    (role) => {
      if (!Array.isArray(user?.user_roles)) return false;
      return user.user_roles.includes(role);
    },
    [user]
  );

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback(
    (roles) => {
      if (!Array.isArray(user?.user_roles)) return false;
      return roles.some((role) => user.user_roles.includes(role));
    },
    [user]
  );

  // Check if user is admin
  const isAdmin = useCallback(() => {
    return hasRole("administrator");
  }, [hasRole]);

  const value = {
    user,
    loading,
    error,
    login,
    loginWithGoogle,
    linkGoogleAccount,
    createFromGoogle,
    logout,
    refreshUser,
    setUserFromResponse,
    getAuthHeader,
    hasRole,
    hasAnyRole,
    isAdmin,
    isAuthenticated: !!user,
    getRememberPreference,
    cookiesBlocked,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
