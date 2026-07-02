"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

export default function LinkAccountView() {
  const router = useRouter();
  const { linkGoogleAccount, createFromGoogle } = useAuth();
  const { closeModal, googleData, redirectPath } = useAuthModal();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Carry the checkbox state from the Google login flow; otherwise default
  // CHECKED (never seed from the stored pref — see LoginView.jsx).
  const [rememberMe, setRememberMe] = useState(() => googleData?.rememberMe ?? true);

  const handleLink = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await linkGoogleAccount(googleData.credential, username, password, rememberMe);
      if (result.success) {
        closeModal();
        if (redirectPath) {
          router.push(redirectPath);
        }
      } else {
        setError(result.error || "Failed to link account");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await createFromGoogle(googleData.credential, rememberMe);
      if (result.success) {
        closeModal();
        if (redirectPath) {
          router.push(redirectPath);
        }
      } else {
        setError(result.error || "Failed to create account");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!googleData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Google User Info */}
      <div className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        {googleData.google_user?.picture ? (
          <img
            src={googleData.google_user.picture}
            alt=""
            className="w-16 h-16 rounded-full mx-auto mb-2"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-16 h-16 rounded-full mx-auto mb-2 bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <span className="text-primary-600 dark:text-primary-400 font-bold text-2xl">
              {googleData.google_user?.name?.charAt(0) || googleData.google_user?.email?.charAt(0) || "G"}
            </span>
          </div>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Signing in as
        </p>
        <p className="font-medium text-slate-800 dark:text-white">
          {googleData.google_user?.name || googleData.google_user?.email}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {googleData.google_user?.email}
        </p>
      </div>

      {/* No Account Message */}
      <div className="text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          No BBJ account found with this email.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Link Existing Account */}
      <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
        <h3 className="font-medium text-slate-800 dark:text-white mb-3">
          Have an existing BBJ account?
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
          Enter your BBJ credentials to link your Google account:
        </p>

        <form onSubmit={handleLink} className="space-y-3">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or Email"
              autoComplete="username"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
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
            className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? "Linking..." : "Link Account"}
          </button>
        </form>
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

      {/* Create New Account */}
      <button
        onClick={handleCreateNew}
        disabled={loading}
        className="w-full py-2.5 border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Creating..." : "Continue as New User"}
      </button>

      {/* Note */}
      <p className="text-xs text-center text-slate-400 dark:text-slate-500">
        You can also link accounts later in your profile settings.
      </p>
    </div>
  );
}
