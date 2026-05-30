/**
 * Welcome/transactional email template admin API.
 * Requires admin_settings permission via adminFetch.
 */
import { adminFetch } from "./admin";

export async function getWelcomeEmails() {
  return adminFetch("/welcome-emails");
}

export async function saveWelcomeEmails(templates) {
  return adminFetch("/welcome-emails", {
    method: "POST",
    body: JSON.stringify(templates),
  });
}

export async function sendWelcomeEmailTest(which) {
  return adminFetch("/welcome-emails/test", {
    method: "POST",
    body: JSON.stringify({ which }),
  });
}
