import { describe, it, expect } from "vitest";
import {
  decodeJwtPayload,
  getTokenExp,
  getTokenIat,
  isTokenExpired,
  shouldRefresh,
  decodeUserFromToken,
  normalizeRoles,
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

function fakeJwt(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `header.${body}.sig`;
}

describe("decodeUserFromToken", () => {
  it("extracts user fields from payload.data.user", () => {
    const token = fakeJwt({
      exp: 9999999999,
      data: { user: { id: 42, email: "a@b.c", display_name: "Steve", roles: ["administrator"] } },
    });
    expect(decodeUserFromToken(token)).toEqual({
      id: 42,
      user_id: 42,
      user_email: "a@b.c",
      user_display_name: "Steve",
      user_roles: ["administrator"],
      token,
    });
  });

  it("normalizes PHP object-shaped roles", () => {
    const token = fakeJwt({
      data: { user: { id: 7, roles: { 0: "subscriber", 2: "beta_tester" } } },
    });
    expect(decodeUserFromToken(token).user_roles).toEqual(["subscriber", "beta_tester"]);
  });

  it("returns null for malformed tokens and missing user id", () => {
    expect(decodeUserFromToken("garbage")).toBeNull();
    expect(decodeUserFromToken(fakeJwt({ data: { user: {} } }))).toBeNull();
    expect(decodeUserFromToken(null)).toBeNull();
  });

  it("defaults display name and email", () => {
    const token = fakeJwt({ data: { user: { id: 1 } } });
    const u = decodeUserFromToken(token);
    expect(u.user_display_name).toBe("User");
    expect(u.user_email).toBeNull();
    expect(u.user_roles).toEqual([]);
  });

  it("decodes base64url payloads (raw atob would break on these chars)", () => {
    // Craft a display name whose JSON, when base64url-encoded, differs from
    // plain base64 (contains - or _ instead of + or /).
    const payload = {
      data: { user: { id: 99, display_name: "???>>>???" } },
    };
    const json = JSON.stringify(payload);
    const b64url = Buffer.from(json).toString("base64url");
    expect(b64url).toMatch(/[-_]/); // sanity: this payload actually exercises url-safe chars
    const token = `header.${b64url}.sig`;
    const u = decodeUserFromToken(token);
    expect(u).not.toBeNull();
    expect(u.id).toBe(99);
    expect(u.user_display_name).toBe("???>>>???");
  });
});

describe("normalizeRoles", () => {
  it("passes arrays through, converts objects, defaults to []", () => {
    expect(normalizeRoles(["a"])).toEqual(["a"]);
    expect(normalizeRoles({ 0: "a", 2: "b" })).toEqual(["a", "b"]);
    expect(normalizeRoles(null)).toEqual([]);
  });
});
