import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("wordpress.js API_URL resolution", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("prefers NEXT_PUBLIC_WORDPRESS_API_URL (the only var browsers get)", async () => {
    vi.stubEnv("NEXT_PUBLIC_WORDPRESS_API_URL", "https://wp.example.com/wp-json");
    vi.stubEnv("WORDPRESS_API_URL", "https://server-only.example.com/wp-json");
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: 1 }) });
    vi.stubGlobal("fetch", fetchMock);

    const { bbjdFetch } = await import("./wordpress.js");
    await bbjdFetch("/feed-updates/recent");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://wp.example.com/wp-json/bbjd/v1/feed-updates/recent?wpv=2"
    );
  });

  it("falls back to WORDPRESS_API_URL on the server", async () => {
    vi.stubEnv("NEXT_PUBLIC_WORDPRESS_API_URL", "");
    vi.stubEnv("WORDPRESS_API_URL", "https://server-only.example.com/wp-json");
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: () => Promise.resolve({ ok: 1 }) });
    vi.stubGlobal("fetch", fetchMock);

    const { bbjdFetch } = await import("./wordpress.js");
    await bbjdFetch("/houseboard");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://server-only.example.com/wp-json/bbjd/v1/houseboard?wpv=2"
    );
  });
});
