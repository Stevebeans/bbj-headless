/**
 * Comments API functions
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
 * Get comments for a post
 */
export async function getComments(postId, { page = 1, perPage = 20, sort = "newest" } = {}) {
  const response = await fetch(
    `${API_URL}/bbjd/v1/comments/${postId}?page=${page}&per_page=${perPage}&sort=${sort}`,
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
 * Post a new comment
 * @param {number} postId - The post ID
 * @param {string} content - The comment content
 * @param {number} parentId - Parent comment ID (0 for top-level)
 * @param {number|null} mediaId - Optional media ID to attach
 */
export async function postComment(postId, content, parentId = 0, mediaId = null) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in to comment");
  }

  const body = {
    post_id: postId,
    content,
    parent_id: parentId,
  };

  if (mediaId) {
    body.media_id = mediaId;
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to post comment");
  }

  return response.json();
}

/**
 * Vote on a comment
 */
export async function voteOnComment(commentId, voteType) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in to vote");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments/${commentId}/vote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ vote_type: voteType }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to vote");
  }

  return response.json();
}

/**
 * Report a comment
 */
export async function reportComment(commentId, reason, details = "") {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in to report");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments/${commentId}/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reason, details }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to report comment");
  }

  return response.json();
}

/**
 * Edit a comment
 */
export async function editComment(commentId, content) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in to edit");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to edit comment");
  }

  return response.json();
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in to delete");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete comment");
  }

  return response.json();
}

/**
 * Get user rank info
 */
export async function getUserRank(userId) {
  const response = await fetch(`${API_URL}/bbjd/v1/users/${userId}/rank`);

  if (!response.ok) {
    throw new Error("Failed to fetch user rank");
  }

  return response.json();
}

/**
 * Get all ranks
 */
export async function getAllRanks() {
  const response = await fetch(`${API_URL}/bbjd/v1/ranks`);

  if (!response.ok) {
    throw new Error("Failed to fetch ranks");
  }

  return response.json();
}

/**
 * Upload media for a comment
 * @param {File} file - The file to upload
 * @returns {Promise<{success: boolean, media: object}>}
 */
export async function uploadCommentMedia(file) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in to upload media");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/bbjd/v1/comments/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to upload media");
  }

  return response.json();
}

/**
 * Delete uploaded media
 * @param {number} mediaId - The media ID to delete
 */
export async function deleteCommentMedia(mediaId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in to delete media");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments/media/${mediaId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to delete media");
  }

  return response.json();
}

/**
 * Store a Giphy GIF reference
 */
export async function storeGiphyMedia(giphyId, url, width, height) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments/media/giphy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ giphy_id: giphyId, url, width, height }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to store Giphy");
  }

  return response.json();
}

/**
 * Search Giphy for GIFs
 */
export async function searchGiphy(query, limit = 20, offset = 0) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(
    `${API_URL}/bbjd/v1/comments/media/giphy/search?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to search Giphy");
  }

  return response.json();
}

/**
 * Get trending Giphy GIFs
 */
export async function getTrendingGiphy(limit = 20) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(
    `${API_URL}/bbjd/v1/comments/media/giphy/trending?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to get trending GIFs");
  }

  return response.json();
}

// ============================================
// Reaction API Functions
// ============================================

/**
 * Reaction emoji mapping
 */
export const REACTION_TYPES = {
  like: "👍",
  love: "❤️",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡",
};

/**
 * Add or change a reaction on a comment
 * @param {number} commentId - The comment ID
 * @param {string} reactionType - One of: like, love, haha, wow, sad, angry
 */
export async function addReaction(commentId, reactionType) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in to react");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments/${commentId}/reactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ reaction_type: reactionType }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to add reaction");
  }

  return response.json();
}

/**
 * Remove reaction from a comment
 * @param {number} commentId - The comment ID
 */
export async function removeReaction(commentId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments/${commentId}/reactions`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to remove reaction");
  }

  return response.json();
}

/**
 * Get reactions for a comment
 * @param {number} commentId - The comment ID
 */
export async function getReactions(commentId) {
  const response = await fetch(`${API_URL}/bbjd/v1/comments/${commentId}/reactions`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch reactions");
  }

  return response.json();
}

// ============================================
// Session/Online Status API Functions
// ============================================

/**
 * Send a heartbeat to keep the session alive
 */
export async function sendHeartbeat() {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${API_URL}/bbjd/v1/session/heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch {
    return null;
  }
}

/**
 * Check if specific users are online
 * @param {number[]} userIds - Array of user IDs to check
 */
export async function checkOnlineStatus(userIds) {
  if (!userIds || userIds.length === 0) {
    return {};
  }

  const response = await fetch(
    `${API_URL}/bbjd/v1/users/online?user_ids=${userIds.join(",")}`,
    {
      headers: {
        ...getAuthHeader(),
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to check online status");
  }

  const result = await response.json();
  return result.success ? result.online_status : {};
}

/**
 * Get count of online users
 */
export async function getOnlineCount() {
  const response = await fetch(`${API_URL}/bbjd/v1/users/online/count`);

  if (!response.ok) {
    throw new Error("Failed to get online count");
  }

  return response.json();
}

// ============================================
// User Profile API Functions
// ============================================

/**
 * Get user profile with stats and recent comments
 * @param {number} userId - The user ID
 */
export async function getUserProfile(userId) {
  const response = await fetch(`${API_URL}/bbjd/v1/users/${userId}/profile`, {
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }

  return response.json();
}

/**
 * Follow a user
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
 * Unfollow a user
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

// ============================================
// Comment Pinning API Functions (Staff Pick)
// ============================================

/**
 * Pin a comment (staff pick)
 * @param {number} commentId - The comment ID to pin
 */
export async function pinComment(commentId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments/${commentId}/pin`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to pin comment");
  }

  return response.json();
}

/**
 * Unpin a comment
 * @param {number} commentId - The comment ID to unpin
 */
export async function unpinComment(commentId) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments/${commentId}/pin`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to unpin comment");
  }

  return response.json();
}

// ============================================
// User Search API Function (for @mentions)
// ============================================

/**
 * Search users for @mention autocomplete
 * @param {string} query - Search query
 * @param {number} limit - Max results
 */
export async function searchUsers(query, limit = 10) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in");
  }

  const response = await fetch(
    `${API_URL}/bbjd/v1/users/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to search users");
  }

  return response.json();
}
