"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { usePremium } from "@/hooks/usePremium";
import { resolveSupporterView } from "@/lib/billing/memberState";
import UpgradeToFullBean from "@/components/premium/UpgradeToFullBean";
import {
  getPlans,
  getSubscription,
  createStripeCheckout,
  createPayPalSubscription,
} from "@/lib/api/billing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

// Feature rows for the compare table. Values are per-tier: free / supporter / full_bean.
const COMPARE_ROWS = [
  { label: "Ads", sub: null, free: "Yes", supporter: "Ad-free", full_bean: "Ad-free", bold: true },
  { label: "Interactive Player Map", sub: "heatmaps · state stats · timeline", free: false, supporter: true, full_bean: true },
  { label: "Player Comparisons", sub: "head-to-head · HoH/PoV charts", free: false, supporter: true, full_bean: true },
  { label: "Supporter badge", sub: null, free: false, supporter: true, full_bean: true },
  { label: "Ask the Bean", sub: "chats per day", free: "5", supporter: "30", full_bean: "Unlimited", bold: true },
  { label: "Bean AI model", sub: null, free: "Standard", supporter: "Standard", full_bean: "Smartest", bold: true },
  { label: "Longer conversation memory", sub: null, free: false, supporter: false, full_bean: true },
];

const FAQ_ITEMS = [
  {
    q: "Can I cancel anytime?",
    a: "Yep. Monthly plans cancel instantly; annual plans run through the period you paid for and simply don't renew. No phone calls, no guilt trips.",
  },
  {
    q: "Can I switch plans later?",
    a: "Anytime. Switches are prorated both ways, so upgrades and downgrades apply immediately and you only ever pay for what you use.",
  },
  {
    q: "I had a Season Pass — what happened to it?",
    a: "The Season Pass grew up and became the annual Supporter plan. Same idea, but now it covers a full year instead of one season.",
  },
  {
    q: "Where does the money go?",
    a: "Straight into keeping BBJ independent: servers, live-feed coverage through the long August nights, and feeding the Bean. No corporate owners, no sponsored spin.",
  },
];

function CheckIcon({ className = "w-4 h-4 text-emerald-500" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

// A single check-marked bullet in a plan card. Children may be plain text or a
// <span> with a <small> sub-label.
function Feature({ children }) {
  return (
    <li className="flex gap-2.5">
      <CheckIcon className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
      {children}
    </li>
  );
}

export default function BecomeSupporterPage() {
  const { isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const { openLogin } = useAuthModal();
  const { roles } = usePremium();

  const [plans, setPlans] = useState([]);
  // One billing toggle drives both cards (annual default, SaaS-style)
  const [billing, setBilling] = useState("year"); // 'month' | 'year'
  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const hasSubscription = !!subscription;

  // Deep-link: /become-supporter?plan=full_bean_annual pre-selects a plan
  // (e.g. from the Ask the Bean upsell card). Read from window to avoid
  // useSearchParams forcing this page into dynamic rendering.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wanted = params.get("plan");
    if (wanted === "full_bean_monthly" || wanted === "full_bean_annual") {
      setSelectedPlan(wanted);
      setBilling(wanted === "full_bean_monthly" ? "month" : "year");
      requestAnimationFrame(() => {
        document.getElementById("full-bean")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }, []);

  // Split plans by tier + interval. Lifetime is retired from the storefront
  // (existing lifetime members are grandfathered via their role).
  const supporterMonthly = plans.find((p) => (p.tier ?? "supporter") === "supporter" && p.interval === "month");
  const supporterAnnual = plans.find((p) => (p.tier ?? "supporter") === "supporter" && p.interval === "year");
  const beanMonthly = plans.find((p) => p.tier === "full_bean" && p.interval === "month");
  const beanAnnual = plans.find((p) => p.tier === "full_bean" && p.interval === "year");

  // All display pricing is computed from price_cents so price changes in the
  // plugin/processors flow through with no frontend edits.
  const perMonthDisplay = (monthly, annual) => {
    const plan = billing === "year" ? annual : monthly;
    if (!plan) return null;
    const cents = billing === "year" ? plan.price_cents / 12 : plan.price_cents;
    return `$${(cents / 100).toFixed(2)}`;
  };
  const savingsPct = (monthly, annual) => {
    if (!monthly?.price_cents || !annual?.price_cents) return 0;
    return Math.round((1 - annual.price_cents / (monthly.price_cents * 12)) * 100);
  };

  const supporterSavings = savingsPct(supporterMonthly, supporterAnnual);
  const beanSavings = savingsPct(beanMonthly, beanAnnual);
  const maxSavings = Math.max(supporterSavings, beanSavings);

  // Switching the toggle remaps the current selection to the same tier's other interval
  const switchBilling = (period) => {
    setBilling(period);
    const isBean = selectedPlan.startsWith("full_bean");
    const next = isBean
      ? (period === "year" ? beanAnnual : beanMonthly)
      : (period === "year" ? supporterAnnual : supporterMonthly);
    if (next) setSelectedPlan(next.id);
  };

  // Card CTA: select the plan for the active billing period + scroll to payment
  const choosePlan = (tier) => {
    const plan = tier === "full_bean"
      ? (billing === "year" ? beanAnnual : beanMonthly)
      : (billing === "year" ? supporterAnnual : supporterMonthly);
    if (!plan) return;
    setSelectedPlan(plan.id);
    requestAnimationFrame(() => {
      document.getElementById("complete-purchase")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // Load plans and check subscription status
  useEffect(() => {
    const loadData = async () => {
      try {
        const plansResult = await getPlans();
        setPlans(plansResult.plans || []);

        if (isAuthenticated) {
          try {
            const subResult = await getSubscription();
            setSubscription(subResult.has_subscription ? subResult.subscription : null);
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

  // Handle Stripe checkout
  const handleStripeCheckout = async () => {
    if (!isAuthenticated) {
      openLogin();
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

  // PayPal checkout: no JS SDK. Create the subscription server-side, then do a
  // clean full-page redirect to PayPal's approval page. PayPal returns the user
  // to /checkout/success?processor=paypal&subscription_id=..., where activation
  // is confirmed by polling (webhook-driven).
  const handlePayPalCheckout = async () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const successUrl = `${SITE_URL}/checkout/success?processor=paypal`;
      const cancelUrl = `${SITE_URL}/checkout/cancel`;
      const result = await createPayPalSubscription(selectedPlan, successUrl, cancelUrl);
      window.location.href = result.approve_url;
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
            <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[1, 2].map((i) => (
                <div key={i} className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const view = resolveSupporterView({ isAuthenticated, roles, subscription });

  if (view !== "checkout") {
    return (
      <main className="v2-primary-container">
        <div className="rounded-xl bg-white p-8 shadow dark:bg-gray-900 dark:border dark:border-slate-800 max-w-2xl mx-auto">
          {view === "upgrade" ? (
            <div className="pt-6">
              <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400 mb-6">
                You&apos;re a Supporter. There&apos;s one level up.
              </p>
              <UpgradeToFullBean
                beanMonthly={beanMonthly}
                beanAnnual={beanAnnual}
                initialInterval={billing}
                onUpgraded={() => refreshUser()}
              />
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
                Happy where you are? You&apos;re all set. Manage your plan in{" "}
                <Link href="/settings?tab=premium" className="text-primary-500 font-semibold hover:underline">Settings</Link>.
              </p>
            </div>
          ) : view === "paypal_guidance" ? (
            <div className="text-center">
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-3 pt-4">Want the Full Bean?</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your Supporter plan is billed through PayPal, which doesn&apos;t allow switching plans mid-cycle.
                To upgrade: cancel your current plan in Settings (you keep access until your period ends), then
                come back here and subscribe to Full Bean.
              </p>
              <Link
                href="/settings?tab=premium"
                className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                Manage Subscription
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-4xl">&#11088;</span>
              </div>
              <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-3">
                {view === "full_bean" ? "You're a Full Bean!" : "Thank You for Being a Supporter!"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">
                {view === "full_bean"
                  ? "Top tier. Unlimited Bean, no ads, our eternal gratitude."
                  : "Your support helps keep Big Brother Junkies running. Enjoy your ad-free experience!"}
              </p>
              {view === "lifetime" && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Lifetime member interested in Full Bean?{" "}
                  <Link href="/settings?tab=help" className="text-primary-500 font-semibold hover:underline">Contact us</Link> and we&apos;ll sort you out.
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
                <Link
                  href="/settings?tab=premium"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                >
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
          )}
        </div>
      </main>
    );
  }

  const selectedPlanData = plans.find((p) => p.id === selectedPlan);
  const supporterSelected = !selectedPlan.startsWith("full_bean");

  // Per-card derived display values
  const supporterAmt = perMonthDisplay(supporterMonthly, supporterAnnual);
  const beanAmt = perMonthDisplay(beanMonthly, beanAnnual);

  return (
    <main className="v2-primary-container">
      <div className="rounded-xl bg-white p-6 md:p-8 shadow dark:bg-gray-900 dark:border dark:border-slate-800">
        <div className="max-w-4xl mx-auto">

          {/* Hero */}
          <div className="text-center mb-8 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400 mb-3">
              Support independent Big Brother coverage
            </p>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 dark:text-white mb-4">
              Go ad-free. <span className="text-primary-500">Get the good stuff.</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Every supporter keeps BBJ running without corporate strings, and unlocks the stats tools and the Bean while they&apos;re at it.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1" role="tablist" aria-label="Billing period">
              {[
                { id: "month", label: "Monthly" },
                { id: "year", label: "Annual" },
              ].map((period) => (
                <button
                  key={period.id}
                  type="button"
                  role="tab"
                  aria-selected={billing === period.id}
                  onClick={() => switchBilling(period.id)}
                  className={`px-6 py-2 text-sm font-semibold uppercase tracking-wide rounded-full transition-colors ${
                    billing === period.id
                      ? "bg-primary-500 text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
            {billing === "year" && maxSavings > 0 && (
              <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide bg-secondary-500/15 text-secondary-600 dark:bg-secondary-500/20 dark:text-secondary-400 rounded">
                Save up to {maxSavings}%
              </span>
            )}
          </div>

          {/* Plan cards */}
          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto mb-14 items-stretch">

            {/* Supporter */}
            {(supporterMonthly || supporterAnnual) && (
              <article
                className={`relative flex flex-col rounded-xl border-2 bg-white dark:bg-slate-800 p-7 order-2 sm:order-1 transition-all ${
                  supporterSelected
                    ? "border-primary-500/50 dark:border-primary-400/50"
                    : "border-slate-200 dark:border-slate-700"
                }`}
              >
                <h3 className="text-xl font-display font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                  Supporter
                </h3>
                <p className="text-sm italic text-gray-500 dark:text-gray-400 mt-0.5 mb-5">
                  The ad-free site, plus every premium stats tool.
                </p>
                <div className="flex items-baseline gap-1.5">
                  {billing === "year" && supporterMonthly && (
                    <span className="text-sm text-gray-400 line-through">{supporterMonthly.price}</span>
                  )}
                  <span className="text-5xl font-display font-bold text-gray-900 dark:text-white">{supporterAmt}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 min-h-[17px]">
                  {billing === "year" && supporterAnnual ? (
                    <>
                      <b className="text-gray-800 dark:text-gray-200">{supporterAnnual.price} billed annually</b> ·{" "}
                      <b className="text-emerald-600 dark:text-emerald-400">save {supporterSavings}%</b>
                    </>
                  ) : (
                    "Billed monthly · cancel anytime"
                  )}
                </p>
                <ul className="flex-1 space-y-2.5 my-6 text-sm text-gray-600 dark:text-gray-300">
                  <Feature>Ad-free everything: no banners, no interruptions</Feature>
                  <Feature>
                    <span>Interactive Player Map<small className="block text-xs text-gray-400 dark:text-gray-500">heatmaps, state stats, season timeline</small></span>
                  </Feature>
                  <Feature>
                    <span>Player Comparisons<small className="block text-xs text-gray-400 dark:text-gray-500">head-to-head stats, HoH &amp; PoV charts</small></span>
                  </Feature>
                  <Feature>Supporter badge next to your name</Feature>
                  <Feature>Ask the Bean: 30 chats a day</Feature>
                </ul>
                <button
                  type="button"
                  onClick={() => choosePlan("supporter")}
                  disabled={processing}
                  className="w-full py-3 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 font-display font-semibold uppercase tracking-wider text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Become a Supporter
                </button>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 text-center mt-2.5">Cancel anytime</p>
              </article>
            )}

            {/* Full Bean (featured) */}
            {(beanMonthly || beanAnnual) && (
              <article
                id="full-bean"
                className={`relative flex flex-col rounded-xl border-2 bg-white dark:bg-slate-800 p-7 order-1 sm:order-2 shadow-lg transition-all ${
                  !supporterSelected
                    ? "border-primary-500 ring-2 ring-primary-500/20"
                    : "border-primary-500"
                }`}
              >
                <span className="absolute -top-3 left-7 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-secondary-500 text-white rounded">
                  Most popular
                </span>
                <Image
                  src="/bean/bean-wave.png"
                  alt="The Bean waving"
                  width={72}
                  height={72}
                  className="absolute -top-9 right-4 w-[72px] h-auto drop-shadow-md pointer-events-none select-none"
                />
                <h3 className="text-xl font-display font-bold uppercase tracking-wide text-gray-900 dark:text-white">
                  Full Bean
                </h3>
                <p className="text-sm italic text-gray-500 dark:text-gray-400 mt-0.5 mb-5">
                  Everything in Supporter, plus the smartest Bean there is.
                </p>
                <div className="flex items-baseline gap-1.5">
                  {billing === "year" && beanMonthly && (
                    <span className="text-sm text-gray-400 line-through">{beanMonthly.price}</span>
                  )}
                  <span className="text-5xl font-display font-bold text-gray-900 dark:text-white">{beanAmt}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/mo</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 min-h-[17px]">
                  {billing === "year" && beanAnnual ? (
                    <>
                      <b className="text-gray-800 dark:text-gray-200">{beanAnnual.price} billed annually</b> ·{" "}
                      <b className="text-emerald-600 dark:text-emerald-400">save {beanSavings}%</b>
                    </>
                  ) : (
                    "Billed monthly · cancel anytime"
                  )}
                </p>
                <ul className="flex-1 space-y-2.5 my-6 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex gap-2.5 font-semibold text-gray-900 dark:text-white">
                    <span className="text-primary-500 font-bold flex-shrink-0">+</span>Everything in Supporter, and:
                  </li>
                  <Feature>Unlimited Bean chats, no daily cap</Feature>
                  <Feature>
                    <span>Our smartest AI model<small className="block text-xs text-gray-400 dark:text-gray-500">sharper takes, better recall of the season</small></span>
                  </Feature>
                  <Feature>
                    <span>Longer conversation memory<small className="block text-xs text-gray-400 dark:text-gray-500">pick up where you left off</small></span>
                  </Feature>
                </ul>
                <button
                  type="button"
                  onClick={() => choosePlan("full_bean")}
                  disabled={processing}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-display font-semibold uppercase tracking-wider text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Get the Full Bean
                </button>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 text-center mt-2.5">Cancel anytime</p>
              </article>
            )}
          </div>

          {/* Compare table */}
          <section className="mb-14">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wide text-gray-900 dark:text-white text-center mb-1">
              Compare plans
            </h2>
            <p className="text-sm italic text-gray-500 dark:text-gray-400 text-center mb-5">
              Everyone gets the spoilers. Here&apos;s what supporting adds.
            </p>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm bg-white dark:bg-slate-800 border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80">
                    <th className="p-3.5" />
                    <th className="p-3.5 text-center font-display font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
                      Free
                      <small className="block text-[10px] font-normal normal-case tracking-normal text-gray-400">just visiting</small>
                    </th>
                    <th className="p-3.5 text-center font-display font-semibold uppercase tracking-wide text-gray-900 dark:text-white">
                      Supporter
                      <small className="block text-[10px] font-normal normal-case tracking-normal text-gray-400">
                        {billing === "year" ? `${supporterAmt}/mo billed annually` : `${supporterAmt}/mo`}
                      </small>
                    </th>
                    <th className="p-3.5 text-center font-display font-semibold uppercase tracking-wide bg-primary-500 text-white">
                      Full Bean
                      <small className="block text-[10px] font-normal normal-case tracking-normal text-white/70">
                        {billing === "year" ? `${beanAmt}/mo billed annually` : `${beanAmt}/mo`}
                      </small>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                      <td className="p-3.5 text-left font-medium text-gray-700 dark:text-gray-300">
                        {row.label}
                        {row.sub && <small className="block text-xs font-normal text-gray-400 dark:text-gray-500">{row.sub}</small>}
                      </td>
                      {["free", "supporter", "full_bean"].map((tier) => {
                        const val = row[tier];
                        const hl = tier === "full_bean" ? "bg-primary-500/5 dark:bg-primary-500/15" : "";
                        return (
                          <td key={tier} className={`p-3.5 text-center ${hl}`}>
                            {val === true ? (
                              <CheckIcon className="w-4 h-4 text-emerald-500 inline-block" />
                            ) : val === false ? (
                              <span className="text-slate-300 dark:text-slate-600">&mdash;</span>
                            ) : (
                              <b className="text-gray-900 dark:text-white text-[13px]">{val}</b>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* A word from the Bean */}
          <section className="mb-14 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-7 grid sm:grid-cols-[auto_1fr] gap-6 items-center text-center sm:text-left">
            <Image
              src="/bean/bean-point.png"
              alt="The Bean pointing at you"
              width={110}
              height={110}
              className="w-[110px] h-auto mx-auto sm:mx-0"
            />
            <div>
              <h2 className="text-lg font-display font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-1.5">
                A word from the Bean
              </h2>
              <blockquote className="italic text-[15px] leading-relaxed text-gray-600 dark:text-gray-300">
                &ldquo;Look, the spoilers stay free, that&apos;s the deal. But if you want me at full power? Unlimited questions, my sharpest takes, and I actually remember our last conversation. Full Bean is the move. No pressure. Some pressure.&rdquo;
              </blockquote>
              <Link
                href="/search"
                className="inline-block mt-3 text-[11px] font-bold uppercase tracking-wider text-primary-500 hover:underline"
              >
                Not sure? Chat with the Bean free, 5 messages a day &rarr;
              </Link>
            </div>
          </section>

          {/* Payment Section */}
          <div id="complete-purchase" className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-14 scroll-mt-24">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Complete Your Purchase
            </h2>

            {!isAuthenticated ? (
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Please log in or create an account to continue
                </p>
                <button
                  onClick={() => openLogin()}
                  className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                >
                  Log In / Sign Up
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-w-md mx-auto">
                {/* Selected Plan Summary */}
                <div className="p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg mb-6">
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

                {/* PayPal Button (no SDK: server-created subscription + redirect) */}
                <button
                  onClick={handlePayPalCheckout}
                  disabled={processing}
                  className="w-full py-3 bg-[#0070BA] hover:bg-[#005c99] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 00-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 00-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 00.554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 01.923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z" />
                  </svg>
                  Pay with PayPal
                </button>
              </div>
            )}
          </div>

          {/* FAQ */}
          <section className="max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-display font-bold uppercase tracking-wide text-gray-900 dark:text-white text-center mb-4">
              Quick questions
            </h2>
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={i}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg mb-2 px-5"
              >
                <summary className="cursor-pointer list-none flex justify-between items-center py-3.5 font-semibold text-sm text-gray-900 dark:text-white">
                  {item.q}
                  <span className="text-gray-400 text-base group-open:hidden">+</span>
                  <span className="text-gray-400 text-base hidden group-open:inline">&ndash;</span>
                </summary>
                <p className="text-sm text-gray-600 dark:text-gray-400 pb-4 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </section>

          {/* Signoff */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
            Already a supporter?{" "}
            <button onClick={() => openLogin()} className="text-primary-500 font-semibold hover:underline">
              Log in
            </button>{" "}
            · Questions?{" "}
            <Link href="/settings?tab=help" className="text-primary-500 font-semibold hover:underline">
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
