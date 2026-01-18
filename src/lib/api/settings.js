/**
 * User Settings API functions
 */

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Get all settings for current user
 */
export async function getSettings() {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/settings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to fetch settings");
  }

  return response.json();
}

/**
 * Update profile settings
 * @param {Object} data - Profile data to update
 * @param {string} [data.display_name] - Display name
 * @param {string} [data.first_name] - First name
 * @param {string} [data.last_name] - Last name
 * @param {string} [data.bio] - User bio
 * @param {number|null} [data.favorite_player_id] - Favorite player ID
 */
export async function updateSettings(data) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update settings");
  }

  return response.json();
}

/**
 * Update notification preferences
 * @param {Object} notifications - Notification settings
 * @param {boolean} [notifications.new_reply] - Reply notifications
 * @param {boolean} [notifications.new_mention] - Mention notifications
 * @param {boolean} [notifications.new_message] - Message notifications
 * @param {boolean} [notifications.feed_updates] - Feed update notifications (premium)
 * @param {boolean} [notifications.newsletter] - Newsletter subscription
 */
export async function updateNotifications(notifications) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/settings/notifications`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(notifications),
  });

  const result = await response.json();

  if (!response.ok) {
    const error = new Error(result.message || "Failed to update notifications");
    error.code = result.code;
    throw error;
  }

  return result;
}

/**
 * Request email change (sends verification email)
 * @param {string} email - New email address
 */
export async function requestEmailChange(email) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/settings/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to request email change");
  }

  return response.json();
}

/**
 * Verify email change with token
 * @param {string} token - Verification token from email link
 */
export async function verifyEmailChange(verifyToken) {
  const response = await fetch(`${API_URL}/bbjd/v1/settings/email/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: verifyToken }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to verify email");
  }

  return response.json();
}

/**
 * Search players for favorite player dropdown
 * @param {string} query - Search query (min 2 characters)
 */
export async function searchPlayers(query) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(
    `${API_URL}/bbjd/v1/settings/players/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to search players");
  }

  return response.json();
}

/**
 * Get help/FAQ data including rank definitions
 */
export async function getHelpData() {
  const response = await fetch(`${API_URL}/bbjd/v1/settings/help`);

  if (!response.ok) {
    throw new Error("Failed to fetch help data");
  }

  return response.json();
}

/**
 * Upload avatar image
 * @param {File} file - Image file to upload
 */
export async function uploadAvatar(file) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const formData = new FormData();
  formData.append("avatar", file);

  const response = await fetch(`${API_URL}/bbjd/v1/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload avatar");
  }

  return response.json();
}

/**
 * Delete avatar (revert to Gravatar)
 */
export async function deleteAvatar() {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/avatar`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete avatar");
  }

  return response.json();
}
