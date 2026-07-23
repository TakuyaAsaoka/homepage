import Parser from "rss-parser";

/** RSSフィードの1記事分の表示用データ */
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
      pubDate: item.pubDate ?? "",
    }));
    return { items, failed: false };
  } catch (error) {
    if (error instanceof Error) {
      console.error("RSSフィード取得エラー:", error.message);
    }
    return { items: [], failed: true };
  }
}
