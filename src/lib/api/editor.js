import { adminFetch } from "./admin";

// --- Posts ---

export async function listDrafts({ status = "any", page = 1, perPage = 20 } = {}) {
  const params = new URLSearchParams({ status, page, per_page: perPage });
  return adminFetch(`/editor/posts?${params}`);
}

export async function createPost(data) {
  return adminFetch("/editor/posts", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPost(postId) {
  return adminFetch(`/editor/posts/${postId}`);
}

export async function updatePost(postId, data) {
  return adminFetch(`/editor/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePost(postId) {
  return adminFetch(`/editor/posts/${postId}`, {
    method: "DELETE",
  });
}

export async function changePostStatus(postId, status) {
  return adminFetch(`/editor/posts/${postId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

// --- Media ---

export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append("file", file);

  // Must use raw fetch for FormData — adminFetch sets Content-Type: application/json
  const { getToken } = await import("@/lib/auth/cookies");
  const token = getToken();

  const apiBase = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";
  const res = await fetch(`${apiBase}/bbjd/v1/editor/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Upload failed: ${res.status}`);
  }

  return res.json();
}

// --- Categories ---

export async function getCategories() {
  return adminFetch("/editor/categories");
}

// --- Review ---

export async function getReviewQueue({ page = 1, perPage = 20 } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  return adminFetch(`/editor/review?${params}`);
}

export async function reviewPost(postId, action, note = "") {
  return adminFetch(`/editor/review/${postId}`, {
    method: "PUT",
    body: JSON.stringify({ action, note }),
  });
}

// --- AI ---

export async function generateTitle(content, categoryName) {
  const res = await fetch("/api/ai/generate-title", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, categoryName }),
  });
  if (!res.ok) throw new Error("Failed to generate title");
  return res.json();
}

export async function generateMeta(content) {
  const res = await fetch("/api/ai/generate-meta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to generate meta");
  return res.json();
}

export async function generateAltText(imageUrl) {
  const res = await fetch("/api/ai/generate-alt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl }),
  });
  if (!res.ok) throw new Error("Failed to generate alt text");
  return res.json();
}
