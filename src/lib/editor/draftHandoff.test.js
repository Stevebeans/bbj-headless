import { describe, it, expect } from "vitest";
import { splitBlogDraft } from "./draftHandoff";

describe("splitBlogDraft", () => {
  it("splits a Big Brother headline off the body", () => {
    const out = splitBlogDraft("Big Brother 28 Spoilers: Dee Targets Mallory\n\nBody text.");
    expect(out).toEqual({ title: "Big Brother 28 Spoilers: Dee Targets Mallory", body: "Body text." });
  });

  it("splits a Survivor headline off the body", () => {
    const out = splitBlogDraft("Survivor 51 Spoilers: An Idol Goes Unplayed\n\nBody text.");
    expect(out).toEqual({ title: "Survivor 51 Spoilers: An Idol Goes Unplayed", body: "Body text." });
  });

  it("leaves drafts without a known headline untouched", () => {
    const text = "Just a recap paragraph.\n\nAnother one.";
    expect(splitBlogDraft(text)).toEqual({ title: "", body: text });
  });
});
