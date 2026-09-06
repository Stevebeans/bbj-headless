import { normalizeRoles } from "./token";

/**
 * Shape any auth payload (/auth/me, jwt-auth login, Google login, JWT decode)
 * into the user object the UI reads. Pure — no DOM, no cookies.
 *
 * `avatar` is the one the header renders. /auth/me sends it as `user_avatar`,
 * so a password login used to leave `avatar` unset and members saw their
 * initial letter until the next full page load rebuilt state from the
 * profile-cache cookie (nicolet77, 2026-09-05).
 */
export function normalizeUserData(userData) {
  const displayName = userData.user_display_name || userData.display_name || "";
  return {
    ...userData,
    user_roles: normalizeRoles(userData.user_roles ?? userData.roles),
    user_display_name:
      typeof displayName === "string" ? displayName : String(displayName?.name || displayName || ""),
    avatar: userData.avatar || userData.user_avatar || "",
  };
}
