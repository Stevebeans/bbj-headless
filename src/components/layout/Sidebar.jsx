import Link from "next/link";
import { AdPlaceholder } from "../ads/AdPlaceholder";

// Server Component - Sidebar with widgets
export function Sidebar({ user = null }) {
  return (
    <aside className="w-full lg:w-80 flex-shrink-0 lg:self-start lg:sticky lg:top-28 space-y-4" aria-label="Sidebar">
      {/* User Welcome Widget */}
      <div className="v2-sidebar-container p-4">
        {user ? (
          <>
            <h2 className="font-display text-lg text-primary-500 dark:text-primary-400">
              Welcome, {user.displayName}!
            </h2>
            <div className="flex gap-2 mt-3">
              <Link href="/user-dashboard" className="bbj-btn text-sm flex-1 text-center">
                Settings
              </Link>
              <Link href="/logout" className="v2-btn text-sm flex-1 text-center">
                Log Out
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="font-display text-lg text-primary-500 dark:text-primary-400">
              Welcome, Visitor!
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Sign in to join the discussion and access exclusive features.
            </p>
            <div className="flex gap-2 mt-3">
              <Link href="/login" className="bbj-btn text-sm flex-1 text-center">
                Login
              </Link>
              <Link href="/register" className="v2-btn text-sm flex-1 text-center">
                Sign Up
              </Link>
            </div>
          </>
        )}
      </div>

      {/* Ad Placeholder - Top */}
      <AdPlaceholder slot="sidebar_top" minHeight="250px" />

      {/* Newsletter Signup Placeholder */}
      <div className="v2-sidebar-container p-4">
        <h3 className="v2-ad-subheader">Newsletter</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Get the latest Big Brother updates delivered to your inbox!
        </p>
        <form className="space-y-2" action="#">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="submit"
            className="w-full v2-btn text-sm"
          >
            Subscribe
          </button>
        </form>
      </div>

      {/* Hot Posts Placeholder */}
      <div className="v2-sidebar-container p-4">
        <h3 className="v2-ad-subheader">Hot Posts</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          Popular posts coming soon
        </p>
      </div>

      {/* Ad Placeholder - Bottom */}
      <AdPlaceholder slot="sidebar_bottom" minHeight="250px" />
    </aside>
  );
}
