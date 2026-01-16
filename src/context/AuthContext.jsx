"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user from stored token on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("bbj_token");
      if (token) {
        try {
          const userData = await validateToken(token);
          setUser({ ...userData, token });
        } catch (err) {
          // Token is invalid, clear it
          localStorage.removeItem("bbj_token");
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  // Validate JWT token with WordPress
  const validateToken = async (token) => {
    const response = await fetch(`${API_URL}/bbj/v3/validate-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Invalid token");
    }

    return response.json();
  };

  // Login with email/password
  const login = useCallback(async (username, password) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/jwt-auth/v1/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Validate token BEFORE storing to prevent race condition
      const userData = await validateToken(data.token);

      // Only store if validation succeeds
      localStorage.setItem("bbj_token", data.token);

      setUser({
        ...userData,
        token: data.token,
        user_display_name: data.user_display_name,
        user_email: data.user_email,
      });

      return { success: true };
    } catch (err) {
      // Ensure no stale token remains on error
      localStorage.removeItem("bbj_token");
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Login with Google
  const loginWithGoogle = useCallback(async (credential) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/bbjd/v1/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Google login failed");
      }

      // Store token
      localStorage.setItem("bbj_token", data.token);

      setUser({
        ...data.user,
        token: data.token,
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
    localStorage.removeItem("bbj_token");
    setUser(null);
    setError(null);
  }, []);

  // Set user from registration/external auth response
  const setUserFromResponse = useCallback((data) => {
    if (data.token) {
      localStorage.setItem("bbj_token", data.token);
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
    logout,
    setUserFromResponse,
    getAuthHeader,
    hasRole,
    hasAnyRole,
    isAdmin,
    isAuthenticated: !!user,
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
