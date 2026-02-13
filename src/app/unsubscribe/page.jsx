"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!email || !token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link.");
      return;
    }

    const unsubscribe = async () => {
      try {
        const res = await fetch(
          `${API_URL}/bbjd/v1/email/unsubscribe?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (data.success) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(data.message || "Invalid unsubscribe link.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    unsubscribe();
  }, [email, token]);

  const handleResubscribe = async () => {
    try {
      const res = await fetch(`${API_URL}/bbjd/v1/email/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, list: "post-notifications" }),
      });
      const data = await res.json();

      if (data.status === "pending" || data.status === "already_subscribed") {
        setStatus("resubscribed");
      }
    } catch {
      // Silently fail - they can try again manually
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Processing your request...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-display text-gray-800 dark:text-gray-200 mb-2">You've Been Unsubscribed</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You won't receive any more emails from Big Brother Junkies.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleResubscribe}
                className="text-primary-500 hover:text-primary-600 dark:text-primary-400 text-sm underline"
              >
                Was this a mistake? Re-subscribe
              </button>
              <div>
                <Link href="/" className="btn-primary inline-block px-6 py-2">
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        )}

        {status === "resubscribed" && (
          <div>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-display text-green-600 dark:text-green-400 mb-2">Welcome Back!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Check your inbox to confirm your re-subscription.
            </p>
            <Link href="/" className="btn-primary inline-block px-6 py-2">
              Back to Home
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-display text-red-600 dark:text-red-400 mb-2">Something Went Wrong</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
            <Link href="/" className="btn-primary inline-block px-6 py-2">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" /></div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
