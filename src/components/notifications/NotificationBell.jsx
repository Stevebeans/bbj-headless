"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { FaBell, FaCheck } from "react-icons/fa";
import { getNotifications, getUnreadCount, markAsRead } from "@/lib/api/notifications";
import NotificationItem from "./NotificationItem";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const dropdownRef = useRef(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadCount();
      setUnreadCount(result.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const result = await getNotifications({ page: pageNum, perPage: 10 });
      if (append) {
        setNotifications((prev) => [...prev, ...(result.notifications || [])]);
      } else {
        setNotifications(result.notifications || []);
      }
      setHasMore(result.pagination?.current_page < result.pagination?.total_pages);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll for unread count
  useEffect(() => {
    fetchUnreadCount();

    // Poll every 60 seconds
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(1, false);
    }
  }, [isOpen, fetchNotifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAsRead({ all: true });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markAsRead({ ids: [notification.id] });
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }
    setIsOpen(false);
  };

  // Load more notifications
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors"
        aria-label="Notifications"
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium"
              >
                <FaCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <FaBell className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No notifications yet
                </p>
              </div>
            ) : (
              <>
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                  />
                ))}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="w-full py-3 text-sm text-primary-500 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium disabled:opacity-50"
                  >
                    {loading ? "Loading..." : "Load more"}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="block text-center py-2.5 text-sm font-medium text-primary-500 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-700 border-t border-slate-200 dark:border-slate-700"
          >
            View All Notifications
          </Link>
        </div>
      )}
    </div>
  );
}
