// src/lib/api/bean.js
// Client helper: POST a question (+ within-session history) to the Bean chat
// endpoint and stream the reply via callbacks.
import { getToken } from "@/lib/auth/cookies";
import { parseSse } from "@/lib/bean/sse";

const WP = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Stream a Bean chat answer.
 * @param {string} question
 * @param {Array<{role:'user'|'assistant',content:string}>} history  prior turns
 * @param {{ onSources?, onDelta?, onDone?, onError? }} cb
 * @param {AbortSignal} [signal]
 */
export async function streamBeanChat(question, history, cb = {}, signal, userName = "") {
  const token = getToken();
  let res;
  try {
    res = await fetch("/api/bean/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ question, history, userName }),
      signal,
    });
  } catch {
    cb.onError?.("Steve's taking a nap, try again 🫘");
    return;
  }

  if (res.status === 401) {
    cb.onError?.("Log in to chat with the Bean.");
    return;
  }
  if (!res.ok || !res.body) {
    cb.onError?.("Steve's taking a nap, try again 🫘");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    let chunk;
    try {
      chunk = await reader.read();
    } catch {
      break; // aborted / connection dropped
    }
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const { events, rest } = parseSse(buffer);
    buffer = rest;
    for (const e of events) {
      if (e.type === "sources") cb.onSources?.(e.sources);
      else if (e.type === "card") cb.onCard?.(e.card);
      else if (e.type === "capped") cb.onCapped?.(e);
      else if (e.type === "quota") cb.onQuota?.(e);
      else if (e.type === "delta") cb.onDelta?.(e.text);
      else if (e.type === "done") cb.onDone?.();
      else if (e.type === "error") cb.onError?.(e.message);
    }
  }
}

/** Current Bean tier + whether this user has cross-session memory. */
export async function getBeanStatus() {
  const token = getToken();
  if (!token) return { tier: "free", memory: false };
  try {
    const res = await fetch(`${WP}/bbjd/v1/bean/check`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return { tier: "free", memory: false };
    return await res.json();
  } catch {
    return { tier: "free", memory: false };
  }
}

/** Wipe what the Bean remembers about the current user. */
export async function resetBeanMemory() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${WP}/bbjd/v1/bean/memory`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to reset memory");
  return res.json();
}
