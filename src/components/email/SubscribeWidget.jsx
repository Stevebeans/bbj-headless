"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

export function SubscribeWidget() {
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitEmail = isAuthenticated ? user?.user_email : email;
    if (!submitEmail) return;

    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/bbjd/v1/email/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submitEmail, list: "post-notifications" }),
      });
      const data = await res.json();

      if (data.status === "already_subscribed") {
        setStatus("success");
        setMessage("You're already subscribed!");
      } else if (data.status === "pending") {
        setStatus("success");
        setMessage("Check your inbox to confirm!");
      } else {
        setStatus("success");
        setMessage("You're subscribed!");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="v2-sidebar-container p-4 text-center">
        <p className="text-green-600 dark:text-green-400 font-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className="v2-sidebar-container p-4">
      <h3 className="v2-ad-subheader">Newsletter</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Get the latest Big Brother updates delivered to your inbox!
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        {!isAuthenticated && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full v2-btn text-sm"
        >
          {status === "loading" ? "Subscribing..." : "Subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-500 text-xs mt-2">{message}</p>
      )}
    </div>
  );
}
