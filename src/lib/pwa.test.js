import { describe, it, expect } from "vitest";
import { installAffordance } from "./pwa";

describe("installAffordance", () => {
  const base = { standalone: false, ios: false, hasPrompt: false, dismissed: false };

  it("shows nothing when already installed (standalone)", () => {
    expect(installAffordance({ ...base, standalone: true, hasPrompt: true })).toBe("none");
    expect(installAffordance({ ...base, standalone: true, ios: true })).toBe("none");
  });

  it("shows nothing when previously dismissed", () => {
    expect(installAffordance({ ...base, dismissed: true, hasPrompt: true })).toBe("none");
  });

  it("prefers the native prompt when available (Android/desktop)", () => {
    expect(installAffordance({ ...base, hasPrompt: true })).toBe("prompt");
    // native prompt wins even on iOS-reporting edge cases
    expect(installAffordance({ ...base, hasPrompt: true, ios: true })).toBe("prompt");
  });

  it("falls back to the iOS hint when there's no prompt API", () => {
    expect(installAffordance({ ...base, ios: true })).toBe("ios");
  });

  it("shows nothing on a plain browser with no prompt and no iOS", () => {
    expect(installAffordance(base)).toBe("none");
  });
});
