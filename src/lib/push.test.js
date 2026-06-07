import { describe, it, expect } from "vitest";
import { urlBase64ToUint8Array } from "./push";

describe("urlBase64ToUint8Array", () => {
  it("decodes a base64url VAPID key to a Uint8Array", () => {
    const out = urlBase64ToUint8Array("aGVsbG8"); // "hello"
    expect(out).toBeInstanceOf(Uint8Array);
    expect(Array.from(out)).toEqual([104, 101, 108, 108, 111]);
  });
});
