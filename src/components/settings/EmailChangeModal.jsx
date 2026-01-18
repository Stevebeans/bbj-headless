"use client";

import { useState } from "react";
import { requestEmailChange } from "@/lib/api/settings";

/**
 * Modal for changing email address with verification
 */
export default function EmailChangeModal({ currentEmail, isOpen, onClose }) {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!newEmail || !newEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (newEmail.toLowerCase() === currentEmail?.toLowerCase()) {
      setError("New email must be different from current email");
      return;
    }

    setLoading(true);

    try {
      await requestEmailChange(newEmail);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewEmail("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full p-6">
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          // Success state
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Verification Email Sent
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              We&apos;ve sent a verification link to <strong>{newEmail}</strong>.
              Click the link in the email to confirm your new address.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Got it
            </button>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Change Email Address
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              We&apos;ll send a verification link to your new email address. Your email won&apos;t change until you click the link.
            </p>

            {/* Current email (read-only) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Current Email
              </label>
              <input
                type="email"
                value={currentEmail || ""}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-500 dark:text-gray-400"
              />
            </div>

            {/* New email */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                New Email
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setError(null);
                }}
                placeholder="Enter new email address"
                className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  error ? "border-red-500" : "border-slate-200 dark:border-slate-700"
                }`}
                disabled={loading}
                autoFocus
              />
              {error && (
                <p className="mt-1.5 text-sm text-red-500">{error}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !newEmail}
                className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  "Send Verification"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
