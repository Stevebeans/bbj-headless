"use client";

import { useAuth } from "@/context/AuthContext";
import { useAds } from "@/context/AdContext";

/**
 * Centralized premium access check
 * @returns {{ isPremium: boolean, isAuthenticated: boolean, user: Object|null, roles: string[] }}
 */
export function usePremium() {
  const { user, isAuthenticated } = useAuth();
  const { isSupporter } = useAds();
  const roles = Array.isArray(user?.user_roles) ? user.user_roles : [];

  return { isPremium: isAuthenticated && isSupporter, isAuthenticated, user, roles };
}
