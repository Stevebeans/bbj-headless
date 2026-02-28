"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyPermissions } from "@/lib/api/admin";

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
      setPermissions(null);
      setLoading(false);
      return;
    }

    if (didFetch.current) return;
    didFetch.current = true;

    getMyPermissions()
      .then((data) => {
        setPermissions(data.features);
      })
      .catch(() => {
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
