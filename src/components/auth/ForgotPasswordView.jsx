"use client";

import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useAuthModal } from "@/context/AuthModalContext";
import { forgotPassword } from "@/lib/api/auth";

export default function ForgotPasswordView() {
  const { switchToLogin } = useAuthModal();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
          Check Your Email
        </h3>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          If an account with that email exists, you&apos;ll receive a password reset link shortly.
        </p>
        <button
          onClick={switchToLogin}
          className="text-primary-500 hover:underline font-medium"
        >
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={switchToLogin}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      >
        <FaArrowLeft className="w-3 h-3" />
        Back to login
      </button>

      <p className="text-sm text-slate-600 dark:text-slate-400">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="forgot-email"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
          >
            Email Address
          </label>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
