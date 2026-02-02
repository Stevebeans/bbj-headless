"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaBell, FaCheck, FaCog, FaFilter } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { getNotifications, getUnreadCount, markAsRead } from "@/lib/api/notifications";
import NotificationItem from "@/components/notifications/NotificationItem";

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState("all"); // "all" | "unread"
  const [markingAllRead, setMarkingAllRead] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch notifications
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await getNotifications({ page: pageNum, perPage: 20 });
      let notifs = result.notifications || [];

      // Apply filter client-side
      if (filter === "unread") {
        notifs = notifs.filter((n) => !n.is_read);
      }

      if (append) {
        setNotifications((prev) => [...prev, ...notifs]);
      } else {
        setNotifications(notifs);
      }
      setHasMore(result.pagination?.current_page < result.pagination?.total_pages);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await getUnreadCount();
      setUnreadCount(result.count || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, false);
      fetchUnreadCount();
    }
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]);

  // Refetch when filter changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(1, false);
    }
  }, [filter, isAuthenticated, fetchNotifications]);

  // Handle mark all as read
  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);
    try {
      await markAsRead({ all: true });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  // Handle single notification click
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
  };

  // Load more
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(page + 1, true);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-200 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-200 dark:bg-gray-950 py-8">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FaBell className="text-primary-500" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-sm font-medium bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Stay updated on replies and mentions
            </p>
          </div>
          <Link
            href="/settings?tab=notifications"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500 transition-colors"
          >
            <FaCog className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-900 rounded-t-xl border border-b-0 border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <FaFilter className="w-3 h-3 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
            </select>
          </div>

          {/* Mark All Read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAllRead}
              className="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 font-medium disabled:opacity-50"
            >
              <FaCheck className="w-3 h-3" />
              {markingAllRead ? "Marking..." : "Mark all read"}
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-900 rounded-b-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin inline-block w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
              <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <FaBell className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {filter === "unread"
                  ? "You're all caught up!"
                  : "When someone replies to your comments or mentions you, you'll see it here."}
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

              {/* Load More */}
              {hasMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-4 text-sm text-primary-500 hover:text-primary-600 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium disabled:opacity-50 border-t border-slate-100 dark:border-slate-700"
                >
                  {loadingMore ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-slate-300 border-t-primary-500 rounded-full" />
                      Loading...
                    </span>
                  ) : (
                    "Load more notifications"
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
