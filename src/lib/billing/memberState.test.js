import { describe, it, expect } from "vitest";
import { resolveSupporterView } from "./memberState";

const stripeSub = { processor: "stripe", plan_type: "monthly", tier: "supporter", status: "active" };
const paypalSub = { processor: "paypal", plan_type: "annual", tier: "supporter", status: "active" };

describe("resolveSupporterView", () => {
  it("shows checkout to logged-out visitors", () => {
    expect(resolveSupporterView({ isAuthenticated: false, roles: [], subscription: null })).toBe("checkout");
  });

  it("shows checkout to logged-in free members", () => {
    expect(resolveSupporterView({ isAuthenticated: true, roles: ["subscriber"], subscription: null })).toBe("checkout");
  });

  it("shows full_bean wall to Full Bean members", () => {
    expect(resolveSupporterView({ isAuthenticated: true, roles: ["full_bean"], subscription: { ...stripeSub, tier: "full_bean" } })).toBe("full_bean");
  });

  it("full_bean wins even if the role list is stale but the sub row says full_bean", () => {
    expect(resolveSupporterView({ isAuthenticated: true, roles: ["supporter"], subscription: { ...stripeSub, tier: "full_bean" } })).toBe("full_bean");
  });

  it("shows lifetime wall to lifetime members (role-only legacy included)", () => {
    expect(resolveSupporterView({ isAuthenticated: true, roles: ["lifetime"], subscription: null })).toBe("lifetime");
    expect(resolveSupporterView({ isAuthenticated: true, roles: ["supporter"], subscription: { ...stripeSub, status: "lifetime" } })).toBe("lifetime");
  });

  it("shows upgrade to Stripe supporters", () => {
    expect(resolveSupporterView({ isAuthenticated: true, roles: ["supporter"], subscription: stripeSub })).toBe("upgrade");
  });

  it("shows paypal_guidance to PayPal supporters", () => {
    expect(resolveSupporterView({ isAuthenticated: true, roles: ["supporter"], subscription: paypalSub })).toBe("paypal_guidance");
  });

  it("shows plain thanks to premium members without a subscription row (manual grants, admins)", () => {
    expect(resolveSupporterView({ isAuthenticated: true, roles: ["supporter"], subscription: null })).toBe("thanks");
    expect(resolveSupporterView({ isAuthenticated: true, roles: ["administrator"], subscription: null })).toBe("thanks");
  });
});
