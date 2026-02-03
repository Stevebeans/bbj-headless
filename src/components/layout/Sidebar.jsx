"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { ClientAdPlaceholder } from "../ads/ClientAdPlaceholder";

// Client Component - Sidebar with widgets
export function Sidebar({ showAds = true, sticky = true, children }) {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { openLogin, openRegister } = useAuthModal();

  // Get display name - try different property names
  const displayName = user?.user_display_name || user?.display_name || user?.name || "User";
  const firstName = displayName.split(" ")[0];
  const avatar = user?.avatar || user?.user_avatar;

  return (
    <aside className={`w-full lg:w-80 flex-shrink-0 lg:self-start ${sticky ? "lg:sticky lg:top-28" : ""} space-y-4`} aria-label="Sidebar">
      {/* User Welcome Widget */}
      <div className="v2-sidebar-container p-4">
        {loading ? (
          // Loading skeleton
          <div className="animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3" />
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        ) : isAuthenticated ? (
          // Logged in state
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {avatar ? (
                <Image
                  src={avatar}
                  alt={displayName}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold text-lg">
                  {firstName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Name & Links */}
            <div className="flex-grow min-w-0">
              <p className="font-display text-lg text-primary-500 dark:text-primary-400 truncate">
                Hi, {firstName}!
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Link
                  href="/settings"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
                >
                  Settings
                </Link>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={logout}
                  className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Logged out state
          <>
            <h2 className="font-display text-lg text-primary-500 dark:text-primary-400">
              Join the Community
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Sign in to join the discussion and access exclusive features.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => openLogin()}
                className="bbj-btn text-sm flex-1 text-center"
              >
                Login
              </button>
              <button
                onClick={() => openRegister()}
                className="v2-btn text-sm flex-1 text-center"
              >
                Sign Up
              </button>
            </div>
          </>
        )}
      </div>

      {/* Ad Placeholder - Top */}
      {showAds && <ClientAdPlaceholder slot="sidebar_top" minHeight="250px" />}

      {/* Injected children (e.g. home page widgets) */}
      {children}

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
      {showAds && <ClientAdPlaceholder slot="sidebar_bottom" minHeight="250px" />}
    </aside>
  );
}
