"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MobileMenuWrapper } from "./MobileMenu";
import { SearchBar, MobileSearchButton } from "../search/SearchBar";
import { MobileSearchModal } from "../search/MobileSearchModal";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import NotificationBell from "../notifications/NotificationBell";
import { usePermissions } from "@/hooks/usePermissions";
import { useBbTime } from "@/hooks/useBbTime";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

// Roles that get supporter benefits (should match WordPress settings)
const SUPPORTER_ROLES = ["administrator", "editor", "supporter", "lifetime"];

const LOGO_URL = "https://bigbrotherjunkies.com/wp-content/themes/BBJ/images/bbjlogo2020.png";
const MOBILE_LOGO_URL = "/images/bbj-logo-sm.png";

export function Header({ liveThread = null }) {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, loading } = useAuth();
  const { openLogin, openRegister } = useAuthModal();
  const { hasPermission } = usePermissions();

  // Check if user has a supporter role
  const isSupporter = isAuthenticated && Array.isArray(user?.user_roles) && user.user_roles.some(role => SUPPORTER_ROLES.includes(role));

  const bbTime = useBbTime();

  return (
    <header className="sticky top-0 z-50">
      <nav aria-label="Main navigation">
        {/* Top utility bar */}
        <div className="bg-white dark:bg-gray-900">
          <div className="flex max-w-screen-xl justify-between mx-auto px-2 py-1 text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
            {/* Left side - links and socials */}
            <div className="text-xs flex items-center gap-1">
              <Link href="/contact" className="hidden md:inline hover:text-primary-500">
                Contact
              </Link>
              <span className="hidden md:inline">|</span>
              <Link href="/privacy-policy" className="hidden md:inline hover:text-primary-500">
                Privacy
              </Link>
              <span className="hidden md:inline">|</span>
              <span>Follow:</span>
              <a href="https://www.facebook.com/bigbrotherjunkies" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 ml-1" aria-label="Facebook">
                <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/bigbrotherjunky/" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 ml-1" aria-label="Instagram">
                <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            </div>

            {/* Right side - BB Time (data-nosnippet prevents Google from indexing this as article timestamp) */}
            <div className="text-xs" data-nosnippet>
              <span className="hidden md:inline">Current BB Time: </span>
              <span className="md:hidden">BB Time: </span>
              <time suppressHydrationWarning>{bbTime}</time>
            </div>
          </div>
        </div>

        {/* Tier 1: Main Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700 border-t border-t-slate-100 dark:border-t-slate-800">
          <div className="max-w-screen-xl mx-auto px-2 py-2 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="shrink-0 block" aria-label="Big Brother Junkies - Home">
              {/* Mobile logo - compact */}
              <Image src={MOBILE_LOGO_URL} alt="Big Brother Junkies" width={40} height={40} className="md:hidden h-10 w-auto" priority unoptimized />
              {/* Desktop logo - full */}
              <Image src={LOGO_URL} alt="Big Brother Junkies" width={395} height={37} className="hidden md:block h-[37px] w-auto" priority />
            </Link>

            {/* Search bar - desktop only */}
            <SearchBar className="hidden lg:block grow mx-8 max-w-md" />

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Mobile search button */}
              <MobileSearchButton onClick={() => setIsMobileSearchOpen(true)} />

              {loading && !isAuthenticated ? (
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700" />
              ) : isAuthenticated ? (
                <div className="flex items-center gap-1">
                  {isAdmin() && (
                    <Link href="/admin" className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors" aria-label="Admin Dashboard" title="Admin Dashboard">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </Link>
                  )}
                  {(hasPermission("blog_writing") || hasPermission("blog_publishing") || hasPermission("blog_review")) && (
                    <Link href="/editor/new" className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors hidden md:block" title="New Post">
                      <PencilSquareIcon className="w-5 h-5" />
                    </Link>
                  )}
                  <NotificationBell />
                  <Link href="/settings" className="flex items-center" aria-label="Account Settings">
                    {user?.avatar ? (
                      <Image src={user.avatar} alt={user?.user_display_name || user?.display_name || "User"} width={28} height={28} className="w-7 h-7 rounded-full object-cover ring-2 ring-transparent hover:ring-primary-300 transition-all" unoptimized />
                    ) : (
                      <div className="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center ring-2 ring-transparent hover:ring-primary-300 transition-all">
                        <span className="text-primary-600 dark:text-primary-400 font-bold text-xs">{user?.user_display_name?.charAt(0) || user?.display_name?.charAt(0) || "?"}</span>
                      </div>
                    )}
                  </Link>
                </div>
              ) : (
                <button onClick={() => openLogin()} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500" aria-label="Log In">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="hidden md:inline">Log In</span>
                </button>
              )}

              <MobileMenuWrapper onSearchOpen={() => setIsMobileSearchOpen(true)} />
            </div>
          </div>
        </div>

        {/* Tier 2: Nav Bar */}
        <div className="bg-primary-500">
          <div className="max-w-screen-xl mx-auto px-2 py-1.5 flex items-center justify-between">
            {/* Watch Feeds / Live Thread — flips to active thread when one is set */}
            {liveThread ? (
              <Link
                href={`/${liveThread.slug}`}
                className="inline-flex items-center gap-2 text-sm text-secondary-500 font-bold hover:text-secondary-400"
              >
                <span className="inline-flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-full text-white text-xs font-semibold">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  LIVE
                </span>
                <span>{liveThread.title} →</span>
              </Link>
            ) : (
              <a href="https://paramountplus.qflm.net/c/161260/3116112/3065" target="_blank" rel="noopener noreferrer" className="v2-highlight-text flex items-center gap-2 text-sm">
                Watch Feeds
                <span className="inline-flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-full text-white text-xs font-semibold">
                  <span className="w-2 h-2 bg-white rounded-full" />
                  LIVE
                </span>
              </a>
            )}

            {/* Desktop Navigation */}
            <ul className="hidden md:flex items-center gap-1 text-sm desktop-nav" role="menubar">
              <li role="none">
                <Link href="/" role="menuitem" className="px-2 py-1">
                  Home
                </Link>
              </li>
              <li role="none">
                <Link href="/contact" role="menuitem" className="px-2 py-1">
                  Contact
                </Link>
              </li>
              <li role="none">
                <Link href="/live-feed-updates" role="menuitem" className="px-2 py-1">
                  Feed Updates
                </Link>
              </li>
              <li role="none">
                <Link href="/directory" role="menuitem" className="px-2 py-1">
                  Directory
                </Link>
              </li>
              {!isAuthenticated && !loading && (
                <>
                  <li role="none">
                    <button onClick={() => openLogin()} role="menuitem" className="px-2 py-1 text-secondary-500 hover:text-white">
                      Log In
                    </button>
                  </li>
                  <li role="none">
                    <button onClick={() => openRegister()} role="menuitem" className="px-2 py-1 text-secondary-500 hover:text-white">
                      Register
                    </button>
                  </li>
                </>
              )}
            </ul>

            {/* Go Ad Free / Supporter */}
            {loading && !isAuthenticated ? (
              <div className="w-20 h-4 bg-primary-400/30 rounded" />
            ) : isSupporter ? (
              <div className="flex items-center gap-1 text-sm">
                <Link href="/settings?tab=premium" className="v2-highlight-text">
                  <span className="hidden sm:inline">Thank you for your support!</span>
                  <span className="sm:hidden">Supporter</span>
                </Link>
                <span>&#11088;</span>
              </div>
            ) : (
              <Link href="/become-supporter" className="v2-highlight-text text-sm">
                Go Ad Free
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile search modal */}
      <MobileSearchModal isOpen={isMobileSearchOpen} onClose={() => setIsMobileSearchOpen(false)} />
    </header>
  );
}
