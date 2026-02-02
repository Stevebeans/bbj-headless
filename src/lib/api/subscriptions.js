/**
 * Post Subscription API functions
 */

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Get auth header if token exists
 */
function getAuthHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("bbj_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Subscribe to a post/thread
 * @param {number} postId - The post ID to subscribe to
 */
export async function subscribeToPost(postId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/subscriptions/posts/${postId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to subscribe");
  }

  return response.json();
}

/**
 * Unsubscribe from a post/thread
 * @param {number} postId - The post ID to unsubscribe from
 */
export async function unsubscribeFromPost(postId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/subscriptions/posts/${postId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to unsubscribe");
  }

  return response.json();
}

/**
 * Get subscription status for a post
 * @param {number} postId - The post ID to check
 */
export async function getSubscriptionStatus(postId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    return { success: true, subscribed: false };
  }

  try {
    const response = await fetch(`${API_URL}/bbjd/v1/subscriptions/posts/${postId}/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: true, subscribed: false };
    }

    return response.json();
  } catch {
    return { success: true, subscribed: false };
  }
}

/**
 * Get user's subscribed posts
 * @param {object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.perPage - Items per page
 */
export async function getSubscriptions({ page = 1, perPage = 20 } = {}) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(
    `${API_URL}/bbjd/v1/subscriptions/posts?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch subscriptions");
  }

  return response.json();
}
