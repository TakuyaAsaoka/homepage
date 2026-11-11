import { describe, expect, it } from "vitest";
import { toParagraphs } from "./paragraphs";

describe("toParagraphs", () => {
  it("空行で段落に分け、前後の空白と空の段落を落とす", () => {
    expect(toParagraphs("一つ目の段落\n\n  二つ目の段落  \n\n\n\n")).toEqual([
      "一つ目の段落",
      "二つ目の段落",
    ]);
  });

  it("空行の無い改行では段落を分けない", () => {
    expect(toParagraphs("一行目\n二行目")).toEqual(["一行目\n二行目"]);
  });
});
