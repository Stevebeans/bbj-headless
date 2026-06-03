// src/lib/bean/tiers.js
// Tier -> model + display mapping for Ask the Bean. The plugin (/bbjd/v1/bean/check)
// is the source of truth for which tier a user is and their remaining quota; this
// maps that tier to a model and supplies upsell copy. Spec-aligned:
//   free      -> Haiku, small daily cap
//   supporter -> Haiku, bigger daily cap (existing $6.95 role)
//   full_bean -> Sonnet, unlimited + memory ($14.99 "Full Bean")
export const MODELS = {
  haiku: "claude-haiku-4-5-20251001",
  sonnet: "claude-sonnet-4-6",
};

export const TIERS = {
  free: { id: "free", label: "Free", model: MODELS.haiku },
  supporter: { id: "supporter", label: "Supporter", model: MODELS.haiku },
  full_bean: { id: "full_bean", label: "Full Bean", model: MODELS.sonnet },
};

export function modelForTier(tierId) {
  return (TIERS[tierId] || TIERS.free).model;
}

// Where the upgrade CTAs point. Full Bean checkout ($14.99) needs its own Stripe
// product added to this page; until then both CTAs route to the existing upgrade page.
export const UPGRADE_URL = "/become-supporter";

// In-voice copy for when a user hits their daily cap (shown with the upsell card).
export function cappedMessage(tier) {
  if (tier === "supporter") {
    return "Whew, you've really put me through it today, that's even the supporter limit. I'll be here tomorrow. But if you want me unlimited and running on the bigger brain, Full Bean's right there.";
  }
  return "Ah, that's my limit for the day on the free plan, I'm officially tapped. Catch me tomorrow. Or, if you can't get enough of me (no judgment, I'm great), there's a way to keep this going below.";
}
