"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

const STATUS_MESSAGES = {
  subscribed: "You're subscribed! New posts will hit your inbox.",
  already_subscribed: "You're already subscribed.",
  pending: "Check your inbox — we just sent a confirmation link.",
  resubscribed_pending: "Welcome back! Check your inbox to re-confirm.",
};

export function SubscribeWidget() {
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [message, setMessage] = useState("");

  // Pre-fill with the logged-in user's email as a courtesy — still editable.
  useEffect(() => {
    if (isAuthenticated && user?.user_email && !email) {
      setEmail(user.user_email);
    }
  }, [isAuthenticated, user, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitEmail = email.trim();
    if (!submitEmail) return;

    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/bbjd/v1/email/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: submitEmail,
          lists: ["post-notifications"],
        }),
      });
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Subscribe failed");
      }
      setStatus("success");
      setMessage(STATUS_MESSAGES[data.status] || "You're subscribed!");
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Something went wrong. Try again.");
    }
  };

  return (
    <aside className="bg-primary-500 rounded-lg p-5 shadow-sm">
      <h3 className="font-display text-2xl text-white leading-none mb-2">
        Newsletter
      </h3>
      <p className="text-sm text-white/85 mb-4 leading-snug">
        Get an email each time we publish a new post — no spam, just the latest Big Brother news.
      </p>

      {status === "success" ? (
        <p className="bg-secondary-500/15 border border-secondary-500/40 text-white text-sm font-medium rounded-md px-3 py-2.5">
          ✓ {message}
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoComplete="email"
            className="w-full px-3 py-2.5 text-sm bg-white/15 border border-white/30 text-white placeholder-white/70 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500/60 focus:border-secondary-500/60 transition-colors"
          />
          <button
            type="submit"
            disabled={status === "loading" || !email.trim()}
            className="w-full bg-secondary-500 hover:bg-secondary-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-bold tracking-wide uppercase py-2.5 rounded-md transition-colors"
          >
            {status === "loading" ? "Subscribing…" : "Subscribe"}
          </button>
          {status === "error" && (
            <p className="text-red-200 text-xs pt-1">{message}</p>
          )}
        </form>
      )}
    </aside>
  );
}
