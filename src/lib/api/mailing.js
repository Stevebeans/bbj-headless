/**
 * Mailing API functions (Resend-backed newsletter system)
 * All endpoints require authentication via adminFetch.
 */

import { adminFetch } from "./admin";

export async function getMailingStats() {
  return adminFetch("/email/stats");
}

export async function getMailingLists() {
  return adminFetch("/email/lists");
}

export async function getListSubscribers(
  listSlug = "post-notifications",
  { page = 1, perPage = 20, status = "", search = "", timeframe = "all", flag = "" } = {}
) {
  const params = new URLSearchParams({
    list: listSlug,
    page: String(page),
    per_page: String(perPage),
    timeframe,
  });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (flag) params.set("flag", flag);
  return adminFetch(`/email/subscribers?${params.toString()}`);
}

export async function getListProblems(listSlug) {
  return adminFetch(`/email/lists/${encodeURIComponent(listSlug)}/problems`);
}

export async function bulkSubscriberAction(action, subscriberIds) {
  // Chunks > 500 IDs into 500-row calls to respect the server cap.
  const chunkSize = 500;
  let processed = 0;
  const errors = [];
  for (let i = 0; i < subscriberIds.length; i += chunkSize) {
    const chunk = subscriberIds.slice(i, i + chunkSize);
    const res = await adminFetch("/email/subscribers/bulk-action", {
      method: "POST",
      body: JSON.stringify({ action, subscriber_ids: chunk }),
    });
    processed += res.processed || 0;
    if (res.errors?.length) errors.push(...res.errors);
  }
  return { success: true, processed, errors };
}

export async function sendTestMailingEmail(email = "") {
  return adminFetch("/email/test", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function sendReconfirmation(subscriberIds) {
  return adminFetch("/email/reconfirm", {
    method: "POST",
    body: JSON.stringify({ subscriber_ids: subscriberIds }),
  });
}
