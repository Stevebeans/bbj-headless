"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

const AuthContext = createContext(null);

// Storage keys
const TOKEN_KEY = "bbj_token";
const REMEMBER_KEY = "bbj_remember";

// Storage helper functions for "Keep me logged in" feature
function getToken() {
  if (typeof window === "undefined") return null;
  // Check localStorage first (remembered), then sessionStorage
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

function setToken(token, remember) {
  if (typeof window === "undefined") return;
  // Clear from both to avoid duplicates
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  // Set in appropriate storage
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  // Remember the preference for future logins
  localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
}

function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

function getRememberPreference() {
  if (typeof window === "undefined") return true;
  const pref = localStorage.getItem(REMEMBER_KEY);
  // Default to true if not set
  return pref !== "0";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from stored token on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = getToken();
      if (token) {
        try {
          const userData = await validateToken(token);
          setUser({
            ...userData,
            token,
            // Normalize avatar property name
            avatar: userData.user_avatar || userData.avatar,
          });
        } catch (err) {
          // Only clear token if it's definitively invalid (not network/timeout errors)
          // Network errors shouldn't log users out - they might just be offline
          const isAuthError = err.status === 401 || err.status === 403;
          const isNetworkError = err.isNetworkError || err.name === "AbortError" || err.message === "Failed to fetch";

          if (isAuthError && !isNetworkError) {
            clearToken();
            setUser(null);
          } else if (isNetworkError) {
            // For network errors, try to use cached user data from token
            // JWT tokens contain user info we can decode without server validation
            try {
              const payload = JSON.parse(atob(token.split(".")[1]));
              setUser({
                id: payload.data?.user?.id,
                user_id: payload.data?.user?.id,
                user_email: payload.data?.user?.email,
                user_display_name: payload.data?.user?.display_name || "User",
                token,
                _offline: true, // Flag that we're using cached data
              });
              console.warn("Using cached auth due to network error:", err.message);
            } catch {
              // Token is malformed, clear it
              clearToken();
              setUser(null);
            }
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Validate JWT token with WordPress
  const validateToken = async (token) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout (increased)

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
        // Create error with status so we can differentiate auth failures from other errors
        const error = new Error("Invalid token");
        error.status = response.status;
        throw error;
      }

      return response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      // Add context for network errors
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

      // Validate token BEFORE storing to prevent race condition
      const userData = await validateToken(data.token);

      // Store token in appropriate storage based on rememberMe preference
      setToken(data.token, rememberMe);

      setUser({
        ...userData,
        token: data.token,
        user_display_name: data.user_display_name,
        user_email: data.user_email,
      });

      return { success: true };
    } catch (err) {
      // Ensure no stale token remains on error
      clearToken();
      setError(err.message);
      return { success: false, error: err.message };
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

      // Check if account linking is needed
      if (data.needs_linking) {
        return {
          success: false,
          needs_linking: true,
          credential: credential,
          google_user: data.google_user,
          rememberMe: rememberMe,
        };
      }

      // Store token in appropriate storage based on rememberMe preference
      setToken(data.token, rememberMe);

      setUser({
        ...data.user,
        token: data.token,
        // Normalize property names to match email/password login
        user_display_name: data.user.display_name,
        user_email: data.user.email,
      });

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
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

      // Store token in appropriate storage based on rememberMe preference
      setToken(data.token, rememberMe);

      setUser({
        ...data.user,
        token: data.token,
        user_display_name: data.user.display_name,
        user_email: data.user.email,
      });

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
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

      // Store token in appropriate storage based on rememberMe preference
      setToken(data.token, rememberMe);

      setUser({
        ...data.user,
        token: data.token,
        user_display_name: data.user.display_name,
        user_email: data.user.email,
      });

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
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
      setUser((prev) => ({
        ...prev,
        ...userData,
        token,
        // Normalize avatar property name
        avatar: userData.user_avatar || userData.avatar,
      }));
    } catch (err) {
      console.error("Failed to refresh user:", err);
    }
  }, []);

  // Set user from registration/external auth response
  const setUserFromResponse = useCallback((data, rememberMe = true) => {
    if (data.token) {
      setToken(data.token, rememberMe);
    }
    setUser({
      ...data.user,
      token: data.token,
    });
  }, []);

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
