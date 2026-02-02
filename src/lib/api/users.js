/**
 * Users API functions for public profile pages
 */

import { bbjdFetch } from "./wordpress";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Get auth header if token exists (client-side only)
 */
function getAuthHeader() {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("bbj_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Get user profile by username (server-side)
 * @param {string} username - The username to look up
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfileByUsername(username) {
  try {
    const response = await bbjdFetch(`/users/by-username/${encodeURIComponent(username)}`, {
      tags: ["user-profile", `user-${username}`],
      revalidate: 60,
    });

    return response;
  } catch (error) {
    console.error(`Failed to fetch profile for ${username}:`, error);
    return { success: false, message: "Failed to load profile" };
  }
}

/**
 * Get user profile by ID (server-side)
 * @param {number} userId - The user ID
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfileById(userId) {
  try {
    const response = await bbjdFetch(`/users/${userId}/profile`, {
      tags: ["user-profile", `user-${userId}`],
      revalidate: 60,
    });

    return response;
  } catch (error) {
    console.error(`Failed to fetch profile for user ${userId}:`, error);
    return { success: false, message: "Failed to load profile" };
  }
}

/**
 * Get user's comment history with pagination (client-side)
 * @param {number} userId - The user ID
 * @param {number} page - Page number (default 1)
 * @param {number} perPage - Items per page (default 10)
 * @returns {Promise<Object>} Paginated comments data
 */
export async function getUserComments(userId, page = 1, perPage = 10) {
  const response = await fetch(
    `${API_URL}/bbjd/v1/users/${userId}/comments?page=${page}&per_page=${perPage}`,
    {
      headers: {
        ...getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch comments");
  }

  return response.json();
}

/**
 * Follow a user (client-side)
 * @param {number} userId - The user ID to follow
 */
export async function followUser(userId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in to follow");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/users/${userId}/follow`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to follow user");
  }

  return response.json();
}

/**
 * Unfollow a user (client-side)
 * @param {number} userId - The user ID to unfollow
 */
export async function unfollowUser(userId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/users/${userId}/follow`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to unfollow user");
  }

  return response.json();
}
