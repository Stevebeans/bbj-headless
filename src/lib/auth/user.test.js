import { describe, it, expect } from "vitest";
import { normalizeUserData } from "./user";

describe("normalizeUserData", () => {
  it("exposes the avatar from a password-login /auth/me payload", () => {
    // /auth/me returns user_avatar; the header reads user.avatar. Password
    // logins showed the initial letter until the next full load (nicolet77 9/5).
    const user = normalizeUserData({
      user_id: 41127,
      user_display_name: "Nicole",
      user_avatar: "https://wp.example/avatar_41127.webp",
      user_roles: ["supporter"],
    });
    expect(user.avatar).toBe("https://wp.example/avatar_41127.webp");
  });

  it("keeps an avatar that was already set (Google login shape)", () => {
    const user = normalizeUserData({ display_name: "N", avatar: "https://x/a.png", roles: ["subscriber"] });
    expect(user.avatar).toBe("https://x/a.png");
  });

  it("normalizes roles and display name like before", () => {
    const user = normalizeUserData({
      user_display_name: { name: "Obj Name" },
      user_roles: { 0: "administrator", 34: "updater" },
    });
    expect(user.user_display_name).toBe("Obj Name");
    expect(user.user_roles).toEqual(["administrator", "updater"]);
    expect(user.avatar).toBe("");
  });
});
