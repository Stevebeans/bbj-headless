import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenuWrapper } from "./MobileMenu";

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
        {/* Tier 1: Main Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-screen-xl mx-auto px-2 py-2 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="shrink-0 flex items-center">
              <span className="font-display text-2xl md:text-3xl font-bold text-primary-500 dark:text-primary-400">
                Big Brother Junkies
              </span>
              <span className="sr-only">Big Brother Junkies - Home</span>
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
                className="hidden md:flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Log In</span>
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

            {/* BB Time + Go Ad Free */}
            <div className="flex items-center gap-4 text-xs">
              <div className="hidden md:block text-secondary-400">
                <span>BB Time: </span>
                <time suppressHydrationWarning>{bbTime}</time>
              </div>
              <Link href="/become-supporter" className="v2-highlight-text">Go Ad Free</Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
