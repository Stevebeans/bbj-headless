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
    setUser(userData);
    if (userData) {
      const avatar = userData.user_avatar || userData.avatar;
      setUserCache({
        name: userData.user_display_name || userData.display_name || "",
        avatar: avatar || "",
      });
    }
  }, []);

  // On mount: migrate old storage, then validate token in background
  useEffect(() => {
    migrateFromStorage();

    // Prevent double-validation in React strict mode
    if (didValidate.current) return;
    didValidate.current = true;

    const loadUser = async () => {
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

      try {
        const userData = await validateToken(token);
        setUserAndCache({
          ...userData,
          token,
          avatar: userData.user_avatar || userData.avatar,
        });
      } catch (err) {
        const isAuthError = err.status === 401 || err.status === 403;
        const isNetworkError =
          err.isNetworkError ||
          err.name === "AbortError" ||
          err.message === "Failed to fetch";

        if (isAuthError && !isNetworkError) {
          clearToken();
          setUser(null);
        } else if (isNetworkError) {
          // Use cached data from token (or keep initialUser if we have it)
          if (!initialUser) {
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              setUser({
                id: payload.data?.user?.id,
                user_id: payload.data?.user?.id,
                user_email: payload.data?.user?.email,
                user_display_name: payload.data?.user?.display_name || "User",
                token,
                _offline: true,
              });
            } catch {
              clearToken();
              setUser(null);
            }
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate JWT token with WordPress
  const validateToken = async (token) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${API_URL}/bbj/v3/validate-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
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

      const userData = await validateToken(data.token);

      setToken(data.token, rememberMe);

      setUserAndCache({
        ...userData,
        token: data.token,
        user_display_name: data.user_display_name,
        user_email: data.user_email,
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
      const userData = await validateToken(token);
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
      if (!user?.user_roles) return false;
      return user.user_roles.includes(role);
    },
    [user]
  );

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback(
    (roles) => {
      if (!user?.user_roles) return false;
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
