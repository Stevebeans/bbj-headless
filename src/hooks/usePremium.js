"use client";

import { useAuth } from "@/context/AuthContext";

const SUPPORTER_ROLES = ["administrator", "editor", "supporter", "lifetime"];

/**
 * Centralized premium access check
 * @returns {{ isPremium: boolean, isAuthenticated: boolean, user: Object|null, roles: string[] }}
 */
export function usePremium() {
  const { user, isAuthenticated } = useAuth();
  const roles = Array.isArray(user?.user_roles) ? user.user_roles : [];
  const isPremium = isAuthenticated && roles.some((role) => SUPPORTER_ROLES.includes(role));

  return { isPremium, isAuthenticated, user, roles };
}

export { SUPPORTER_ROLES };
