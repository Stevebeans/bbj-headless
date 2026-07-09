"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import {
  getAdminUser,
  updateAdminUser,
  updateUserRoles,
  sendPasswordReset,
  resendUserEmail,
} from "@/lib/api/adminUsers";
import { getRoles } from "@/lib/api/admin";
import { getUserComments } from "@/lib/api/users";
import CommentHistoryItem from "@/components/users/CommentHistoryItem";

const RESEND_TYPES = [
  { value: "confirm", label: "Confirmation" },
  { value: "welcome", label: "Welcome" },
  { value: "premium", label: "Premium" },
];

function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();

  const [detail, setDetail] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);

  // Roles editor
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [rolesSaving, setRolesSaving] = useState(false);
  const [rolesMsg, setRolesMsg] = useState(null);

  // Account actions
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMsg, setAccountMsg] = useState(null);
  const [resetSending, setResetSending] = useState(false);
  const [resetMsg, setResetMsg] = useState(null);
  const [resendType, setResendType] = useState("confirm");
  const [resendSending, setResendSending] = useState(false);
  const [resendMsg, setResendMsg] = useState(null);

  // Activity
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await getAdminUser(id);
      setDetail(data.user);
      setEmail(data.user.email || "");
      setDisplayName(data.user.display_name || "");
      setSelectedRoles(data.user.roles || []);
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    getRoles().then((data) => setRoles(data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setCommentsLoading(true);
    getUserComments(id, 1, 10)
      .then((data) => setComments(data.success ? data.comments || [] : []))
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [id]);

  const isSelf = !!currentUser && !!detail && Number(currentUser.id) === Number(detail.id);

  const toggleRole = (key, checked) => {
    setSelectedRoles((prev) => (checked ? [...prev, key] : prev.filter((r) => r !== key)));
  };

  const handleSaveRoles = async () => {
    setRolesSaving(true);
    setRolesMsg(null);
    try {
      const data = await updateUserRoles(id, selectedRoles);
      setDetail((prev) => (prev ? { ...prev, roles: data.roles || selectedRoles } : prev));
      setRolesMsg({ type: "success", text: "Roles updated." });
    } catch (err) {
      setRolesMsg({ type: "error", text: err.message });
    } finally {
      setRolesSaving(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!window.confirm(`Update account details for ${detail.display_name}?`)) return;
    setAccountSaving(true);
    setAccountMsg(null);
    try {
      const data = await updateAdminUser(id, { email, display_name: displayName });
      setDetail(data.user);
      setEmail(data.user.email || "");
      setDisplayName(data.user.display_name || "");
      setAccountMsg({ type: "success", text: "Account updated." });
    } catch (err) {
      setAccountMsg({ type: "error", text: err.message });
    } finally {
      setAccountSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!window.confirm(`Send a password reset email to ${detail.email}?`)) return;
    setResetSending(true);
    setResetMsg(null);
    try {
      await sendPasswordReset(id);
      setResetMsg({ type: "success", text: "Password reset email sent." });
    } catch (err) {
      setResetMsg({ type: "error", text: err.message });
    } finally {
      setResetSending(false);
    }
  };

  const handleResendEmail = async () => {
    const label = RESEND_TYPES.find((t) => t.value === resendType)?.label || resendType;
    if (!window.confirm(`Resend the ${label} email to ${detail.email}?`)) return;
    setResendSending(true);
    setResendMsg(null);
    try {
      await resendUserEmail(id, resendType);
      setResendMsg({ type: "success", text: `${label} email sent.` });
    } catch (err) {
      setResendMsg({ type: "error", text: err.message });
    } finally {
      setResendSending(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
      </div>
    );
  }

  if (pageError || !detail) {
    return (
      <div>
        <Link href="/admin/users" className="text-sm text-primary-500 hover:text-primary-600">
          ← Users
        </Link>
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{pageError || "User not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-primary-500 hover:text-primary-600">
        ← Users
      </Link>

      {/* Profile */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6 mt-4">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-4">Profile</h2>
        <div className="flex items-start gap-4">
          {detail.avatar ? (
            <Image
              src={detail.avatar}
              alt=""
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-500 dark:text-slate-400 shrink-0">
              {getInitials(detail.display_name)}
            </div>
          )}
          <div>
            <p className="text-lg font-medium text-slate-800 dark:text-white">{detail.display_name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{detail.user_login}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{detail.email}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Registered {detail.registered ? new Date(detail.registered).toLocaleDateString() : "—"}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {(detail.roles || []).map((r) => (
                <span key={r} className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                  {r}
                </span>
              ))}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              {detail.comment_count ?? 0} comments
              {detail.karma !== null && detail.karma !== undefined ? ` · ${detail.karma} karma` : ""}
            </p>
          </div>
        </div>
      </section>

      {/* Subscription */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-4">Subscription</h2>
        {!detail.subscription ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No subscription.</p>
        ) : (
          <div className="space-y-1 text-sm text-slate-700 dark:text-slate-300">
            {/* Backend exposes plan_name/tier/plan_type (BillingRoutes convention), not a single `plan` key */}
            <p><span className="text-slate-500 dark:text-slate-400">Plan:</span> {detail.subscription.plan_name || [detail.subscription.tier, detail.subscription.plan_type].filter(Boolean).join(" ") || "—"}</p>
            <p><span className="text-slate-500 dark:text-slate-400">Status:</span> {detail.subscription.status || "—"}</p>
            <p><span className="text-slate-500 dark:text-slate-400">Processor:</span> {detail.subscription.processor || "—"}</p>
            <p>
              <span className="text-slate-500 dark:text-slate-400">Renews:</span>{" "}
              {detail.subscription.current_period_end
                ? new Date(detail.subscription.current_period_end).toLocaleDateString()
                : "—"}
            </p>
            <div className="flex gap-4 pt-2">
              {detail.subscription.stripe_customer_id && (
                <a
                  href={`https://dashboard.stripe.com/customers/${detail.subscription.stripe_customer_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                >
                  Open in Stripe →
                </a>
              )}
              {detail.subscription.paypal_subscription_id && (
                <a
                  href={`https://www.paypal.com/billing/subscriptions/${detail.subscription.paypal_subscription_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                >
                  Open in PayPal →
                </a>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Roles */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-4">Roles</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          {roles.map((r) => {
            const disabled = isSelf && r.key === "administrator";
            return (
              <label key={r.key} className={`flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 ${disabled ? "opacity-50" : ""}`}>
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(r.key)}
                  disabled={disabled}
                  onChange={(e) => toggleRole(r.key, e.target.checked)}
                  className="w-4 h-4 text-primary-500 border-slate-300 rounded focus:ring-primary-500 disabled:opacity-50"
                />
                {r.name || r.key}
              </label>
            );
          })}
        </div>
        {rolesMsg && (
          <p className={`text-sm mb-3 ${rolesMsg.type === "error" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
            {rolesMsg.text}
          </p>
        )}
        <button
          onClick={handleSaveRoles}
          disabled={rolesSaving}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {rolesSaving ? "Saving..." : "Save Roles"}
        </button>
      </section>

      {/* Account actions */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-4">Account Actions</h2>

        <div className="space-y-3 max-w-md mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          {accountMsg && (
            <p className={`text-sm ${accountMsg.type === "error" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              {accountMsg.text}
            </p>
          )}
          <button
            onClick={handleSaveAccount}
            disabled={accountSaving}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {accountSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="mb-4">
          {resetMsg && (
            <p className={`text-sm mb-2 ${resetMsg.type === "error" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              {resetMsg.text}
            </p>
          )}
          <button
            onClick={handlePasswordReset}
            disabled={resetSending}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {resetSending ? "Sending..." : "Send Password Reset Email"}
          </button>
        </div>

        <div>
          {resendMsg && (
            <p className={`text-sm mb-2 ${resendMsg.type === "error" ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
              {resendMsg.text}
            </p>
          )}
          <div className="flex items-center gap-2">
            <select
              value={resendType}
              onChange={(e) => setResendType(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
            >
              {RESEND_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <button
              onClick={handleResendEmail}
              disabled={resendSending}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resendSending ? "Sending..." : "Resend Email"}
            </button>
          </div>
        </div>
      </section>

      {/* Activity */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-4">Activity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Recent Comments</h3>
            {commentsLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin inline-block w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No comments yet.</p>
            ) : (
              <div className="space-y-3">
                {comments.map((c) => (
                  <CommentHistoryItem key={c.id} comment={c} />
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Recent Votes</h3>
            {(detail.recent_votes || []).length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No votes yet.</p>
            ) : (
              <ul className="space-y-2">
                {detail.recent_votes.map((v) => (
                  <li key={`${v.post_id}-${v.created}`} className="flex items-center gap-2 text-sm">
                    <span className={v.vote > 0 ? "text-green-600 dark:text-green-400" : v.vote < 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"}>
                      {v.vote > 0 ? "▲" : v.vote < 0 ? "▼" : "–"}
                    </span>
                    <Link href={`/live-feed-updates/${v.slug}`} className="text-primary-500 hover:text-primary-600 line-clamp-1 flex-1">
                      {v.title}
                    </Link>
                    <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {v.created ? new Date(v.created).toLocaleDateString() : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
