"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { MobileMenu } from "./MobileMenu";

export function HeaderClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Right side controls */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* User dropdown placeholder - will be replaced with auth */}
        <Link
          href="/login"
          className="hidden md:block text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500"
        >
          Log In
        </Link>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
          aria-label="Open main menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            // X icon when open
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            // Hamburger icon when closed
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
          )}
        </button>
      </div>

      {/* Mobile Menu - renders below header */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}
