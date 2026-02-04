const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Wrap fetch to provide detailed error messages instead of generic "Failed to fetch".
 */
async function authFetch(endpoint, options) {
  const url = `${API_URL}${endpoint}`;
  let response;

  try {
    response = await fetch(url, options);
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`Request timed out reaching ${url}`);
    }
    throw new Error(
      `Network error: Could not reach ${url}. This is usually a CORS, SSL, or connectivity issue. Check browser console for details.`
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Invalid response from ${url} (HTTP ${response.status}) — expected JSON but got something else.`);
  }

  if (!response.ok) {
    const error = new Error(data.message || `HTTP ${response.status} error from ${url}`);
    error.status = response.status;
    error.data = data.data;
    error.field = data.data?.field;
    throw error;
  }

  return data;
}

/**
 * Register a new user
 */
export async function register({ username, email, password, displayName, subscribeNewsletter, recaptchaToken }) {
  return authFetch("/bbjd/v1/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      email,
      password,
      display_name: displayName,
      subscribe_newsletter: subscribeNewsletter,
      recaptcha_token: recaptchaToken,
    }),
  });
}

/**
 * Request password reset
 */
export async function forgotPassword(email) {
  return authFetch("/bbjd/v1/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

/**
 * Reset password with key from email link
 */
export async function resetPassword(key, login, password) {
  return authFetch("/bbjd/v1/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, login, password }),
  });
}

/**
 * Check if username is available
 */
export async function checkUsername(username) {
  return authFetch("/bbjd/v1/auth/check-username", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
}

/**
 * Check if email is available
 */
export async function checkEmail(email) {
  return authFetch("/bbjd/v1/auth/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

/**
 * Google OAuth sign-in
 */
export async function googleAuth(credential) {
  return authFetch("/bbjd/v1/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
}
