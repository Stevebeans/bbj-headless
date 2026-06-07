import { describe, it, expect } from "vitest";
import { chunkItem } from "./chunk.js";

const base = { id: 42, type: "post", title: "BB16 Finale", url: "/posts/bb16-finale", date: "2014-09-24" };

describe("chunkItem", () => {
  it("returns a single chunk for short text", () => {
    const chunks = chunkItem({ ...base, text: "Derrick won. The end." });
    expect(chunks).toHaveLength(1);
    expect(chunks[0].id).toBe("post:42#0");
    expect(chunks[0].text).toContain("Derrick won");
    expect(chunks[0].metadata).toMatchObject({ sourceId: 42, type: "post", title: "BB16 Finale", url: "/posts/bb16-finale" });
  });

  it("splits long text into multiple overlapping chunks with stable ids", () => {
    const para = "word ".repeat(500).trim();
    const text = [para, para, para].join("\n\n");
    const chunks = chunkItem({ ...base, text });
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].id).toBe("post:42#0");
    expect(chunks[1].id).toBe("post:42#1");
    const tail = chunks[0].text.split(/\s+/).slice(-20).join(" ");
    expect(chunks[1].text).toContain(tail.split(" ")[0]);
  });

  it("prefixes chunk text with the title for context", () => {
    const chunks = chunkItem({ ...base, text: "Short." });
    expect(chunks[0].text.startsWith("BB16 Finale")).toBe(true);
  });

  it("returns [] when there is no usable text", () => {
    expect(chunkItem({ ...base, text: "" })).toEqual([]);
    expect(chunkItem({ ...base, text: "   " })).toEqual([]);
  });
});
