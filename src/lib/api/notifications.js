/**
 * Notifications API functions
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
 * Get notifications for the current user
 * @param {object} options - Query options
 * @param {number} options.page - Page number
 * @param {number} options.perPage - Items per page
 */
export async function getNotifications({ page = 1, perPage = 20 } = {}) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(
    `${API_URL}/bbjd/v1/notifications?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch notifications");
  }

  return response.json();
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    return { success: true, count: 0 };
  }

  try {
    const response = await fetch(`${API_URL}/bbjd/v1/notifications/unread-count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { success: true, count: 0 };
    }

    return response.json();
  } catch {
    return { success: true, count: 0 };
  }
}

/**
 * Mark notifications as read
 * @param {object} options - Options
 * @param {number[]|null} options.ids - Specific notification IDs to mark read
 * @param {boolean} options.all - Mark all as read
 */
export async function markAsRead({ ids = null, all = false } = {}) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const body = all ? { all: true } : { ids };

  const response = await fetch(`${API_URL}/bbjd/v1/notifications/mark-read`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to mark notifications as read");
  }

  return response.json();
}

/**
 * Delete a notification
 * @param {number} notificationId - The notification ID
 */
export async function deleteNotification(notificationId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/notifications/${notificationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete notification");
  }

  return response.json();
}
