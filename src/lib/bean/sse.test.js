import { describe, it, expect } from "vitest";
import { sseEvent, parseSse } from "./sse.js";

describe("sseEvent", () => {
  it("encodes a JSON payload as an SSE data frame", () => {
    expect(sseEvent({ type: "delta", text: "hi" })).toBe('data: {"type":"delta","text":"hi"}\n\n');
  });
  it("encodes a done frame", () => {
    expect(sseEvent({ type: "done" })).toBe('data: {"type":"done"}\n\n');
  });
});

describe("parseSse", () => {
  it("extracts complete events and returns the incomplete remainder", () => {
    const buf = 'data: {"type":"delta","text":"a"}\n\ndata: {"type":"delta","text":"b"}\n\ndata: {"type":"do';
    const { events, rest } = parseSse(buf);
    expect(events).toEqual([
      { type: "delta", text: "a" },
      { type: "delta", text: "b" },
    ]);
    expect(rest).toBe('data: {"type":"do');
  });
});
