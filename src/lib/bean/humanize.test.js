import { describe, it, expect } from "vitest";
import { humanize } from "./humanize.js";

describe("humanize", () => {
  it("turns em-dashes into commas", () => {
    expect(humanize("Paul is another one — guy made finals twice")).toBe(
      "Paul is another one, guy made finals twice"
    );
    expect(humanize("no spaces—either way")).toBe("no spaces, either way");
  });
  it("converts spaced en-dashes but leaves number ranges alone", () => {
    expect(humanize("she played 8 – 10 seasons")).toBe("she played 8, 10 seasons");
    expect(humanize("a 8–10 range")).toBe("a 8–10 range");
  });
  it("strips markdown bold/italic markers", () => {
    expect(humanize("**Janelle** was a *beast*")).toBe("Janelle was a beast");
  });
  it("leaves clean text untouched", () => {
    expect(humanize("Good guy, bad player.")).toBe("Good guy, bad player.");
  });
});
