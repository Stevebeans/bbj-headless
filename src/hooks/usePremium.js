"use client";

import { useAuth } from "@/context/AuthContext";

// full_bean = the Ask-the-Bean AI tier; it includes all Supporter perks.
const SUPPORTER_ROLES = ["administrator", "editor", "supporter", "lifetime", "full_bean"];

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
