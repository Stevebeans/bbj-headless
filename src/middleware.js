import { NextResponse } from "next/server";
import { isTokenExpired } from "@/lib/auth/token";

// Apex-domain probe paths from WP attack scanners. Bail with 404 before
// the request hits any page handler so we don't pay function/ISR cost.
const PROBE_PATH_EXACT = new Set(["/wp-login.php", "/xmlrpc.php"]);
const PROBE_PATH_PREFIXES = ["/wp-admin"];

function isProbePath(pathname) {
  if (PROBE_PATH_EXACT.has(pathname)) return true;
  return PROBE_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}


export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Block WP-attack probe paths early — saves function invocations + ISR writes
  if (isProbePath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

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
     * IMPORTANT: Only match protected routes, NOT public content pages.
     * Middleware that reads request.cookies prevents Vercel from ISR-caching
     * the response (sets Cache-Control: private, no-store). Public pages
     * (posts, players, seasons, feed-updates, etc.) must skip middleware
     * entirely so they can be served from CDN cache.
     */
    "/admin/:path*",
    "/settings/:path*",
    "/editor/:path*",
    "/notifications/:path*",
    "/bigbrother-players/:slug/edit",
    "/bigbrother-seasons/:slug/edit",
    // WP-attack probe paths — bail with 404 in middleware
    "/wp-login.php",
    "/wp-admin/:path*",
    "/xmlrpc.php",
  ],
};
