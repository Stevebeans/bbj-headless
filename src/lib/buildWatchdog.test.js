import { describe, it, expect, vi } from "vitest";
import {
  findOwnBuildAsset,
  probeUrl,
  isBuildGone,
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

describe("probeUrl", () => {
  it("adds a unique cache-busting param so Cloudflare cannot answer from cache", () => {
    const url = probeUrl(WEBPACK_SRC, 1000);
    expect(url.startsWith(WEBPACK_SRC + "&bbjprobe=")).toBe(true);
    expect(probeUrl(WEBPACK_SRC, 1000)).not.toBe(probeUrl(WEBPACK_SRC, 2000));
  });
});

describe("isBuildGone", () => {
  it("is true only when the origin answers 404 for our own runtime", async () => {
    const fetchFn = vi.fn(async () => ({ status: 404 }));
    expect(await isBuildGone(fetchFn, WEBPACK_SRC, 5)).toBe(true);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toContain("bbjprobe=");
    expect(init.cache).toBe("no-store");
  });

  it("is false while the build is still served", async () => {
    expect(await isBuildGone(async () => ({ status: 200 }), WEBPACK_SRC, 5)).toBe(false);
  });

  it("treats network failures and other statuses as not-stale (never reload on a blip)", async () => {
    expect(await isBuildGone(async () => { throw new Error("offline"); }, WEBPACK_SRC, 5)).toBe(false);
    expect(await isBuildGone(async () => ({ status: 503 }), WEBPACK_SRC, 5)).toBe(false);
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
