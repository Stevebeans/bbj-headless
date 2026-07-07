"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api/auth";
import { useAuthModal } from "@/context/AuthModalContext";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { openLogin } = useAuthModal();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const key = searchParams.get("key");
  const login = searchParams.get("login");

  // Check if we have the required params
  const hasRequiredParams = key && login;

  // Validate password on change
  useEffect(() => {
    if (password && password.length < 8) {
      setValidationError("Password must be at least 8 characters");
    } else if (confirmPassword && password !== confirmPassword) {
      setValidationError("Passwords do not match");
    } else {
      setValidationError(null);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate before submitting
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(key, login, password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    openLogin();
  };

  // Missing required params
  if (!hasRequiredParams) {
    return (
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Invalid Reset Link
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          This password reset link appears to be invalid or incomplete. Please request a new password reset.
        </p>
        <button
          onClick={handleLoginClick}
          className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          Back to Login
        </button>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          Password Reset Successful
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Your password has been reset successfully. You can now log in with your new password.
        </p>
        <button
          onClick={handleLoginClick}
          className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  // Reset form
  return (
    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">
          Reset Your Password
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
          Enter your new password below
        </p>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Minimum 8 characters"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Re-enter your password"
          />
        </div>

        {validationError && (
          <p className="text-red-500 dark:text-red-400 text-sm">
            {validationError}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword || !!validationError}
          className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto mb-2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto mb-6" />
        <div className="space-y-4">
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
