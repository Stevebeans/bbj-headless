/**
 * Premium members admin client (/admin/premium). All routes gated on
 * user_management. Cancel is always end-of-period (member keeps access
 * until the term they paid for runs out); there is no immediate revoke.
 */
import { adminFetch } from "./admin";

export async function getSubscriptions({ page = 1, perPage = 25, status = "" } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage });
  if (status) params.set("status", status);
  return adminFetch(`/admin/subscriptions?${params}`);
}

export async function getSubscriptionStats() {
  return adminFetch("/admin/subscriptions/stats");
}

export async function cancelSubscription(id) {
  return adminFetch(`/admin/subscriptions/${id}/cancel`, { method: "POST" });
}
