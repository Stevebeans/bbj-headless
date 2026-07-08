import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { forceRefreshToken, maybeRefreshToken } from "./refresh";
import { getToken, clearToken } from "./cookies";

// node env: document undefined → no JS cookie; memoryToken drives getToken().

describe("forceRefreshToken anchor-only recovery", () => {
  beforeEach(() => {
    clearToken(); // reset in-memory token between tests
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends no Authorization header and includes credentials when tokenless", async () => {
    let captured = null;
    vi.stubGlobal("fetch", async (url, options) => {
      captured = { url, options };
      return { ok: true, json: async () => ({ token: "fresh-jwt" }) };
    });

    const token = await forceRefreshToken();

    expect(token).toBe("fresh-jwt");
    expect(captured.options.credentials).toBe("include");
    expect(captured.options.headers.Authorization).toBeUndefined();
    expect(JSON.parse(captured.options.body)).toEqual({ remember_me: true });
    // the fresh token is now the working credential (in-memory in node)
    expect(getToken()).toBe("fresh-jwt");
  });

  it("returns null when the server rejects (no anchor)", async () => {
    vi.stubGlobal("fetch", async () => ({ ok: false, status: 401, json: async () => ({}) }));
    expect(await forceRefreshToken()).toBeNull();
    expect(getToken()).toBeNull();
  });

  it("still sends Authorization when a live token exists", async () => {
    const { setToken } = await import("./cookies");
    // exp far in the future so isTokenExpired() is false
    const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 999999 })).toString("base64");
    const liveToken = `h.${payload}.s`;
    setToken(liveToken, true);

    let captured = null;
    vi.stubGlobal("fetch", async (url, options) => {
      captured = { url, options };
      return { ok: true, json: async () => ({ token: "fresh-jwt" }) };
    });

    await forceRefreshToken();
    expect(captured.options.headers.Authorization).toBe(`Bearer ${liveToken}`);
    expect(captured.options.credentials).toBe("include");
  });

  it("maybeRefreshToken still returns null with no token (unchanged)", async () => {
    expect(await maybeRefreshToken()).toBeNull();
  });
});
