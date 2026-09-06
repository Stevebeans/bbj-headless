import { describe, it, expect, vi } from "vitest";
import {
  findOwnBuildAsset,
  isNewerBuildLive,
  installStaleHandlers,
} from "./buildWatchdog";

const WEBPACK_SRC =
  "https://bigbrotherjunkies.com/_next/static/chunks/webpack-1466c04dfee5b47e.js?dpl=dpl_OLD123";

function fakeDoc(scriptSrc) {
  return {
    querySelector: (sel) =>
      sel.includes("webpack-") && scriptSrc ? { src: scriptSrc } : null,
  };
}

describe("findOwnBuildAsset", () => {
  it("returns the webpack runtime URL and its deployment id", () => {
    expect(findOwnBuildAsset(fakeDoc(WEBPACK_SRC))).toEqual({
      src: WEBPACK_SRC,
      dpl: "dpl_OLD123",
    });
  });

  it("returns null when the page carries no deployment id (local dev)", () => {
    expect(findOwnBuildAsset(fakeDoc("https://x/_next/static/chunks/webpack-abc.js"))).toBeNull();
  });

  it("returns null when no webpack runtime script exists", () => {
    expect(findOwnBuildAsset(fakeDoc(null))).toBeNull();
  });
});

describe("isNewerBuildLive", () => {
  const html = (dpl) => `<html><script src="/_next/static/chunks/webpack-abc.js?dpl=${dpl}"></script></html>`;

  it("is true when the homepage now carries a different deployment id", async () => {
    const fetchFn = vi.fn(async () => ({ ok: true, text: async () => html("dpl_NEW999") }));
    expect(await isNewerBuildLive(fetchFn, "dpl_OLD123")).toBe(true);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("/");
    expect(init.credentials).toBe("omit");
    // Must ride Cloudflare's cached copy (zero Vercel cost) - never cache-bust.
    expect(init.cache).not.toBe("no-store");
    expect(url).not.toContain("?");
  });

  it("is false while the homepage still serves our build", async () => {
    expect(await isNewerBuildLive(async () => ({ ok: true, text: async () => html("dpl_OLD123") }), "dpl_OLD123")).toBe(false);
  });

  it("treats network failures, errors, and pages without a deployment id as not-stale", async () => {
    expect(await isNewerBuildLive(async () => { throw new Error("offline"); }, "dpl_OLD123")).toBe(false);
    expect(await isNewerBuildLive(async () => ({ ok: false, text: async () => html("dpl_NEW999") }), "dpl_OLD123")).toBe(false);
    expect(await isNewerBuildLive(async () => ({ ok: true, text: async () => "<html>maintenance</html>" }), "dpl_OLD123")).toBe(false);
  });
});

function fakeWindow({ hidden = false } = {}) {
  const listeners = {};
  const doc = {
    visibilityState: hidden ? "hidden" : "visible",
    addEventListener: (type, fn) => { (listeners[type] ||= []).push(fn); },
    removeEventListener: (type, fn) => { listeners[type] = (listeners[type] || []).filter((f) => f !== fn); },
  };
  const location = {
    origin: "https://bigbrotherjunkies.com",
    href: "https://bigbrotherjunkies.com/",
    assign: vi.fn(),
    reload: vi.fn(),
  };
  const fire = (type, event) => (listeners[type] || []).forEach((fn) => fn(event));
  return { doc, location, fire, listeners };
}

function clickOn(anchor, extra = {}) {
  return {
    target: anchor,
    button: 0,
    defaultPrevented: false,
    preventDefault: vi.fn(),
    ...extra,
  };
}

describe("installStaleHandlers", () => {
  it("turns the next same-origin link click into a full navigation", () => {
    const { doc, location, fire } = fakeWindow();
    installStaleHandlers({ doc, location });
    const a = { href: "https://bigbrotherjunkies.com/live-feed-updates/x", target: "", closest: function () { return this; } };
    const ev = clickOn(a);
    fire("click", ev);
    expect(ev.preventDefault).toHaveBeenCalled();
    expect(location.assign).toHaveBeenCalledWith(a.href);
  });

  it("leaves modifier clicks, new-tab links, and external links alone", () => {
    const { doc, location, fire } = fakeWindow();
    installStaleHandlers({ doc, location });
    const same = { href: "https://bigbrotherjunkies.com/x", target: "", closest: function () { return this; } };
    fire("click", clickOn(same, { metaKey: true }));
    fire("click", clickOn({ ...same, target: "_blank" }));
    fire("click", clickOn({ ...same, href: "https://example.com/" }));
    expect(location.assign).not.toHaveBeenCalled();
  });

  it("reloads quietly when the tab goes to the background", () => {
    const { doc, location, fire } = fakeWindow();
    installStaleHandlers({ doc, location });
    doc.visibilityState = "hidden";
    fire("visibilitychange");
    expect(location.reload).toHaveBeenCalledTimes(1);
  });

  it("uninstalls cleanly", () => {
    const { doc, location, fire, listeners } = fakeWindow();
    const uninstall = installStaleHandlers({ doc, location });
    uninstall();
    doc.visibilityState = "hidden";
    fire("visibilitychange");
    expect(location.reload).not.toHaveBeenCalled();
    expect(listeners.click.length + listeners.visibilitychange.length).toBe(0);
  });
});
