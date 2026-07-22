import { getToken } from "@/lib/auth/cookies";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

async function authed(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error("not-authenticated");
  const res = await fetch(`${API_URL}/bbjd/v1${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || `Request failed: ${res.status}`);
    err.reason = data.reason;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const getThreads = (page = 1) => authed(`/dm/threads?page=${page}`);
export const getMessages = (threadId, beforeId) =>
  authed(`/dm/threads/${threadId}/messages${beforeId ? `?before_id=${beforeId}` : ""}`);
export const sendMessage = (recipientId, body) =>
  authed("/dm/send", { method: "POST", body: JSON.stringify({ recipient_id: recipientId, body }) });
export const markThreadRead = (threadId) =>
  authed(`/dm/threads/${threadId}/read`, { method: "POST" });
export const getDmUnreadCount = () => authed("/dm/unread-count");
export const getBlocked = () => authed("/dm/blocks");
export const blockUser = (userId) =>
  authed("/dm/blocks", { method: "POST", body: JSON.stringify({ user_id: userId }) });
export const unblockUser = (userId) =>
  authed("/dm/blocks", { method: "DELETE", body: JSON.stringify({ user_id: userId }) });
export const reportThread = (threadId, messageId, note) =>
  authed("/dm/report", { method: "POST", body: JSON.stringify({ thread_id: threadId, message_id: messageId, note }) });
export const getDmPrivacy = () => authed("/dm/privacy");
export const saveDmPrivacy = (privacy) =>
  authed("/dm/privacy", { method: "POST", body: JSON.stringify({ privacy }) });
