"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loginWithGoogle, isAuthenticated, loading: authLoading, error: authError } = useAuth();
  const { openLinkAccount } = useAuthModal();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleFailed, setGoogleFailed] = useState(false);
  const googleReadyRef = useRef(false);
  // Always default CHECKED — see LoginView.jsx: seeding from the stored
  // pref silently kept the box unchecked for previously-branded users.
  const [rememberMe, setRememberMe] = useState(true);

  const redirect = searchParams.get("redirect") || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.push(redirect);
    }
  }, [isAuthenticated, authLoading, router, redirect]);

  // Initialize Google Sign-In (mirrors the modal's LoginView.jsx pattern:
  // script-load guard, render into the container, visible-failure fallback).
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || typeof window === "undefined") return;

    let failTimer;
    const markFailed = () => setGoogleFailed(true);

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
      });

      const btnContainer = document.getElementById("google-signin-btn");
      if (!btnContainer) return;

      window.google.accounts.id.renderButton(btnContainer, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
      });

      // Success — cancel the failure fallback.
      googleReadyRef.current = true;
      setGoogleFailed(false);
      if (failTimer) clearTimeout(failTimer);
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        existingScript.addEventListener("load", initGoogle);
        existingScript.addEventListener("error", markFailed);
      } else {
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

    // Backstop: if the button still hasn't rendered after 6s, surface the note.
    failTimer = setTimeout(() => {
      if (!googleReadyRef.current) setGoogleFailed(true);
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
        // No account matched this Google email — open the modal's link-account
        // flow (AuthModal is mounted globally in Providers), carrying redirect.
        openLinkAccount(
          {
            credential: result.credential,
            google_user: result.google_user,
            rememberMe: rememberMe,
          },
          redirect,
        );
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
      if (result.success) {
        router.push(redirect);
      } else {
        setError(result.error || "Login failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto" />
        <p className="mt-4 text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h1 className="font-display text-3xl text-primary-500 dark:text-primary-400 text-center mb-6">
        Log In
      </h1>

      {(error || authError) && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error || authError}
        </div>
      )}

      {/* Google Sign-In Button */}
      <div className="mb-4">
        <div id="google-signin-btn" className="w-full flex justify-center" />
        {googleLoading && (
          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500" />
            Signing in with Google...
          </div>
        )}
        {googleFailed && !googleLoading && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Google sign-in didn&apos;t load.</p>
            <p className="mt-1">
              This is almost always your network or browser blocking Google, not your account. You can
              still log in with your username &amp; password below, or try another network (like your phone).
            </p>
            <p className="mt-1 text-amber-700 dark:text-amber-400">
              On a work computer? Ask your IT/admin to allow{" "}
              <span className="font-mono">accounts.google.com</span>. Error code{" "}
              <span className="font-mono font-semibold">GSI-BLOCKED</span>.
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative mb-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Username or Email
          </label>
          <input
            id="username"
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
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your password"
          />
        </div>

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
          type="submit"
          disabled={loading || !username || !password}
          className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>
          Don't have an account?{" "}
          <Link href="/register" className="text-primary-500 hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      {redirect !== "/" && (
        <p className="mt-4 text-center text-xs text-slate-400">
          You'll be redirected to: {redirect}
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <Suspense
        fallback={
          <div className="card p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto" />
            <p className="mt-4 text-slate-500">Loading...</p>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
