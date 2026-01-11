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
 */
export async function postComment(postId, content, parentId = 0) {
  const token = localStorage.getItem("bbj_token");
  if (!token) {
    throw new Error("You must be logged in to comment");
  }

  const response = await fetch(`${API_URL}/bbjd/v1/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      post_id: postId,
      content,
      parent_id: parentId,
    }),
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
