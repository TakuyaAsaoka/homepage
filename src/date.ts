// 公開日（"YYYY-MM-DD" の暦日）を表示用の文字列に整形する。
// UTC固定で整形し、ビルド環境のタイムゾーンで日付が1日ずれることを防ぐ
// （例: TZ=America/New_York で "2026-07-10" が 7/9 と表示されるのを防ぐ）。
export function formatPubDate(pubDate: string, locale: string): string {
  return new Date(pubDate).toLocaleDateString(locale, { timeZone: "UTC" });
}

// RSSの pubDate（日時＋タイムゾーンを持つ「瞬間」）を、日本時間での暦日に落として整形する。
// 読者は日本時間で記事の公開日を捉えるため、ビルド環境ではなく Asia/Tokyo に固定する
// （UTCビルドのGitHub Actionsでは、日本時間 00:00〜09:00 公開の記事が前日になってしまう）。
// formatPubDate はUTC固定なので流用してはならない（同じズレが逆向きに起きる）。
export function formatFeedDate(instant: string, locale: string): string {
  return new Date(instant).toLocaleDateString(locale, {
    timeZone: "Asia/Tokyo",
  });
}
