"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing confirmation token.");
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(`${API_URL}/bbjd/v1/email/confirm/${token}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage("Your subscription is confirmed! You'll receive notifications when new posts are published.");
        } else {
          setStatus("error");
          setMessage(data.message || "Invalid or expired confirmation link.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Confirming your subscription...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-display text-primary-500 dark:text-primary-400 mb-2">You're Confirmed!</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
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
            <h1 className="text-2xl font-display text-red-600 dark:text-red-400 mb-2">Confirmation Failed</h1>
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

export default function ConfirmPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" /></div>}>
      <ConfirmContent />
    </Suspense>
  );
}
