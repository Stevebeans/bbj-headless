import Link from "next/link";

export function Header() {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50">
      {/* Top Bar */}
      <div className="bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-1 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/contact" className="hover:text-primary-500">
              Contact
            </Link>
            <Link href="/privacy-policy" className="hover:text-primary-500">
              Privacy
            </Link>
          </div>
          <div>
            <span>Current BB Time: </span>
            <time suppressHydrationWarning>
              {new Date().toLocaleString("en-US", {
                timeZone: "America/Los_Angeles",
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </time>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="font-display text-3xl font-bold text-primary-500">
              Big Brother Junkies
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="font-osw text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:text-primary-500"
            >
              Home
            </Link>
            <Link
              href="/players"
              className="font-osw text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:text-primary-500"
            >
              Players
            </Link>
            <Link
              href="/feed-updates"
              className="font-osw text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:text-primary-500"
            >
              Live Feed
            </Link>
            <Link
              href="/login"
              className="font-osw text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:text-primary-500"
            >
              Login
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-gray-600 dark:text-gray-400">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Nav Bar */}
      <div className="bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <a
            href="https://paramountplus.qflm.net/c/161260/3116112/3065"
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary-500 font-semibold text-sm flex items-center gap-2"
          >
            Watch Feeds
            <span className="inline-flex items-center gap-1 bg-red-600 px-2 py-0.5 rounded-full text-white text-xs">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          </a>

          <Link
            href="/become-supporter"
            className="text-secondary-500 font-semibold text-sm"
          >
            Go Ad Free
          </Link>
        </div>
      </div>
    </header>
  );
}
