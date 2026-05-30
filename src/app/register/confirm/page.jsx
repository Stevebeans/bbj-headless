"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("confirming");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Invalid confirmation link.");
      return;
    }
    fetch(`${API_URL}/bbjd/v1/account/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((d) => {
        setStatus(d.success ? "success" : "error");
        setMessage(d.message || (d.success ? "Email confirmed!" : "Confirmation failed."));
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-gray-950 flex items-center justify-center py-12">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3">
            {status === "confirming" ? "Confirming…" : status === "success" ? "You're all set!" : "Hmm…"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          <Link href="/" className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg">
            Go to Big Brother Junkies
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function RegisterConfirmPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <ConfirmContent />
    </Suspense>
  );
}
