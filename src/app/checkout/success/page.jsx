"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getSubscription, capturePayPalOrder } from "@/lib/api/billing";

// How long to wait for the activation webhook (Stripe checkout.session.completed /
// PayPal BILLING.SUBSCRIPTION.ACTIVATED) to create the subscription row + assign
// the supporter role. We poll because activation is webhook-driven and can lag a
// few seconds behind the redirect back to this page.
const ACTIVATION_POLL_ATTEMPTS = 6;
const ACTIVATION_POLL_INTERVAL_MS = 2000;
const REDIRECT_SECONDS = 10;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function SuccessContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [activated, setActivated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  const processor = searchParams.get("processor");
  const token = searchParams.get("token"); // order id (lifetime) OR EC token (subscription)
  const payerId = searchParams.get("PayerID"); // only present on one-time ORDER approvals
  const subscriptionId = searchParams.get("subscription_id"); // only present on SUBSCRIPTION approvals

  // A PayPal *order* (one-time lifetime) needs an explicit capture. A PayPal
  // *subscription* (monthly/annual) must NOT be captured — it's activated by the
  // BILLING.SUBSCRIPTION.ACTIVATED webhook. Calling capture on a subscription is
  // what produced the "could not be performed" (PayPal 422 ORDER_NOT_APPROVED).
  const isPayPalOrder =
    processor === "paypal" && !!token && !!payerId && !subscriptionId;

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        // One-time lifetime order → capture (this activates immediately server-side).
        if (isPayPalOrder) {
          try {
            await capturePayPalOrder(token);
          } catch (err) {
            // "already captured" just means the page was refreshed — not a real error.
            if (!err.message?.toLowerCase().includes("already")) {
              setError(
                "We're finalizing your payment. If your premium status doesn't appear shortly, please contact us."
              );
            }
          }
        }

        // Poll for activation. Stripe + PayPal subscriptions activate via webhook,
        // so the row may not exist on the first check.
        for (let attempt = 0; attempt < ACTIVATION_POLL_ATTEMPTS; attempt++) {
          if (cancelled) return;
          try {
            const result = await getSubscription();
            if (result?.has_subscription) {
              setSubscription(result.subscription);
              setActivated(true);
              break;
            }
          } catch {
            // ignore and retry
          }
          if (attempt < ACTIVATION_POLL_ATTEMPTS - 1) {
            await sleep(ACTIVATION_POLL_INTERVAL_MS);
          }
        }

        // Pull fresh roles so ad-hiding/supporter badge reflect the new status.
        await refreshUser();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Once activation is CONFIRMED, count down then do a FULL document load to "/".
  // The hard navigation re-fetches auth/ad state so the global sticky ad clears
  // (a client-side route change would keep the stale ad mounted). We only redirect
  // on confirmed success — on error or still-pending activation we leave the user
  // here so they can read the message and act, instead of dumping them on a
  // still-ad-filled homepage.
  useEffect(() => {
    if (loading || !activated) return;
    if (seconds <= 0) {
      window.location.href = "/";
      return;
    }
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [loading, activated, seconds]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-gray-950 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Processing your payment...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-gray-950 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-3">
            Welcome to the Family!
          </h1>

          {error ? (
            <p className="text-amber-600 dark:text-amber-400 mb-6">{error}</p>
          ) : activated ? (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {subscription?.tier === "full_bean"
                ? "You've got the Full Bean! Unlimited chats with the smartest Bean there is, and he'll start remembering what matters about you between conversations."
                : "Thank you for becoming a BBJ Supporter! Your support helps us continue providing quality Big Brother coverage."}
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for your payment! Your premium status is being activated and should appear within a minute. If it
              doesn&apos;t, refresh this page or contact us.
            </p>
          )}

          {/* Subscription Details */}
          {subscription && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-8 text-left">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                Your Subscription
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Plan</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {subscription.plan_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Amount</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {subscription.amount_display}
                    {subscription.plan_type !== "lifetime" && `/${subscription.plan_type === "monthly" ? "mo" : "yr"}`}
                  </span>
                </div>
                {subscription.plan_type !== "lifetime" && subscription.current_period_end && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Next billing date</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {new Date(subscription.current_period_end).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Payment method</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {subscription.processor}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* What's Next */}
          {activated && (
            <div className="mb-8">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                What&apos;s Next?
              </h2>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Ads are now hidden across the site
                </li>
                <li className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Your supporter badge is active
                </li>
                <li className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {subscription?.tier === "full_bean"
                    ? "Unlimited Bean chats on the smartest model - ask him anything"
                    : "30 Bean chats a day - say hi at Ask the Bean"}
                </li>
                {subscription?.tier === "full_bean" && (
                  <li className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    The Bean remembers what matters about you between chats
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Auto-redirect notice — only when activation is confirmed; the hard
              reload clears the sticky ad. */}
          {activated && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4" aria-live="polite">
              Taking you to an ad-free site in {seconds} second{seconds === 1 ? "" : "s"}…
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/"
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
              Start Browsing Ad-Free
            </a>
            <Link
              href="/settings?tab=premium"
              className="px-6 py-3 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors"
            >
              View Settings
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-slate-100 dark:bg-gray-950 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
