import Parser from "rss-parser";

/** RSSフィードの1記事分の表示用データ。pubDate はISO 8601形式の日時か、空文字（日付なし） */
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
    const items = (feed.items ?? []).map((item) => ({
      title: item.title ?? "",
      link: item.link ?? "",
      // rss-parser が解釈できた日付だけを持つ isoDate を使う。生の pubDate をそのまま渡すと、
      // フィードの1件の日付が壊れているだけで表示側の new Date() が例外を投げ、ビルド全体が落ちる
      pubDate: item.isoDate ?? "",
    }));
    return { items, failed: false };
  } catch (error) {
    if (error instanceof Error) {
      console.error("RSSフィード取得エラー:", error.message);
    }
    return { items: [], failed: true };
  }
}
