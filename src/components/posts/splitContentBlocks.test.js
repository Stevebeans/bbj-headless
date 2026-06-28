import { describe, it, expect } from "vitest";
import { splitContentBlocks } from "./splitContentBlocks.js";

describe("splitContentBlocks", () => {
  it("splits top-level paragraphs at </p>", () => {
    const html = "<p>One</p><p>Two</p><p>Three</p>";
    expect(splitContentBlocks(html)).toEqual([
      "<p>One</p>",
      "<p>Two</p>",
      "<p>Three</p>",
    ]);
  });

  it("keeps a <ul> whose <li> contain <p> as ONE chunk (the bullet bug)", () => {
    const html =
      "<p>Look at this list:</p>" +
      "<ul><li><p>Dan</p></li><li><p>Memphis</p></li><li><p>Jessie</p></li></ul>" +
      "<p>After</p>";
    expect(splitContentBlocks(html)).toEqual([
      "<p>Look at this list:</p>",
      "<ul><li><p>Dan</p></li><li><p>Memphis</p></li><li><p>Jessie</p></li></ul>",
      "<p>After</p>",
    ]);
  });

  it("does not shred nested lists", () => {
    const html =
      "<ul><li><p>A</p><ul><li><p>A1</p></li></ul></li><li><p>B</p></li></ul>";
    expect(splitContentBlocks(html)).toEqual([html]);
  });

  it("treats ol / blockquote / table as atomic too", () => {
    expect(splitContentBlocks("<ol><li><p>x</p></li></ol>")).toEqual([
      "<ol><li><p>x</p></li></ol>",
    ]);
    expect(
      splitContentBlocks("<blockquote><p>q1</p><p>q2</p></blockquote>")
    ).toEqual(["<blockquote><p>q1</p><p>q2</p></blockquote>"]);
  });

  it("mixes paragraphs and a list correctly", () => {
    const html =
      "<p>A</p><p>B</p><ul><li><p>x</p></li><li><p>y</p></li></ul><p>C</p>";
    expect(splitContentBlocks(html)).toEqual([
      "<p>A</p>",
      "<p>B</p>",
      "<ul><li><p>x</p></li><li><p>y</p></li></ul>",
      "<p>C</p>",
    ]);
  });

  it("returns [] for empty/missing content", () => {
    expect(splitContentBlocks("")).toEqual([]);
    expect(splitContentBlocks(null)).toEqual([]);
    expect(splitContentBlocks(undefined)).toEqual([]);
  });
});
