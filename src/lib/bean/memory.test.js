import { describe, expect, it } from "vitest";
import { capNote, chooseNote } from "./memory";

describe("capNote", () => {
  it("returns short notes unchanged", () => {
    expect(capNote("FACTS:\n- likes Chelsie", 1000)).toBe("FACTS:\n- likes Chelsie");
  });

  it("cuts at a sentence boundary instead of mid-sentence when over the cap", () => {
    const text = "First sentence. Second sentence. Third one that will not fit at all.";
    const capped = capNote(text, 40);
    expect(capped).toBe("First sentence. Second sentence.");
  });

  it("falls back to a hard cut when there is no sentence boundary", () => {
    const text = "x".repeat(60);
    expect(capNote(text, 40)).toHaveLength(40);
  });
});

describe("chooseNote", () => {
  it("accepts a normal rewrite", () => {
    const prior = "FACTS:\n- Chelsie is Steve's favorite player\nSTYLE:\n- analytical";
    const candidate = prior + "\n- also likes Xavier";
    expect(chooseNote(prior, candidate)).toBe(candidate);
  });

  it("keeps the prior note when the rewrite comes back empty", () => {
    const prior = "FACTS:\n- Chelsie is Steve's favorite player";
    expect(chooseNote(prior, "")).toBe(prior);
    expect(chooseNote(prior, "   ")).toBe(prior);
  });

  it("keeps the prior note when the rewrite collapses to a fraction of it", () => {
    const prior = "F".repeat(600); // an established, substantial note
    const candidate = "Suddenly tiny."; // model glitch — lost almost everything
    expect(chooseNote(prior, candidate)).toBe(prior);
  });

  it("accepts a first-ever note even though prior is empty", () => {
    expect(chooseNote("", "FACTS:\n- new fan, likes BB26")).toBe("FACTS:\n- new fan, likes BB26");
  });

  it("allows real shrinkage of small notes (not yet established)", () => {
    // A 100-char note isn't "established" — normal rewording may shrink it.
    const prior = "Steve likes Big Brother and asked one question about BB16 winners.";
    const candidate = "Steve likes Big Brother.";
    expect(chooseNote(prior, candidate)).toBe(candidate);
  });
});
