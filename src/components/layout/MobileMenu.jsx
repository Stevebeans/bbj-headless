"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
      aria-label="Open main menu"
      aria-expanded="false"
    >
      <svg
        className="w-6 h-6"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

export function MobileMenu({ isOpen, onClose }) {
  if (!isOpen) return null;

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/feed-updates", label: "Feed Updates" },
    { href: "/players", label: "Players" },
    { href: "/login", label: "Log In" },
    { href: "/register", label: "Register" },
  ];

  return (
    <div className="lg:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-screen-xl mx-auto px-4 py-4">
        {/* Search bar on mobile */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-4 py-2 rounded-full border border-primary-500 bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Navigation links */}
        <nav aria-label="Mobile navigation">
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className="block py-2 px-4 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-osw uppercase tracking-wide"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* BB Time on mobile */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-xs text-gray-500 dark:text-gray-400">
          <span>BB Time: </span>
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
  );
}

// Combined wrapper component for use in Header
export function MobileMenuWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <MobileMenuButton onClick={() => setIsOpen(!isOpen)} />
      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
