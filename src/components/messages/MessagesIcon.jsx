"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FaEnvelope } from "react-icons/fa";
import { getDmUnreadCount } from "@/lib/api/dm";
import { useAuth } from "@/context/AuthContext";

export default function MessagesIcon() {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread DM count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getDmUnreadCount();
      setUnreadCount(result.count || 0);
    } catch (error) {
      console.error("Failed to fetch DM unread count:", error);
    }
  }, []);

  // Poll for unread count — visibility-gated to protect the WP origin.
  // Every logged-in user's browser would otherwise hit /dm/unread-count (a full
  // WP REST bootstrap on Cloudways) every interval, even in background/pinned
  // tabs, which is most of the wasted load. Only poll while the tab is actually
  // visible, and refresh once on refocus so the badge is fresh the moment the
  // user looks. See CLAUDE.md "Caching Comes First". (Anonymous users never
  // reach the server — no token.)
  const POLL_INTERVAL_MS = 60000; // 60s while visible
  useEffect(() => {
    if (!isAuthenticated) return;

    let interval = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount(); // refresh immediately on refocus
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Defer initial fetch so it doesn't compete with page load.
    const initialTimeout = setTimeout(() => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
        startPolling();
      }
    }, 2000);

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearTimeout(initialTimeout);
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated, fetchUnreadCount]);

  if (!isAuthenticated) return null;

  return (
    <Link
      href="/messages"
      className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors"
      aria-label="Messages"
    >
      <FaEnvelope className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
