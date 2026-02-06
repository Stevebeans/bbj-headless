import { cookies } from "next/headers";

/**
 * Decode a JWT payload without signature validation.
 * Used server-side to get optimistic user data for SSR.
 */
/**
 * Normalize roles from any format into a proper array.
 * PHP json_encode turns non-sequential arrays into objects.
 */
function normalizeRoles(roles) {
  if (Array.isArray(roles)) return roles;
  if (roles && typeof roles === "object") return Object.values(roles);
  return [];
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Read the JWT cookie server-side and return initial auth state.
 * Returns a basic user object for SSR or null if not authenticated.
 * The _initial flag tells AuthContext this data hasn't been validated yet.
 */
export async function getInitialAuthState() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("bbj_token");

    if (!tokenCookie?.value) return null;

    const payload = decodeJwtPayload(tokenCookie.value);
    if (!payload) return null;

    const userData = payload.data?.user;
    if (!userData?.id) return null;

    // Read cached profile data (avatar, display name, roles) set after last validation
    let cached = null;
    const userCacheCookie = cookieStore.get("bbj_user");
    if (userCacheCookie?.value) {
      try {
        const parsed = JSON.parse(decodeURIComponent(userCacheCookie.value));
        cached = { name: parsed.n || "", avatar: parsed.a || "", roles: parsed.r || [] };
      } catch {
        // ignore malformed cache cookie
      }
    }

    return {
      id: userData.id,
      user_id: userData.id,
      user_display_name: userData.display_name || cached?.name || null,
      user_email: userData.email || null,
      user_roles: normalizeRoles(userData.roles || cached?.roles),
      avatar: cached?.avatar || null,
      token: tokenCookie.value,
      _initial: true,
    };
  } catch {
    return null;
  }
}
