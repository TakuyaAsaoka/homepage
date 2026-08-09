import { describe, it, expect } from "vitest";
import { MONTH_SEASONS, monthToSeason } from "./season";

describe("monthToSeason", () => {
  it("12〜2月を winter と判定する", () => {
    expect([12, 1, 2].map(monthToSeason)).toEqual([
      "winter",
      "winter",
      "winter",
    ]);
  });

  it("3〜5月を spring と判定する", () => {
    expect([3, 4, 5].map(monthToSeason)).toEqual([
      "spring",
      "spring",
      "spring",
    ]);
  });

  it("6〜8月を summer と判定する", () => {
    expect([6, 7, 8].map(monthToSeason)).toEqual([
      "summer",
      "summer",
      "summer",
    ]);
  });

  it("9〜11月を autumn と判定する", () => {
    expect([9, 10, 11].map(monthToSeason)).toEqual([
      "autumn",
      "autumn",
      "autumn",
    ]);
  });
});

describe("MONTH_SEASONS", () => {
  it("index 0 が1月、index 11 が12月に対応する12要素の配列である", () => {
    expect(MONTH_SEASONS).toHaveLength(12);
    expect(MONTH_SEASONS[0]).toBe("winter");
    expect(MONTH_SEASONS[11]).toBe("winter");
  });

  it("全要素が monthToSeason の結果と一致する", () => {
    expect(MONTH_SEASONS).toEqual(
      Array.from({ length: 12 }, (_, i) => monthToSeason(i + 1)),
    );
  });
});
