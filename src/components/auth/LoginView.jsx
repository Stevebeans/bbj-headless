"use client";

import { useState, useEffect, useRef } from "react";
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
  const [googleFailed, setGoogleFailed] = useState(false);
  const googleReadyRef = useRef(false);
  // Always default CHECKED. Seeding this from the stored bbj_remember pref
  // created a trap: one unchecked login (or the old sessionStorage migration)
  // branded the pref "0", every future form silently came up unchecked, and
  // re-logging re-branded it — "logged out every browser restart" forever.
  const [rememberMe, setRememberMe] = useState(true);

  // Close modal if user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      closeModal();
      if (redirectPath) {
        router.push(redirectPath);
      }
    }
  }, [isAuthenticated, authLoading, closeModal, redirectPath, router]);

  // Initialize Google Sign-In (with visible-failure detection for blocked networks)
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    console.log("[Google Auth] Client ID exists:", !!clientId);

    if (!clientId || typeof window === "undefined") {
      console.log("[Google Auth] Skipping - no client ID or not in browser");
      return;
    }

    let failTimer;
    const markFailed = () => setGoogleFailed(true);

    const initGoogle = () => {
      console.log("[Google Auth] initGoogle called, google object:", !!window.google?.accounts?.id);

      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
      });

      const btnContainer = document.getElementById("google-signin-btn");
      console.log("[Google Auth] Button container found:", !!btnContainer);
      if (!btnContainer) return;

      window.google.accounts.id.renderButton(btnContainer, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });
      console.log("[Google Auth] Button rendered");

      // Success — cancel the failure fallback.
      googleReadyRef.current = true;
      setGoogleFailed(false);
      if (failTimer) clearTimeout(failTimer);
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      // Check if script already exists to prevent duplicates
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener("load", initGoogle);
        existingScript.addEventListener("error", markFailed);
      } else {
        // Load Google Identity Services script
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = initGoogle;
        // Fires when the script is blocked / fails to load (firewall, ad-blocker, offline).
        script.onerror = markFailed;
        document.body.appendChild(script);
      }
    }

    // Backstop: if the button still hasn't rendered after 6s (slow or silently blocked),
    // surface the note so the user isn't staring at a phantom "or".
    failTimer = setTimeout(() => {
      if (!googleReadyRef.current) {
        console.log("[Google Auth] Button did not render within timeout — showing fallback note");
        setGoogleFailed(true);
      }
    }, 6000);

    return () => {
      if (failTimer) clearTimeout(failTimer);
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    if (!response.credential) return;

    setGoogleLoading(true);
    setError(null);

    try {
      const result = await loginWithGoogle(response.credential, rememberMe);
      if (result.needs_linking) {
        // No account found - switch to link account view, pass rememberMe preference
        switchToLinkAccount({
          credential: result.credential,
          google_user: result.google_user,
          rememberMe: rememberMe,
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
      const result = await login(username, password, rememberMe);
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
        {googleFailed && !googleLoading && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Google sign-in didn’t load.</p>
            <p className="mt-1">
              This is almost always your network or browser blocking Google — not your account. You can
              still log in with your username &amp; password below, or try another network (like your phone).
            </p>
            <p className="mt-1 text-amber-700 dark:text-amber-400">
              On a work computer? Ask your IT/admin to allow{" "}
              <span className="font-mono">accounts.google.com</span> — error code{" "}
              <span className="font-mono font-semibold">GSI-BLOCKED</span>.
            </p>
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500 bg-white dark:bg-slate-700"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              Keep me logged in
            </span>
          </label>
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
