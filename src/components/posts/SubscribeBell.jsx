"use client";

import { useState, useEffect } from "react";
import { FaBell, FaBellSlash } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { subscribeToPost, unsubscribeFromPost, getSubscriptionStatus } from "@/lib/api/subscriptions";

/**
 * Subscribe/Unsubscribe bell button for post threads
 * Shows filled bell when subscribed, outline when not
 */
export default function SubscribeBell({ postId, className = "" }) {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  // Fetch initial subscription status
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const result = await getSubscriptionStatus(postId);
        setIsSubscribed(result.subscribed);
      } catch (error) {
        console.error("Failed to fetch subscription status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [postId, isAuthenticated]);

  const handleToggle = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    setToggling(true);
    try {
      if (isSubscribed) {
        await unsubscribeFromPost(postId);
        setIsSubscribed(false);
      } else {
        await subscribeToPost(postId);
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Failed to toggle subscription:", error);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <button
        disabled
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500 ${className}`}
      >
        <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-transparent rounded-full animate-spin" />
        <span className="hidden sm:inline">Loading...</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      title={isSubscribed ? "Unsubscribe from thread" : "Subscribe to thread"}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-all ${
        isSubscribed
          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50"
          : "text-gray-500 dark:text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800"
      } ${toggling ? "opacity-50 cursor-wait" : ""} ${className}`}
    >
      {toggling ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isSubscribed ? (
        <FaBell className="w-4 h-4" />
      ) : (
        <FaBellSlash className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {isSubscribed ? "Subscribed" : "Subscribe"}
      </span>
    </button>
  );
}
