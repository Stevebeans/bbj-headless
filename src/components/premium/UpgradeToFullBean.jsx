"use client";

import { useState } from "react";
import Image from "next/image";
import { changePlan } from "@/lib/api/billing";

/**
 * In-place Supporter -> Full Bean upgrade for Stripe subscribers.
 * Calls /billing/change-plan (immediate, prorated) — no re-checkout.
 */
export default function UpgradeToFullBean({ beanMonthly, beanAnnual, initialInterval = "year", onUpgraded }) {
  const [interval, setIntervalChoice] = useState(initialInterval); // 'month' | 'year'
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const plan = interval === "year" ? beanAnnual : beanMonthly;

  const upgrade = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await changePlan(plan.id);
      setDone(true);
      setConfirming(false);
      onUpgraded?.(result);
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border-2 border-primary-500 bg-white dark:bg-slate-800 p-8 text-center max-w-md mx-auto">
        <Image src="/bean/bean-wave.png" alt="The Bean waving" width={90} height={90} className="w-[90px] h-auto mx-auto mb-4" />
        <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">You&apos;re a Full Bean!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Unlimited chats and our smartest Bean are live on your account right now. The prorated difference lands on your next invoice.
        </p>
        <a href="/search" className="inline-block px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors">
          Go chat with the Bean
        </a>
      </div>
    );
  }

  if (!plan) return null;

  const priceDisplay = `$${(plan.price_cents / 100).toFixed(2).replace(/\.00$/, "")}`;

  return (
    <div className="rounded-xl border-2 border-primary-500 bg-white dark:bg-slate-800 p-7 max-w-md mx-auto relative">
      <Image src="/bean/bean-point.png" alt="The Bean pointing" width={72} height={72} className="absolute -top-9 right-4 w-[72px] h-auto drop-shadow-md pointer-events-none select-none" />
      <h2 className="text-xl font-display font-bold uppercase tracking-wide text-gray-900 dark:text-white mb-1">Upgrade to Full Bean</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
        Unlimited Bean chats, our smartest model, and he remembers you between chats. Applied instantly, prorated automatically.
      </p>

      <div className="inline-flex rounded-full bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 p-1 mb-4" role="tablist" aria-label="Billing period">
        {[
          { id: "month", label: "Monthly" },
          { id: "year", label: "Annual" },
        ].map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={interval === p.id}
            onClick={() => setIntervalChoice(p.id)}
            className={`px-5 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full transition-colors ${
              interval === p.id ? "bg-primary-500 text-white" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-baseline gap-1.5 mb-5">
        <span className="text-4xl font-display font-bold text-gray-900 dark:text-white">{priceDisplay}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">/{interval === "year" ? "yr" : "mo"}</span>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}

      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={busy}
        className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-display font-semibold uppercase tracking-wider text-sm rounded-full transition-colors disabled:opacity-50"
      >
        Upgrade now
      </button>
      <p className="text-[10px] uppercase tracking-wide text-gray-400 text-center mt-2.5">Prorated. Cancel anytime.</p>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Switch to {plan.name}?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your subscription switches to {plan.name} ({priceDisplay}/{interval === "year" ? "yr" : "mo"}) right away. Stripe prorates the difference, so you only pay for what you use.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirming(false)}
                disabled={busy}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Not now
              </button>
              <button
                onClick={upgrade}
                disabled={busy}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
              >
                {busy ? "Upgrading..." : "Confirm upgrade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
