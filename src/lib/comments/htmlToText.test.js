import { describe, it, expect } from "vitest";
import { htmlToText } from "./htmlToText";

describe("htmlToText", () => {
  it("decodes emoji entities in plain-text comments (no tags)", () => {
    // The 2026-08-22 report: wp_encode_emoji'd shrug in a plain comment
    expect(htmlToText("answered Paul &#x1f937;&#x200d;&#x2640;&#xfe0f;")).toBe(
      "answered Paul 🤷‍♀️"
    );
  });
  it("uses fromCodePoint for astral-plane emoji", () => {
    expect(htmlToText("&#x1f602;")).toBe("😂");
    expect(htmlToText("&#128514;")).toBe("😂");
  });
  it("leaves out-of-range entities literal instead of throwing", () => {
    expect(htmlToText("&#x110000;")).toBe("&#x110000;");
  });
  it("still normalizes legacy WPDiscuz HTML", () => {
    expect(htmlToText("<p>hi</p><p>there &#x1f37a;</p>")).toBe("hi\n\nthere 🍺");
  });
  it("decodes named entities", () => {
    expect(htmlToText("a &amp; b")).toBe("a & b");
  });
  it("passes through non-strings", () => {
    expect(htmlToText(null)).toBe(null);
  });
});
