// Which /become-supporter view a member should see.
// Mirrors usePremium's role list — kept local so this stays a pure function.
const PREMIUM_ROLES = ["administrator", "editor", "supporter", "lifetime", "full_bean"];

/**
 * @returns {'checkout'|'full_bean'|'lifetime'|'upgrade'|'paypal_guidance'|'thanks'}
 */
export function resolveSupporterView({ isAuthenticated, roles = [], subscription = null }) {
  const isPremium = isAuthenticated && roles.some((r) => PREMIUM_ROLES.includes(r));
  if (!isPremium) return "checkout";

  if (roles.includes("full_bean") || subscription?.tier === "full_bean") return "full_bean";

  if (
    roles.includes("lifetime") ||
    subscription?.status === "lifetime" ||
    subscription?.plan_type === "lifetime"
  ) {
    return "lifetime";
  }

  if (subscription?.processor === "stripe") return "upgrade";
  if (subscription?.processor === "paypal") return "paypal_guidance";

  return "thanks";
}
