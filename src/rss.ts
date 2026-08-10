import Parser from "rss-parser";

/** RSSフィードの1記事分の表示用データ。pubDate は日付として解釈できる文字列か、空文字（日付なし） */
export type FeedItem = {
  title: string;
  link: string;
  pubDate: string;
};

/** RSSフィードの取得結果。failed が true のとき items は常に空配列 */
export type FetchFeedResult = {
  items: FeedItem[];
  failed: boolean;
};

/** RSSフィードを取得し、表示用アイテムに変換する。url は空でない前提 */
export async function fetchFeedItems(url: string): Promise<FetchFeedResult> {
  try {
    const feed = await new Parser().parseURL(url);
    const items = (feed.items ?? []).map((item) => {
      const pubDate = item.pubDate ?? "";
      return {
        title: item.title ?? "",
        link: item.link ?? "",
        // 日付として解釈できない値は空文字に落とす。表示側はそのまま new Date() に渡すため、
        // ここで弾かないとフィードの1件が壊れているだけでビルド全体が落ちる
        pubDate: Number.isNaN(Date.parse(pubDate)) ? "" : pubDate,
      };
    });
    return { items, failed: false };
  } catch (error) {
    if (error instanceof Error) {
      console.error("RSSフィード取得エラー:", error.message);
    }
    return { items: [], failed: true };
  }
}
