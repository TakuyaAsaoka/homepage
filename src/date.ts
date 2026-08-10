// 公開日（"YYYY-MM-DD" の暦日）を表示用の文字列に整形する。
// UTC固定で整形し、ビルド環境のタイムゾーンで日付が1日ずれることを防ぐ
// （例: TZ=America/New_York で "2026-07-10" が 7/9 と表示されるのを防ぐ）。
export function formatPubDate(pubDate: string, locale: string): string {
  return new Date(pubDate).toLocaleDateString(locale, { timeZone: "UTC" });
}
