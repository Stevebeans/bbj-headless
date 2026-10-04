import { adminFetch } from "@/lib/api/admin";

const q = (params) => {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") s.set(k, v); });
  const str = s.toString();
  return str ? `?${str}` : "";
};

export const getStoriesSettings = () => adminFetch("/stories/settings");
export const saveStoriesSettings = (patch) => adminFetch("/stories/settings", { method: "POST", body: JSON.stringify(patch) });
export const resolveIgUserId = () => adminFetch("/stories/settings/resolve-ig", { method: "POST" });
export const testStorySource = (source) => adminFetch("/stories/sources/test", { method: "POST", body: JSON.stringify(source) });
export const getInbox = (params) => adminFetch(`/stories/inbox${q(params)}`);
export const getInboxPrefill = (id) => adminFetch(`/stories/inbox/${id}/prefill`);
export const queueInboxQuickie = (id, body) => adminFetch(`/stories/inbox/${id}/quickie`, { method: "POST", body: JSON.stringify(body) });
export const dismissInboxItem = (id) => adminFetch(`/stories/inbox/${id}/dismiss`, { method: "POST" });
export const restoreInboxItem = (id) => adminFetch(`/stories/inbox/${id}/restore`, { method: "POST" });
export const runIngest = () => adminFetch("/stories/ingest", { method: "POST" });
export const getStoryRuns = () => adminFetch("/stories/runs");
