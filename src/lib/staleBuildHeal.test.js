import { describe, it, expect, vi } from "vitest";
import { isStaleBuildError, attemptStaleBuildHeal } from "./staleBuildHeal";

function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    map,
  };
}

function makeLocation(href = "https://bigbrotherjunkies.com/") {
  return { href, replace: vi.fn() };
}

describe("isStaleBuildError", () => {
  it("matches ChunkLoadError by name", () => {
    const err = new Error("Loading chunk 4831 failed.");
    err.name = "ChunkLoadError";
    expect(isStaleBuildError(err)).toBe(true);
  });

  it("matches chunk load failure by message", () => {
    expect(isStaleBuildError(new Error("Loading chunk app/page failed. (error: https://...)"))).toBe(true);
  });

  it("matches failed dynamic import", () => {
    expect(isStaleBuildError(new Error("Failed to fetch dynamically imported module: https://.../chunk.js"))).toBe(true);
  });

  it("matches webpack runtime cross-build mismatch", () => {
    expect(isStaleBuildError(new TypeError("Cannot read properties of undefined (reading 'call')"))).toBe(true);
  });

  it("matches aborted flight stream", () => {
    expect(isStaleBuildError(new Error("Connection closed."))).toBe(true);
  });

  it("rejects ordinary render errors", () => {
    expect(isStaleBuildError(new TypeError("Cannot read properties of null (reading 'map')"))).toBe(false);
    expect(isStaleBuildError(new Error("Minified React error #310"))).toBe(false);
  });

  it("rejects missing error", () => {
    expect(isStaleBuildError(null)).toBe(false);
    expect(isStaleBuildError(undefined)).toBe(false);
  });
});

describe("attemptStaleBuildHeal", () => {
  const staleError = () => {
    const err = new Error("Loading chunk 123 failed.");
    err.name = "ChunkLoadError";
    return err;
  };

  it("heals a stale-build error: sets guard and replaces with cache-busting URL", () => {
    const storage = makeStorage();
    const location = makeLocation("https://bigbrotherjunkies.com/?foo=bar");
    const healed = attemptStaleBuildHeal(staleError(), { storage, location, now: 1_000_000 });
    expect(healed).toBe(true);
    expect(storage.getItem("bbj_heal_nav")).toBe("1000000");
    expect(location.replace).toHaveBeenCalledTimes(1);
    const target = new URL(location.replace.mock.calls[0][0]);
    expect(target.pathname).toBe("/");
    expect(target.searchParams.get("foo")).toBe("bar");
    expect(target.searchParams.get("bbjheal")).toBe((1_000_000).toString(36));
  });

  it("does not heal twice within the loop-guard window", () => {
    const storage = makeStorage({ bbj_heal_nav: "1000000" });
    const location = makeLocation();
    const healed = attemptStaleBuildHeal(staleError(), { storage, location, now: 1_030_000 });
    expect(healed).toBe(false);
    expect(location.replace).not.toHaveBeenCalled();
  });

  it("heals again after the guard window has passed", () => {
    const storage = makeStorage({ bbj_heal_nav: "1000000" });
    const location = makeLocation();
    const healed = attemptStaleBuildHeal(staleError(), { storage, location, now: 1_061_000 });
    expect(healed).toBe(true);
    expect(location.replace).toHaveBeenCalledTimes(1);
  });

  it("does not heal non-stale errors or touch storage", () => {
    const storage = makeStorage();
    const location = makeLocation();
    const healed = attemptStaleBuildHeal(new Error("boom"), { storage, location, now: 1_000_000 });
    expect(healed).toBe(false);
    expect(storage.getItem("bbj_heal_nav")).toBe(null);
    expect(location.replace).not.toHaveBeenCalled();
  });

  it("shows the error page (no heal) when storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
    };
    const location = makeLocation();
    const healed = attemptStaleBuildHeal(staleError(), { storage, location, now: 1_000_000 });
    expect(healed).toBe(false);
    expect(location.replace).not.toHaveBeenCalled();
  });
});
