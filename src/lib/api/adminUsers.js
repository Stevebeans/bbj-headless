/**
 * Admin User Management client.
 * All calls require the admin JWT (handled inside adminFetch).
 */
import { adminFetch } from "./admin";
import { buildListQuery } from "./adminContent";

export async function listAdminUsers({ search = "", role = "", page = 1, perPage = 25 } = {}) {
  let query = buildListQuery({ search, page, perPage });
  if (role) {
    query += query ? `&role=${encodeURIComponent(role)}` : `?role=${encodeURIComponent(role)}`;
  }
  return adminFetch(`/admin/users${query}`);
}

export async function getAdminUser(id) {
  return adminFetch(`/admin/users/${id}`);
}

export async function updateAdminUser(id, fields) {
  return adminFetch(`/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
  });
}

export async function updateUserRoles(id, roles) {
  return adminFetch(`/admin/users/${id}/roles`, {
    method: "PUT",
    body: JSON.stringify({ roles }),
  });
}

export async function sendPasswordReset(id) {
  return adminFetch(`/admin/users/${id}/send-password-reset`, { method: "POST" });
}

export async function resendUserEmail(id, type) {
  return adminFetch(`/admin/users/${id}/resend-email`, {
    method: "POST",
    body: JSON.stringify({ type }),
  });
}
