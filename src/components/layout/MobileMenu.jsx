"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";

export function MobileMenuButton({ isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      className="md:hidden p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
    >
      {isOpen ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  );
}

export function MobileMenu({ isOpen, onClose, onSearchOpen }) {
  const { isAuthenticated, logout, loading } = useAuth();
  const { openLogin, openRegister } = useAuthModal();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/contact", label: "Contact" },
    { href: "/feed-updates", label: "Feed Updates" },
    { href: "/directory", label: "Directory" },
    { href: "/become-supporter", label: "Go Ad Free" },
  ];

  const linkClass = "block py-3 px-4 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-osw uppercase tracking-wide transition-colors";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in menu panel */}
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-white dark:bg-gray-900 z-50 shadow-xl transform transition-transform duration-300 ease-out md:hidden flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Menu header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="font-display text-xl text-primary-500 dark:text-primary-400">Menu</span>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => { onClose(); onSearchOpen?.(); }}
            className="w-full px-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2 hover:border-primary-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search...
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 p-4 overflow-y-auto" aria-label="Mobile navigation">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={linkClass}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom section: Auth action + BB Time */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {!loading && (
            <div className="px-4 pt-3">
              {isAuthenticated ? (
                <button
                  onClick={() => { logout(); onClose(); }}
                  className="w-full py-2.5 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-osw uppercase tracking-wide transition-colors flex items-center gap-2 justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => { openLogin(); onClose(); }}
                    className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg font-osw uppercase tracking-wide hover:bg-primary-600 transition-colors text-center"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { openRegister(); onClose(); }}
                    className="flex-1 py-2.5 border border-primary-500 text-primary-500 dark:text-primary-400 rounded-lg font-osw uppercase tracking-wide hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-center"
                  >
                    Register
                  </button>
                </div>
              )}
            </div>
          )}

          {/* BB Time */}
          <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400" data-nosnippet>
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
    </>
  );
}

// Combined wrapper component for use in Header
export function MobileMenuWrapper({ onSearchOpen }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <MobileMenuButton isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
      <MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} onSearchOpen={onSearchOpen} />
    </>
  );
}
