import { describe, it, expect } from "vitest";
import { buildChatPrompt } from "./prompt.js";

const MATCHES = [
  { type: "post", title: "BB14 Recap", url: "/posts/bb14", date: "2012-09-19", text: "Ian Terry won Big Brother 14." },
  { type: "player", title: "Dan Gheesling", url: "/players/dan", date: "", text: "Dan finished runner-up in BB14." },
];

describe("buildChatPrompt", () => {
  it("puts the Voice Guide in a cached system block", () => {
    const { system } = buildChatPrompt("who won bb14?", MATCHES);
    expect(Array.isArray(system)).toBe(true);
    expect(system[0].type).toBe("text");
    expect(system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(system[0].text).toContain("Steve Beans");
  });

  it("injects retrieved context and the question into one user message", () => {
    const { messages } = buildChatPrompt("who won bb14?", MATCHES);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("user");
    const content = messages[0].content;
    expect(content).toContain("Ian Terry won Big Brother 14.");
    expect(content).toContain("BB14 Recap");
    expect(content).toContain("who won bb14?");
  });

  it("tells the model what to do when context is empty", () => {
    const { messages } = buildChatPrompt("who won bb99?", []);
    expect(messages[0].content).toMatch(/no .*context|nothing in the archive/i);
    expect(messages[0].content).toContain("who won bb99?");
  });
});
