"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { sendHeartbeat } from "@/lib/api/comments";

/**
 * Hook to send periodic heartbeats to keep the session alive
 *
 * Usage: Call this hook once at the app level (e.g., in layout or a provider)
 *
 * @param {number} intervalMs - Heartbeat interval in milliseconds (default: 2 minutes)
 */
export function useSessionHeartbeat(intervalMs = 2 * 60 * 1000) {
  const { isAuthenticated } = useAuth();
  const intervalRef = useRef(null);

  useEffect(() => {
    // Only send heartbeats when authenticated
    if (!isAuthenticated) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Defer initial heartbeat so it doesn't compete with page load
    const initialTimeout = setTimeout(() => {
      sendHeartbeat();
    }, 5000);

    // Set up interval for periodic heartbeats
    intervalRef.current = setInterval(() => {
      sendHeartbeat();
    }, intervalMs);

    // Also send heartbeat on visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated, intervalMs]);
}

export default useSessionHeartbeat;
