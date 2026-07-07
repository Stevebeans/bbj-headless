import { describe, expect, it } from "vitest";
import { centeredCrop, toPixelCrop } from "./cropUpload";

describe("centeredCrop", () => {
  it("crops the sides of a wide image for a square aspect", () => {
    const c = centeredCrop(1, 2000, 1000);
    expect(c.height).toBe(100);
    expect(c.width).toBe(50); // 1000px of 2000 = 50%
    expect(c.x).toBe(25);
    expect(c.y).toBe(0);
  });

  it("crops the top/bottom of a tall image for a square aspect", () => {
    const c = centeredCrop(1, 1000, 2000);
    expect(c.width).toBe(100);
    expect(c.height).toBe(50);
    expect(c.y).toBe(25);
  });

  it("covers the whole image when aspects match", () => {
    const c = centeredCrop(1200 / 350, 2400, 700);
    expect(Math.round(c.width)).toBe(100);
    expect(Math.round(c.height)).toBe(100);
  });
});

describe("toPixelCrop", () => {
  it("converts percent to natural pixels", () => {
    const px = toPixelCrop({ x: 25, y: 0, width: 50, height: 100 }, 2000, 1000);
    expect(px).toEqual({ x: 500, y: 0, width: 1000, height: 1000 });
  });

  it("clamps to image bounds against rounding overflow", () => {
    const px = toPixelCrop({ x: 50, y: 50, width: 50.04, height: 50.04 }, 1333, 777);
    expect(px.x + px.width).toBeLessThanOrEqual(1333);
    expect(px.y + px.height).toBeLessThanOrEqual(777);
  });
});
