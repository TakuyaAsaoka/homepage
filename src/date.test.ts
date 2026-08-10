import { describe, it, expect, vi } from "vitest";
import { formatPubDate } from "./date";

describe("formatPubDate", () => {
  it("ja-JP のロケール形式で整形する", () => {
    expect(formatPubDate("2026-01-15", "ja-JP")).toBe("2026/1/15");
  });

  it("実行環境のタイムゾーンに関わらず暦日どおりに整形する", () => {
    // UTCより後ろ（西側）のTZ。UTC固定にしていないと前日にずれる
    vi.stubEnv("TZ", "America/New_York");
    try {
      expect(formatPubDate("2026-07-10", "ja-JP")).toBe("2026/7/10");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
