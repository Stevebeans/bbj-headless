import { describe, it, expect } from "vitest";

// Fresh module per test — memoryToken is module state.
async function freshCookies() {
  const mod = await import("./cookies.js?t=" + Math.random());
  return mod;
}

describe("in-memory token fallback (no document, as in node/SSR-safe paths)", () => {
  it("getToken returns null initially", async () => {
    const { getToken } = await freshCookies();
    expect(getToken()).toBeNull();
  });

  it("setToken stores in memory even when document is undefined", async () => {
    const { setToken, getToken } = await freshCookies();
    setToken("jwt-abc", true);
    expect(getToken()).toBe("jwt-abc");
  });

  it("clearToken wipes the memory copy", async () => {
    const { setToken, clearToken, getToken } = await freshCookies();
    setToken("jwt-abc", true);
    clearToken();
    expect(getToken()).toBeNull();
  });

  it("getSessionHint is false without document", async () => {
    const { getSessionHint } = await freshCookies();
    expect(getSessionHint()).toBe(false);
  });

  it("clearSessionHint is a safe no-op without document", async () => {
    const { clearSessionHint } = await freshCookies();
    expect(() => clearSessionHint()).not.toThrow();
  });
});
