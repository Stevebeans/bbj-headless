import { describe, it, expect } from "vitest";
import { quickReplyPrefix, threadCta } from "./threadComments";

describe("quickReplyPrefix", () => {
  it("formats PT time and truncates long text with an ellipsis", () => {
    const p = quickReplyPrefix({
      created_at: "2026-07-14 11:05:00", // UTC -> 4:05 AM PDT
      text: "Wait where's Rome... Ohhh in Lyrics bed lmao. Also a bed empty near Jason and Kamu? And more words to push this over eighty characters total for sure.",
    });
    expect(p.startsWith('Re: the 4:05 AM PT feed update: "')).toBe(true);
    expect(p).toContain("...\"");
    expect(p.endsWith("\n\n")).toBe(true);
    const quoted = p.slice(p.indexOf('"') + 1, p.lastIndexOf('"'));
    expect(quoted.length).toBeLessThanOrEqual(83); // 80 + ellipsis
  });

  it("keeps short text unelided and quotes it fully", () => {
    const p = quickReplyPrefix({ created_at: "2026-07-14 02:23:00", text: "Barrett with some new hair" });
    expect(p).toBe('Re: the 7:23 PM PT feed update: "Barrett with some new hair"\n\n');
  });

  it("omits the time clause for invalid dates and quotes for empty text", () => {
    expect(quickReplyPrefix({ created_at: "nope", text: "hi" })).toBe('Re: the feed update: "hi"\n\n');
    expect(quickReplyPrefix({ created_at: "2026-07-14 02:23:00", text: "" })).toBe("Re: the 7:23 PM PT feed update:\n\n");
  });
});

describe("threadCta", () => {
  it("is null without a thread", () => {
    expect(threadCta(null)).toBeNull();
    expect(threadCta(undefined)).toBeNull();
  });

  it("never renders a zero count", () => {
    expect(threadCta({ slug: "monday-feeds", comment_count: 0 })).toEqual({
      label: "Be the first in today's thread",
      href: "/monday-feeds#comments",
    });
  });

  it("pluralizes correctly", () => {
    expect(threadCta({ slug: "s", comment_count: 1 }).label).toBe("Join today's conversation · 1 comment");
    expect(threadCta({ slug: "s", comment_count: 47 }).label).toBe("Join today's conversation · 47 comments");
  });
});
