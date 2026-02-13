import { getToken } from "@/lib/auth/cookies";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

export async function getSettings() {
  const token = getToken();
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

export async function updateSettings(data) {
  const token = getToken();
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

export async function updateNotifications(notifications) {
  const token = getToken();
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

export async function requestEmailChange(email) {
  const token = getToken();
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

export async function searchPlayers(query) {
  const token = getToken();
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

export async function getHelpData() {
  const response = await fetch(`${API_URL}/bbjd/v1/settings/help`);

  if (!response.ok) {
    throw new Error("Failed to fetch help data");
  }

  return response.json();
}

export async function uploadAvatar(file) {
  const token = getToken();
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

export async function getPreferences() {
  const token = getToken();
  if (!token) return { preferences: { feed_per_page: 20 } };

  const response = await fetch(`${API_URL}/bbjd/v1/settings/preferences`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return { preferences: { feed_per_page: 20 } };
  }

  return response.json();
}

export async function updatePreferences(prefs) {
  const token = getToken();
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/settings/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(prefs),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to update preferences");
  }

  return result;
}

export async function getEmailPreferences() {
  const token = getToken();
  if (!token) return { lists: [] };

  const response = await fetch(`${API_URL}/bbjd/v1/email/preferences`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return { lists: [] };
  return response.json();
}

export async function updateEmailPreferences(lists) {
  const token = getToken();
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/email/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ lists }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to update email preferences");
  }

  return response.json();
}

export async function deleteAvatar() {
  const token = getToken();
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
