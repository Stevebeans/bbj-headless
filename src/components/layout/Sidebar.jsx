"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { ParamountPlusCard } from "../sidebar/ParamountPlusCard";
import { StickyAdSlot } from "../sidebar/StickyAdSlot";

// Client Component - Sidebar with widgets
export function Sidebar({ showAds = true, sticky = true, children }) {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const { openLogin, openRegister } = useAuthModal();

  // Get display name - try different property names (user.name can be an object from WP)
  const rawName = user?.user_display_name || user?.display_name || (typeof user?.name === "string" ? user.name : null) || "User";
  const displayName = typeof rawName === "string" ? rawName : "User";
  const firstName = displayName.split(" ")[0];
  const avatar = user?.avatar || user?.user_avatar;

  return (
    <aside className={`w-full lg:w-80 flex-shrink-0 ${sticky ? "lg:self-start lg:sticky lg:top-28" : ""} space-y-4`} aria-label="Sidebar">
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
                  unoptimized
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

      {/* Paramount+ Promo Card */}
      <ParamountPlusCard />

      {/* Injected children (e.g. home page widgets) */}
      {children}

      {/* Sticky Rail Ad */}
      {showAds && <StickyAdSlot />}
    </aside>
  );
}
