"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import {
  getPlans,
  getSubscription,
  createStripeCheckout,
  createPayPalOrder,
  capturePayPalOrder,
  createPayPalSubscription,
} from "@/lib/api/billing";

// Roles that get supporter benefits (should match WordPress settings)
const SUPPORTER_ROLES = ["administrator", "editor", "supporter", "lifetime"];

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export default function BecomeSupporterPage() {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const { openModal } = useAuthModal();

  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState(null);

  // Check if user has a supporter role
  const isSupporter = isAuthenticated && Array.isArray(user?.user_roles) && user.user_roles.some(role => SUPPORTER_ROLES.includes(role));

  // Load plans and check subscription status
  useEffect(() => {
    const loadData = async () => {
      try {
        const plansResult = await getPlans();
        setPlans(plansResult.plans || []);
        setPaypalClientId(plansResult.paypal_client_id);

        if (isAuthenticated) {
          // Check if user has an active subscription
          try {
            const subResult = await getSubscription();
            setHasSubscription(subResult.has_subscription);
          } catch (subErr) {
            console.warn("Subscription check failed:", subErr.message);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [authLoading, isAuthenticated]);

  // Load PayPal SDK when needed
  const loadPayPalSDK = useCallback(() => {
    if (!paypalClientId || window.paypal) {
      setPaypalReady(!!window.paypal);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture&vault=true&disable-funding=credit`;
    script.async = true;
    script.onload = () => setPaypalReady(true);
    script.onerror = () => setError("Failed to load PayPal");
    document.body.appendChild(script);
  }, [paypalClientId]);

  useEffect(() => {
    if (paypalClientId && isAuthenticated && !hasSubscription) {
      loadPayPalSDK();
    }
  }, [paypalClientId, isAuthenticated, hasSubscription, loadPayPalSDK]);

  // Render PayPal buttons when SDK is ready
  useEffect(() => {
    if (!paypalReady || !window.paypal || hasSubscription || !isAuthenticated) return;

    // Small delay to ensure DOM container is rendered after auth state change
    const timer = setTimeout(() => {
      const container = document.getElementById("paypal-button-container");
      if (!container) return;

      // Clear previous buttons
      container.innerHTML = "";

    const successUrl = `${SITE_URL}/checkout/success?processor=paypal`;
    const cancelUrl = `${SITE_URL}/checkout/cancel`;

    window.paypal
      .Buttons({
        style: {
          layout: "horizontal",
          color: "blue",
          shape: "rect",
          label: "pay",
          height: 45,
        },
        createOrder: async () => {
          setProcessing(true);
          setError(null);
          try {
            if (selectedPlan === "lifetime") {
              const result = await createPayPalOrder(successUrl, cancelUrl);
              return result.order_id;
            } else {
              // For subscriptions, create subscription and return approval URL
              const result = await createPayPalSubscription(selectedPlan, successUrl, cancelUrl);
              // PayPal SDK handles redirect for subscriptions
              window.location.href = result.approve_url;
              return null;
            }
          } catch (err) {
            setError(err.message);
            setProcessing(false);
            throw err;
          }
        },
        onApprove: async (data) => {
          try {
            if (selectedPlan === "lifetime") {
              await capturePayPalOrder(data.orderID);
              await refreshUser();
              window.location.href = `${SITE_URL}/checkout/success?processor=paypal`;
            }
          } catch (err) {
            setError(err.message);
            setProcessing(false);
          }
        },
        onCancel: () => {
          setProcessing(false);
        },
        onError: (err) => {
          setError("PayPal payment failed. Please try again.");
          setProcessing(false);
        },
      })
      .render("#paypal-button-container");
    }, 50);

    return () => clearTimeout(timer);
  }, [paypalReady, selectedPlan, hasSubscription, isAuthenticated, refreshUser]);

  // Handle Stripe checkout
  const handleStripeCheckout = async () => {
    if (!isAuthenticated) {
      openModal("login");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const successUrl = `${SITE_URL}/checkout/success`;
      const cancelUrl = `${SITE_URL}/checkout/cancel`;
      const result = await createStripeCheckout(selectedPlan, successUrl, cancelUrl);
      window.location.href = result.checkout_url;
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  if (loading || authLoading) {
    return (
      <main className="v2-primary-container">
        <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-900 dark:border dark:border-slate-800">
          <div className="animate-pulse space-y-8 max-w-4xl mx-auto">
            <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mx-auto" />
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mx-auto" />
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Already a supporter (via role or subscription)
  if (isSupporter || hasSubscription) {
    return (
      <main className="v2-primary-container">
        <div className="rounded-xl bg-white p-8 shadow dark:bg-gray-900 dark:border dark:border-slate-800 max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">&#11088;</span>
            </div>
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-3">
              Thank You for Being a Supporter!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Your support helps keep Big Brother Junkies running. Enjoy your ad-free experience!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/settings?tab=premium"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Subscription
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium rounded-lg transition-colors"
              >
                Browse Ad-Free
              </Link>
            </div>
        </div>
      </main>
    );
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);

  return (
    <main className="v2-primary-container">
      <div className="rounded-xl bg-white p-6 md:p-8 shadow dark:bg-gray-900 dark:border dark:border-slate-800">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Become a BBJ Supporter
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Enjoy an ad-free experience and help keep independent Big Brother coverage alive
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Plan Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              disabled={processing}
              className={`relative p-6 rounded-xl border-2 text-left transition-all ${
                selectedPlan === plan.id
                  ? "border-primary-500 bg-slate-50 dark:bg-slate-800 shadow-lg ring-2 ring-primary-500/20"
                  : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
              } ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-secondary-500 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                  plan.badge === "Lifetime"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    : "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400"
                }`}>
                  {plan.badge}
                </span>
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                {plan.interval && (
                  <span className="text-gray-500 dark:text-gray-400 ml-1">
                    /{plan.interval === "month" ? "mo" : "yr"}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {plan.description}
              </p>

              {/* Selection Indicator */}
              <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === plan.id
                  ? "border-primary-500 bg-primary-500"
                  : "border-slate-300 dark:border-slate-600"
              }`}>
                {selectedPlan === plan.id && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

          {/* Payment Section */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Complete Your Purchase
          </h2>

          {!isAuthenticated ? (
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please log in or create an account to continue
              </p>
              <button
                onClick={() => openModal("login")}
                className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                Log In / Sign Up
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-w-md mx-auto">
              {/* Selected Plan Summary */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Selected Plan:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {selectedPlanData?.name} - {selectedPlanData?.price}
                    {selectedPlanData?.interval && `/${selectedPlanData.interval === "month" ? "mo" : "yr"}`}
                  </span>
                </div>
              </div>

              {/* Stripe Button */}
              <button
                onClick={handleStripeCheckout}
                disabled={processing}
                className="w-full py-3 bg-[#635BFF] hover:bg-[#5851DB] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                    </svg>
                    Pay with Card
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-slate-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400">or</span>
                </div>
              </div>

              {/* PayPal Button Container */}
              <div id="paypal-button-container" className={processing ? "opacity-50 pointer-events-none" : ""} />
            </div>
          )}
        </div>

          {/* Benefits Section */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            What You Get as a Supporter
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                ),
                title: "Ad-Free Experience",
                description: "Browse the entire site without any ads interrupting your reading",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                ),
                title: "Priority Push Notifications",
                description: "Get breaking feed update alerts before anyone else",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                title: "Exclusive Supporter Badge",
                description: "Show your support with a special badge next to your name",
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
                title: "Support Independent Coverage",
                description: "Help us continue providing quality BB content without corporate influence",
              },
            ].map((benefit, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-500/10 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg flex items-center justify-center">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

          {/* FAQ Link */}
          <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
            Questions?{" "}
            <Link href="/settings?tab=help" className="text-primary-500 hover:underline">
              Check our FAQ
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-primary-500 hover:underline">
              contact us
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
