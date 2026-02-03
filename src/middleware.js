import { NextResponse } from "next/server";

/**
 * Decode JWT payload to check expiration.
 * Runs at the edge — no Node.js Buffer, so use atob.
 */
function isTokenExpired(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    // Edge-compatible base64url decode
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

export function middleware(request) {
  const token = request.cookies.get("bbj_token")?.value;

  if (token && isTokenExpired(token)) {
    const response = NextResponse.next();
    response.cookies.delete("bbj_token");
    response.cookies.delete("bbj_remember");
    response.cookies.delete("bbj_user");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, icons, manifest
     * - API routes
     * - Public assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icons/|manifest\\.json|api/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)).*)",
  ],
};
