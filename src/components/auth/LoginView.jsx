"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaGoogle } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

export default function LoginView() {
  const router = useRouter();
  const { login, loginWithGoogle, isAuthenticated, loading: authLoading } = useAuth();
  const { closeModal, switchToRegister, switchToForgotPassword, switchToLinkAccount, redirectPath } = useAuthModal();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      closeModal();
      if (redirectPath) {
        router.push(redirectPath);
      }
    }
  }, [isAuthenticated, authLoading, closeModal, redirectPath, router]);

  // Initialize Google Sign-In
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    console.log("[Google Auth] Client ID exists:", !!clientId);

    if (!clientId || typeof window === "undefined") {
      console.log("[Google Auth] Skipping - no client ID or not in browser");
      return;
    }

    const initGoogle = () => {
      console.log("[Google Auth] initGoogle called, google object:", !!window.google?.accounts?.id);

      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleResponse,
          auto_select: false,
        });

        const btnContainer = document.getElementById("google-signin-btn");
        console.log("[Google Auth] Button container found:", !!btnContainer);

        window.google.accounts.id.renderButton(
          btnContainer,
          {
            theme: "outline",
            size: "large",
            width: 320,
            text: "continue_with",
          }
        );
        console.log("[Google Auth] Button rendered");
      }
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      // Check if script already exists to prevent duplicates
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener("load", initGoogle);
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    }
  }, []);

  const handleGoogleResponse = async (response) => {
    if (!response.credential) return;

    setGoogleLoading(true);
    setError(null);

    try {
      const result = await loginWithGoogle(response.credential);
      if (result.needs_linking) {
        // No account found - switch to link account view
        switchToLinkAccount({
          credential: result.credential,
          google_user: result.google_user,
        });
      } else if (!result.success) {
        setError(result.error || "Google sign-in failed");
      }
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Google Sign-In Button */}
      <div>
        <div
          id="google-signin-btn"
          className="w-full flex justify-center"
        />
        {googleLoading && (
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
            Signing in with Google...
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">or</span>
        </div>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="login-username"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Username or Email
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your username or email"
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your password"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={switchToForgotPassword}
            className="text-sm text-primary-500 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      {/* Register Link */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        <p>
          Don&apos;t have an account?{" "}
          <button
            onClick={switchToRegister}
            className="text-primary-500 hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
