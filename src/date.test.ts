import { describe, it, expect, vi } from "vitest";
import { formatPubDate, formatFeedDate } from "./date";

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

describe("formatFeedDate", () => {
  // note の RSS が返す形式（日時＋タイムゾーン）
  it("日本時間の暦日で整形する", () => {
    expect(formatFeedDate("Fri, 10 Jul 2026 00:30:00 +0900", "ja-JP")).toBe(
      "2026/7/10",
    );
  });

  it("実行環境のタイムゾーンに関わらず日本時間の暦日を返す", () => {
    // UTCビルド（GitHub Actions）を再現する。日本時間 00:30 は UTC では前日 15:30
    vi.stubEnv("TZ", "UTC");
    try {
      expect(formatFeedDate("Fri, 10 Jul 2026 00:30:00 +0900", "ja-JP")).toBe(
        "2026/7/10",
      );
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
