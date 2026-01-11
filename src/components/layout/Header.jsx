import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenuWrapper } from "./MobileMenu";

const LOGO_URL = "https://bigbrotherjunkies.com/wp-content/themes/BBJ/images/bbjlogo2020.png";

export function Header() {
  const bbTime = new Date().toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <header className="sticky top-0 z-50">
      <nav aria-label="Main navigation">
        {/* Top utility bar */}
        <div className="bg-white dark:bg-gray-900">
          <div className="flex max-w-screen-xl justify-between mx-auto px-2 py-1 text-[10px] md:text-sm text-gray-500 dark:text-gray-400">
            {/* Left side - links and socials */}
            <div className="text-xs flex items-center gap-1">
              <Link href="/contact" className="hidden md:inline hover:text-primary-500">Contact</Link>
              <span className="hidden md:inline">|</span>
              <Link href="/privacy-policy" className="hidden md:inline hover:text-primary-500">Privacy</Link>
              <span className="hidden md:inline">|</span>
              <span>Follow:</span>
              <a
                href="https://www.facebook.com/bigbrotherjunkies"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-500 ml-1"
                aria-label="Facebook"
              >
                <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/bigbrotherjunky/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary-500 ml-1"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
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
              <span className="md:hidden font-display text-2xl font-bold text-primary-500 dark:text-primary-400">
                BBJ
              </span>
              {/* Desktop logo - full */}
              <Image
                src={LOGO_URL}
                alt="Big Brother Junkies"
                width={395}
                height={37}
                className="hidden md:block h-[37px] w-auto"
                priority
              />
            </Link>

            {/* Search bar - desktop only */}
            <div className="hidden lg:flex grow mx-8 max-w-md">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-2 rounded-full border border-primary-500 bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
                  aria-label="Search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              <Link
                href="/login"
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500"
                aria-label="Log In"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden md:inline">Log In</span>
              </Link>

              <MobileMenuWrapper />
            </div>
          </div>
        </div>

        {/* Tier 2: Nav Bar */}
        <div className="bg-primary-500">
          <div className="max-w-screen-xl mx-auto px-2 py-1.5 flex items-center justify-between">
            {/* Watch Feeds */}
            <a
              href="https://paramountplus.qflm.net/c/161260/3116112/3065"
              target="_blank"
              rel="noopener noreferrer"
              className="v2-highlight-text flex items-center gap-2 text-sm"
            >
              Watch Feeds
              <span className="inline-flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-full text-white text-xs font-semibold">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                LIVE
              </span>
            </a>

            {/* Desktop Navigation */}
            <ul className="hidden md:flex items-center gap-1 text-sm desktop-nav" role="menubar">
              <li role="none"><Link href="/" className="px-2 py-1">Home</Link></li>
              <li role="none"><Link href="/feed-updates" className="px-2 py-1">Feed Updates</Link></li>
              <li role="none"><Link href="/players" className="px-2 py-1">Players</Link></li>
              <li role="none"><Link href="/login" className="px-2 py-1">Log In</Link></li>
              <li role="none"><Link href="/register" className="px-2 py-1">Register</Link></li>
            </ul>

            {/* Go Ad Free */}
            <Link href="/become-supporter" className="v2-highlight-text text-sm">Go Ad Free</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
