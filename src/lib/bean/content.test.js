import { describe, it, expect } from "vitest";
import { stripHtml, normalizePost } from "./content.js";

describe("content helpers", () => {
  it("stripHtml removes tags and decodes basic entities", () => {
    expect(stripHtml("<p>Hello&amp; <b>world</b></p>")).toBe("Hello& world");
  });

  it("normalizePost maps a WP REST post to the chunker shape", () => {
    const wp = {
      id: 73683, date: "2026-05-20T10:00:00",
      link: "https://bigbrotherjunkies.com/posts/bb28-start-date",
      title: { rendered: "BB28 Has a Start Date" },
      content: { rendered: "<p>Hey junkies, big news.</p>" },
    };
    expect(normalizePost(wp)).toEqual({
      id: 73683, type: "post", title: "BB28 Has a Start Date",
      url: "/posts/bb28-start-date", date: "2026-05-20T10:00:00",
      text: "Hey junkies, big news.",
    });
  });
});
