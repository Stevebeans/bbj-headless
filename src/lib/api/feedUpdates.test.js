import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("fetchRecentFeedUpdates", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_WORDPRESS_API_URL", "https://wp.example.com/wp-json");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("GETs the param-less recent endpoint, unauthenticated, no-store", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ updates: [{ id: 1 }], total: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { fetchRecentFeedUpdates } = await import("./feedUpdates.js");
    const updates = await fetchRecentFeedUpdates();

    expect(updates).toEqual([{ id: 1 }]);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe("https://wp.example.com/wp-json/bbjd/v1/feed-updates/recent");
    expect(opts.cache).toBe("no-store");
    expect(opts.headers).toBeUndefined(); // MUST stay anonymous — shared cached payload
  });

  it("throws on a non-OK response (caller swallows + retries next tick)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    const { fetchRecentFeedUpdates } = await import("./feedUpdates.js");
    await expect(fetchRecentFeedUpdates()).rejects.toThrow("503");
  });

  it("returns [] when the payload has no updates array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) })
    );
    const { fetchRecentFeedUpdates } = await import("./feedUpdates.js");
    await expect(fetchRecentFeedUpdates()).resolves.toEqual([]);
  });
});
