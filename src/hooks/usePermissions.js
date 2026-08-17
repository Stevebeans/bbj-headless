"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyPermissions } from "@/lib/api/admin";

// One in-flight/settled fetch shared across every hook instance — feed cards
// mount this hook per-card, and without sharing each instance would hit
// /my-permissions separately (Header + FloatingUpdater already doubled it).
let sharedPermissionsFetch = null;

/**
 * Global permissions hook — works in admin pages AND public pages.
 *
 * Usage:
 *   const { permissions, loading, hasPermission } = usePermissions();
 *   if (hasPermission('player_management')) { ... }
 */
export function usePermissions() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const didFetch = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      sharedPermissionsFetch = null;
      setPermissions(null);
      setLoading(false);
      return;
    }

    if (didFetch.current) return;
    didFetch.current = true;

    if (!sharedPermissionsFetch) {
      sharedPermissionsFetch = getMyPermissions();
    }

    sharedPermissionsFetch
      .then((data) => {
        setPermissions(data.features);
      })
      .catch(() => {
        // Don't cache a failure — the next mount retries.
        sharedPermissionsFetch = null;
        setPermissions(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, isAuthenticated]);

  const hasPermission = useCallback(
    (feature) => {
      if (!permissions) return false;
      return !!permissions[feature];
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(() => {
    return permissions && Object.keys(permissions).length > 0;
  }, [permissions]);

  return { permissions, loading, hasPermission, hasAnyPermission };
}
