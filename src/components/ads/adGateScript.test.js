import { describe, it, expect } from "vitest";
import { buildAdGateScript } from "./AdGateScript.jsx";

// Run the generated inline script against a stubbed document/window,
// returning what it did. This executes the REAL script string — the same
// bytes that ship in <head> — not a reimplementation of its logic.
function runGate({ cookie = "", configuredRoles = [] } = {}) {
  const classes = new Set();
  const doc = {
    cookie,
    documentElement: { classList: { add: (c) => classes.add(c) } },
  };
  const win = {};
  new Function("document", "window", buildAdGateScript(configuredRoles))(doc, win);
  return { adFree: win.__bbjAdFree === true, hasClass: classes.has("bbj-adfree") };
}

// The profile-cache cookie exactly as AuthContext writes it.
function userCookie(roles) {
  return (
    "bbj_user=" + encodeURIComponent(JSON.stringify({ n: "Nikki", a: "", r: roles, t: 1 }))
  );
}

describe("AdGateScript", () => {
  it("suppresses ads for a cached supporter", () => {
    const r = runGate({ cookie: userCookie(["supporter"]) });
    expect(r).toEqual({ adFree: true, hasClass: true });
  });

  it("covers every baseline supporter role", () => {
    for (const role of ["administrator", "editor", "lifetime", "full_bean"]) {
      expect(runGate({ cookie: userCookie([role]) }).adFree).toBe(true);
    }
  });

  it("honors admin-configured roles beyond the baseline", () => {
    expect(runGate({ cookie: userCookie(["second_in_command"]) }).adFree).toBe(false);
    expect(
      runGate({
        cookie: userCookie(["second_in_command"]),
        configuredRoles: ["second_in_command"],
      }).adFree
    ).toBe(true);
  });

  it("no-ops for regular members and anonymous visitors", () => {
    expect(runGate({ cookie: userCookie(["subscriber"]) }).adFree).toBe(false);
    expect(runGate({ cookie: "" }).adFree).toBe(false);
  });

  it("handles PHP object-shaped roles ({0:'supporter'})", () => {
    expect(runGate({ cookie: userCookie({ 0: "supporter" }) }).adFree).toBe(true);
  });

  it("fails open on a corrupt cookie", () => {
    expect(runGate({ cookie: "bbj_user=%7Bnot-json" }).adFree).toBe(false);
  });

  it("skips suppression in admin ad-preview mode", () => {
    const r = runGate({
      cookie: "bbj_ad_preview=1; " + userCookie(["administrator"]),
    });
    expect(r.adFree).toBe(false);
  });

  it("does not match bbj_user as a substring of another cookie name", () => {
    expect(runGate({ cookie: "x_" + userCookie(["supporter"]) }).adFree).toBe(false);
  });
});
