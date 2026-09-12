"use client";

import { founderState } from "@/lib/billing/founders";

// Why the server would refuse this member a Lifetime spot, keyed by the
// reason the page works out from their subscription.
const LIFETIME_BLOCKED_COPY = {
  annual: "You're on an annual plan. Lifetime upgrades for annual members are coming.",
  full_bean: "Lifetime doesn't include Full Bean. Message Steve if you want to switch.",
  other: "You already have an active subscription.",
};

/**
 * The Founders window: $5 Founding Junkie badge + $99 Lifetime plan capped
 * at a fixed spot count. Purely presentational — data comes from the
 * `founders` block on /billing/plans, purchase handlers are passed in.
 */
export default function FoundersSection({
  founders,
  onBuyBadge,
  onBuyLifetimeStripe,
  onBuyLifetimePayPal,
  hasBadge = false,
  isLifetime = false,
  isStaff = false,
  lifetimeBlockedReason = "",
  processing = false,
}) {
  const state = founderState(founders);

  if (!state.open) return null;

  // A Lifetime spot is capped and publicly counted. Someone who already holds
  // it has nothing to buy, and a staff account is premium by role rather than
  // by purchase, so neither gets the card. The badge card stays for both.
  // `lifetimeBlockedReason` names why the server would refuse this member, so
  // the card can say the true thing instead of a generic error. Supporter
  // monthly members are not blocked at all: completing the purchase cancels
  // their monthly plan.
  const showLifetime = !isLifetime && !isStaff;

  const blockedCopy = LIFETIME_BLOCKED_COPY[lifetimeBlockedReason] || "";

  const { spotsLeft, cap, soldOut, closesAtMs } = state;
  const closesLabel = closesAtMs
    ? new Date(closesAtMs).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <section className="mb-14">
      <h2 className="text-2xl font-display font-bold uppercase tracking-wide text-gray-900 dark:text-white text-center mb-1">
        The Founding Era — one time only
      </h2>
      <div className={`grid gap-5 mx-auto mt-6 ${showLifetime ? "sm:grid-cols-2 max-w-3xl" : "max-w-md"}`}>
        {/* Founding Junkie badge */}
        <article className="relative flex flex-col rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-7">
          <h3 className="text-xl font-display font-bold uppercase tracking-wide text-gray-900 dark:text-white">
            Founding Junkie badge
          </h3>
          <p className="text-sm italic text-gray-500 dark:text-gray-400 mt-0.5 mb-5">
            The badge that says you were here when it started. On your comments, profile, and DMs forever. Free with All-Access and Lifetime.
          </p>
          <div className="flex items-baseline gap-1.5 mb-6">
            <span className="text-5xl font-display font-bold text-gray-900 dark:text-white">$5</span>
          </div>
          {hasBadge ? (
            <button
              type="button"
              disabled
              className="w-full py-3 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-display font-semibold uppercase tracking-wider text-sm rounded-full cursor-default"
            >
              You have the badge ✓
            </button>
          ) : (
            <button
              type="button"
              onClick={onBuyBadge}
              disabled={processing}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-display font-semibold uppercase tracking-wider text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? "Processing…" : "Get the badge — $5"}
            </button>
          )}
        </article>

        {/* Lifetime */}
        {showLifetime && (
          <article className="relative flex flex-col rounded-xl border-2 border-primary-500 bg-white dark:bg-slate-800 p-7 shadow-lg">
            <h3 className="text-xl font-display font-bold uppercase tracking-wide text-gray-900 dark:text-white">
              Lifetime
            </h3>
            <p className="text-sm italic text-gray-500 dark:text-gray-400 mt-0.5 mb-5">
              $99 · {spotsLeft} of {cap} spots left
            </p>
            {soldOut ? (
              <button
                type="button"
                disabled
                className="w-full py-3 border-2 border-slate-300 dark:border-slate-600 text-gray-400 dark:text-gray-500 font-display font-semibold uppercase tracking-wider text-sm rounded-full cursor-not-allowed"
              >
                SOLD OUT
              </button>
            ) : blockedCopy ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">{blockedCopy}</p>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={onBuyLifetimeStripe}
                  disabled={processing}
                  className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-display font-semibold uppercase tracking-wider text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Processing…" : "Lifetime — Stripe"}
                </button>
                <button
                  type="button"
                  onClick={onBuyLifetimePayPal}
                  disabled={processing}
                  className="w-full py-3 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 font-display font-semibold uppercase tracking-wider text-sm rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? "Processing…" : "Lifetime — PayPal"}
                </button>
              </div>
            )}
          </article>
        )}
      </div>
      {closesLabel && (
        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-5">
          Founding window closes {closesLabel} — then it&apos;s gone.
        </p>
      )}
    </section>
  );
}
