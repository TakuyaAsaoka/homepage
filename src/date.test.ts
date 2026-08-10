import { describe, it, expect } from "vitest";
import { formatPubDate } from "./date";

describe("formatPubDate", () => {
  it("ja-JP のロケール形式で整形する", () => {
    expect(formatPubDate("2026-01-15", "ja-JP")).toBe("2026/1/15");
  });

  it("実行環境のタイムゾーンに関わらず暦日どおりに整形する", () => {
    const original = process.env.TZ;
    // UTCより後ろ（西側）のTZ。UTC固定にしていないと前日にずれる
    process.env.TZ = "America/New_York";
    try {
      expect(formatPubDate("2026-07-10", "ja-JP")).toBe("2026/7/10");
    } finally {
      process.env.TZ = original;
    }
  });
});
