/**
 * Pure JWT inspection helpers — no DOM, no network, no cookies.
 * Safe to import from middleware (edge), client components, and tests.
 */

/** Decode the JWT payload (base64url) into an object, or null if malformed. */
export function decodeJwtPayload(token) {
  if (typeof token !== "string" || !token) return null;
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Token expiry (unix seconds) or null. */
export function getTokenExp(token) {
  const p = decodeJwtPayload(token);
  return p && typeof p.exp === "number" ? p.exp : null;
}

/** Token issued-at (unix seconds) or null. */
export function getTokenIat(token) {
  const p = decodeJwtPayload(token);
  return p && typeof p.iat === "number" ? p.iat : null;
}

/** True if the token is missing/undecodable or at/after its exp. */
export function isTokenExpired(token, nowSec = Math.floor(Date.now() / 1000)) {
  const exp = getTokenExp(token);
  if (exp === null) return true;
  return exp <= nowSec;
}

/**
 * True when the token is still valid but past `threshold` (0..1) of its
 * lifetime — i.e. a good time to proactively re-mint it. Expired or
 * malformed tokens return false (they require a fresh login, not a refresh).
 */
export function shouldRefresh(
  token,
  nowSec = Math.floor(Date.now() / 1000),
  threshold = 0.5
) {
  const exp = getTokenExp(token);
  const iat = getTokenIat(token);
  if (exp === null || iat === null || exp <= iat) return false;
  if (nowSec >= exp) return false; // already expired
  const elapsed = nowSec - iat;
  const lifetime = exp - iat;
  return elapsed / lifetime >= threshold;
}

/**
 * Normalize user_roles from any format into a proper array.
 * PHP json_encode turns non-sequential arrays into objects,
 * so roles like {0:"administrator",2:"beta_tester"} need conversion.
 */
export function normalizeRoles(roles) {
  if (Array.isArray(roles)) return roles;
  if (roles && typeof roles === "object") return Object.values(roles);
  return [];
}

/**
 * Decode the JWT payload into the AuthContext user shape.
 * Pure decode — expiry is the caller's problem (isTokenExpired).
 * Returns null on malformed tokens or missing user id.
 */
export function decodeUserFromToken(token) {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const userData = payload.data?.user;
  if (!userData?.id) return null;
  return {
    id: userData.id,
    user_id: userData.id,
    user_email: userData.email || null,
    user_display_name: userData.display_name || "User",
    user_roles: normalizeRoles(userData.roles),
    token,
  };
}
