const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Register a new user
 */
export async function register({ username, email, password, displayName, subscribeNewsletter, recaptchaToken }) {
  const response = await fetch(`${API_URL}/bbjd/v1/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username,
      email,
      password,
      display_name: displayName,
      subscribe_newsletter: subscribeNewsletter,
      recaptcha_token: recaptchaToken,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || "Registration failed");
    error.field = data.data?.field;
    throw error;
  }

  return data;
}

/**
 * Request password reset
 */
export async function forgotPassword(email) {
  const response = await fetch(`${API_URL}/bbjd/v1/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send reset email");
  }

  return data;
}

/**
 * Check if username is available
 */
export async function checkUsername(username) {
  const response = await fetch(`${API_URL}/bbjd/v1/auth/check-username`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to check username");
  }

  return data;
}

/**
 * Check if email is available
 */
export async function checkEmail(email) {
  const response = await fetch(`${API_URL}/bbjd/v1/auth/check-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to check email");
  }

  return data;
}

/**
 * Google OAuth sign-in
 */
export async function googleAuth(credential) {
  const response = await fetch(`${API_URL}/bbjd/v1/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ credential }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Google sign-in failed");
  }

  return data;
}
