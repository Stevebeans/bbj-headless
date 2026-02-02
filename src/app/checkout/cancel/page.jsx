"use client";

import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-slate-100 dark:bg-gray-950 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 text-center">
          {/* Cancel Icon */}
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-3">
            Payment Cancelled
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-8">
            No worries! Your payment was cancelled and you haven't been charged. You can try again whenever you're ready.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/become-supporter"
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors"
            >
              Go Home
            </Link>
          </div>

          {/* Help */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-8">
            Having trouble?{" "}
            <Link href="/contact" className="text-primary-500 hover:underline">
              Contact us
            </Link>{" "}
            and we'll help you out.
          </p>
        </div>
      </div>
    </main>
  );
}
