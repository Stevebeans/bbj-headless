import { cookies } from "next/headers";

const WP_API = process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Verify that the request has a valid JWT token by checking the bbj_token cookie
 * or Authorization header against WordPress.
 * Returns the user data if valid, null if not.
 */
export async function verifyAuth(request) {
  // Try Authorization header first, then cookie
  let token = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get("bbj_token")?.value;
  }

  if (!token) return null;

  try {
    const res = await fetch(`${WP_API}/jwt-auth/v1/token/validate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
