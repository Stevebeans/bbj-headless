"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getSubscription, capturePayPalOrder } from "@/lib/api/billing";

function SuccessContent() {
  const searchParams = useSearchParams();
  const { isAuthenticated, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const processor = searchParams.get("processor");
  const paypalOrderId = searchParams.get("token"); // PayPal returns token param for orders

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        // If PayPal order, capture it first
        if (processor === "paypal" && paypalOrderId) {
          await capturePayPalOrder(paypalOrderId);
        }

        // Refresh user to get updated role
        await refreshUser();

        // Fetch subscription details
        if (isAuthenticated) {
          const result = await getSubscription();
          if (result.has_subscription) {
            setSubscription(result.subscription);
          }
        }
      } catch (err) {
        // Don't show error if it's already captured (user refreshing page)
        if (!err.message?.includes("already")) {
          setError(err.message);
        }
        // Still try to fetch subscription
        try {
          const result = await getSubscription();
          if (result.has_subscription) {
            setSubscription(result.subscription);
          }
        } catch {
          // Ignore
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      handleSuccess();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, processor, paypalOrderId, refreshUser]);

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
            <p className="text-amber-600 dark:text-amber-400 mb-6">
              {error}
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Thank you for becoming a BBJ Supporter! Your support helps us continue providing quality Big Brother coverage.
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
          <div className="mb-8">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
              What's Next?
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
                Enable priority push notifications in Settings
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
              Start Browsing Ad-Free
            </Link>
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
