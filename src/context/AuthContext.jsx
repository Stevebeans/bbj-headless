"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import {
  getToken,
  setToken,
  clearToken,
  getRememberPreference,
  setUserCache,
} from "@/lib/auth/cookies";

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
 * Normalize user_roles from any format into a proper array.
 * PHP json_encode turns non-sequential arrays into objects,
 * so roles like {0:"administrator",2:"beta_tester"} need conversion.
 */
function normalizeRoles(roles) {
  if (Array.isArray(roles)) return roles;
  if (roles && typeof roles === "object") return Object.values(roles);
  return [];
}

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
    const wasRemembered = localStorage.getItem("bbj_token") !== null;
    setToken(token, wasRemembered);

    // Clean up old storage
    localStorage.removeItem("bbj_token");
    sessionStorage.removeItem("bbj_token");
    localStorage.removeItem("bbj_remember");
  }

  localStorage.setItem("bbj_auth_migrated", "1");
}

export function AuthProvider({ children, initialUser = null }) {
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(!initialUser);
  const [error, setError] = useState(null);
  const didValidate = useRef(false);

  // Update user state and cache profile for SSR
  const setUserAndCache = useCallback((userData) => {
    if (userData) {
      // Normalize roles before storing - PHP can send objects instead of arrays
      userData = { ...userData, user_roles: normalizeRoles(userData.user_roles) };
      const avatar = userData.user_avatar || userData.avatar;
      setUserCache({
        name: userData.user_display_name || userData.display_name || "",
        avatar: avatar || "",
        roles: userData.user_roles,
      });
    }
    setUser(userData);
  }, []);

  // On mount: migrate old storage, then reconcile token state.
  // We trust the SSR-decoded initialUser for rendering — no server
  // round-trip needed. The token is validated by WordPress automatically
  // on every authenticated API call via the Bearer header.
  useEffect(() => {
    migrateFromStorage();

    if (didValidate.current) return;
    didValidate.current = true;

    const token = getToken();

    if (!token) {
      // No cookie — if we had an initialUser from SSR, the token may have
      // been cleared by middleware (expired). Reset to logged-out.
      if (initialUser) {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    // If SSR already gave us user data, trust it — just ensure the token is attached
    if (initialUser) {
      setUserAndCache({
        ...initialUser,
        token,
        avatar: initialUser.avatar || initialUser.user_avatar,
      });
      setLoading(false);
      return;
    }

    // No initialUser but we have a token (edge case: cookie set after SSR).
    // Decode the JWT client-side to get basic user data.
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserAndCache({
        id: payload.data?.user?.id,
        user_id: payload.data?.user?.id,
        user_email: payload.data?.user?.email,
        user_display_name: payload.data?.user?.display_name || "User",
        user_roles: normalizeRoles(payload.data?.user?.roles),
        token,
      });
    } catch {
      clearToken();
      setUser(null);
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch current user data from WordPress (used after login and for refresh)
  const fetchCurrentUser = async (token) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_URL}/bbjd/v1/auth/me`, {
        method: "GET",
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

      setUserAndCache({
        ...data.user,
        token: data.token,
        user_display_name: data.user.display_name,
        user_email: data.user.email,
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

      setUserAndCache({
        ...data.user,
        token: data.token,
        user_display_name: data.user.display_name,
        user_email: data.user.email,
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

      setUserAndCache({
        ...data.user,
        token: data.token,
        user_display_name: data.user.display_name,
        user_email: data.user.email,
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
    }
    setUserAndCache({
      ...data.user,
      token: data.token,
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
