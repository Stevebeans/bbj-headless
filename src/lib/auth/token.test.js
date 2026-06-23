import { describe, it, expect } from "vitest";
import {
  decodeJwtPayload,
  getTokenExp,
  getTokenIat,
  isTokenExpired,
  shouldRefresh,
} from "./token.js";

// Build a fake unsigned JWT (header.payload.signature) for pure-decode tests.
function makeToken(payload) {
  const b64 = (obj) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64(payload)}.sig`;
}

describe("decodeJwtPayload", () => {
  it("decodes the payload segment", () => {
    const t = makeToken({ exp: 100, iat: 0, data: { user: { id: 7 } } });
    expect(decodeJwtPayload(t)?.data.user.id).toBe(7);
  });
  it("returns null for garbage", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBe(null);
    expect(decodeJwtPayload("")).toBe(null);
  });
});

describe("getTokenExp / getTokenIat", () => {
  it("reads numeric exp and iat", () => {
    const t = makeToken({ exp: 1234, iat: 1000 });
    expect(getTokenExp(t)).toBe(1234);
    expect(getTokenIat(t)).toBe(1000);
  });
  it("returns null when missing", () => {
    expect(getTokenExp(makeToken({ iat: 1 }))).toBe(null);
  });
});

describe("isTokenExpired", () => {
  it("is true at/after exp, false before", () => {
    const t = makeToken({ exp: 100, iat: 0 });
    expect(isTokenExpired(t, 99)).toBe(false);
    expect(isTokenExpired(t, 100)).toBe(true);
    expect(isTokenExpired(t, 101)).toBe(true);
  });
  it("treats undecodable tokens as expired", () => {
    expect(isTokenExpired("bad", 0)).toBe(true);
  });
});

describe("shouldRefresh", () => {
  const t = makeToken({ iat: 0, exp: 100 }); // 100s lifetime
  it("is false before the threshold", () => {
    expect(shouldRefresh(t, 49, 0.5)).toBe(false);
  });
  it("is true at/after the threshold but before expiry", () => {
    expect(shouldRefresh(t, 50, 0.5)).toBe(true);
    expect(shouldRefresh(t, 99, 0.5)).toBe(true);
  });
  it("is false once expired (must re-login, not refresh)", () => {
    expect(shouldRefresh(t, 100, 0.5)).toBe(false);
  });
  it("is false for malformed tokens", () => {
    expect(shouldRefresh("bad", 0, 0.5)).toBe(false);
    expect(shouldRefresh(makeToken({ exp: 100 }), 60, 0.5)).toBe(false); // no iat
  });
});
