import { getToken } from "@/lib/auth/cookies";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

export async function getTracker(days = 30) {
  const res = await fetch(`${API_URL}/bbjd/v1/fan-votes/tracker?days=${days}`);
  if (!res.ok) throw new Error(`Tracker fetch failed: ${res.status}`);
  return res.json();
}

export async function getMyVote() {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_URL}/bbjd/v1/fan-vote/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.player_id ?? null;
}

export async function castVote(playerId) {
  const token = getToken();
  if (!token) throw new Error("not-authenticated");
  const res = await fetch(`${API_URL}/bbjd/v1/fan-vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ player_id: playerId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Vote failed: ${res.status}`);
  return data;
}

export async function saveMoverNote(playerId, note) {
  const token = getToken();
  const res = await fetch(`${API_URL}/bbjd/v1/fan-vote/note`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ player_id: playerId, note }),
  });
  if (!res.ok) throw new Error("Note save failed");
  return res.json();
}

export async function getMyBallot() {
  const token = getToken();
  if (!token) return { order: [], weight: 1, prefs: null };
  const res = await fetch(`${API_URL}/bbjd/v1/fan-vote/ballot`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { order: [], weight: 1, prefs: null };
  const data = await res.json();
  return { order: data.order || [], weight: Number(data.weight) || 1, prefs: data.prefs || null };
}

export async function savePrefs(prefs) {
  const token = getToken();
  if (!token) throw new Error("not-authenticated");
  const res = await fetch(`${API_URL}/bbjd/v1/fan-vote/prefs`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(prefs),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Prefs save failed: ${res.status}`);
  return data;
}

export async function saveBallot(order) {
  const token = getToken();
  if (!token) throw new Error("not-authenticated");
  const res = await fetch(`${API_URL}/bbjd/v1/fan-vote/ballot`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ order }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Ballot save failed: ${res.status}`);
  return data;
}
