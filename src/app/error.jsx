"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { attemptStaleBuildHeal } from "@/lib/staleBuildHeal";

export default function Error({ error, reset }) {
  const [healing, setHealing] = useState(false);

  useEffect(() => {
    // Log the error to console in development
    console.error("Application error:", error);
    // Build-skew errors (stale tab / cached zombie page navigating into the
    // current deployment) are fixed by a hard reload — do it once instead of
    // showing the error page.
    if (attemptStaleBuildHeal(error)) setHealing(true);
  }, [error]);

  if (healing) {
    return (
      <main className="v2-primary-container">
        <div className="v2-primary-container-inner p-8 text-center">
          <p className="text-xl text-gray-600 dark:text-gray-300 font-osw animate-pulse">
            Refreshing the page…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="v2-primary-container">
      <div className="v2-primary-container-inner p-8 text-center">
        {/* Error Header */}
        <div className="mb-8">
          <h1 className="font-display text-6xl md:text-7xl text-red-500 mb-2">
            Oops!
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-osw">
            Something went wrong
          </p>
        </div>

        {/* Error Message */}
        <div className="max-w-md mx-auto mb-8">
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            We hit a snag loading this page. This has been logged and we&apos;ll look into it.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-primary-500 text-white rounded-full font-medium hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-400 dark:text-gray-500">
          If this keeps happening, please{" "}
          <Link href="/contact" className="text-primary-500 hover:underline">
            contact us
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
