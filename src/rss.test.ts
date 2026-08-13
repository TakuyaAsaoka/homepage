import { describe, it, expect } from "vitest";
import { createServer } from "node:http";
import { fetchFeedItems } from "./rss";

/**
 * 渡したRSSを配るだけのHTTPサーバを立て、URLと停止関数を返す。
 * ネットワークをモックせず、実際の取得・パース経路をそのまま通すため。
 */
function serveFeed(xml: string) {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "application/rss+xml" });
    response.end(xml);
  });
  return new Promise<{ url: string; close: () => Promise<void> }>(
    (resolve, reject) => {
      // ポート0で空きポートを自動割り当てし、テストの並行実行でぶつからないようにする
      server.listen(0, "127.0.0.1", () => {
        const address = server.address();
        if (address === null || typeof address === "string") {
          reject(new Error("HTTPサーバのポートを取得できませんでした"));
          return;
        }
        resolve({
          url: `http://127.0.0.1:${address.port}/`,
          close: () => new Promise<void>((done) => server.close(() => done())),
        });
      });
    },
  );
}

function feedWith(items: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>テスト用フィード</title><link>https://example.test</link><description>テスト用</description>
${items}
</channel></rss>`;
}

describe("fetchFeedItems", () => {
  it("記事のタイトル・リンク・概要と、ISO 8601形式に正規化した公開日を取得する", async () => {
    const feed = await serveFeed(
      feedWith(`<item>
        <title>正常な記事</title>
        <link>https://example.test/1</link>
        <pubDate>Fri, 10 Jul 2026 00:30:00 +0900</pubDate>
        <description><![CDATA[<p>記事の書き出しです。</p>]]></description>
      </item>`),
    );
    try {
      const result = await fetchFeedItems(feed.url);

      expect(result.failed).toBe(false);
      expect(result.items).toEqual([
        {
          title: "正常な記事",
          link: "https://example.test/1",
          // 日本時間 7/10 00:30 はUTCでは前日 15:30
          pubDate: "2026-07-09T15:30:00.000Z",
          // HTMLタグは除かれた状態で取れる
          description: "記事の書き出しです。",
        },
      ]);
    } finally {
      await feed.close();
    }
  });

  it("noteが本文末尾に付ける「続きをみる」を概要から取り除く", async () => {
    const feed = await serveFeed(
      feedWith(`<item>
        <title>noteの記事</title>
        <link>https://example.test/3</link>
        <description><![CDATA[<p>こんにちは！</p>
本文の書き出しです。
続きをみる]]></description>
      </item>`),
    );
    try {
      const result = await fetchFeedItems(feed.url);

      expect(result.items[0]?.description).toBe(
        "こんにちは！\n本文の書き出しです。",
      );
    } finally {
      await feed.close();
    }
  });

  it("概要がない記事の概要は空文字になる", async () => {
    const feed = await serveFeed(
      feedWith(`<item>
        <title>概要がない記事</title>
        <link>https://example.test/4</link>
      </item>`),
    );
    try {
      const result = await fetchFeedItems(feed.url);

      expect(result.items[0]?.description).toBe("");
      expect(result.items[0]?.title).toBe("概要がない記事");
    } finally {
      await feed.close();
    }
  });

  it("日付として解釈できない公開日は空文字に落とす", async () => {
    const feed = await serveFeed(
      feedWith(`<item>
        <title>壊れた日付の記事</title>
        <link>https://example.test/2</link>
        <pubDate>いつか</pubDate>
      </item>`),
    );
    try {
      const result = await fetchFeedItems(feed.url);

      expect(result.failed).toBe(false);
      expect(result.items[0]?.pubDate).toBe("");
      // 日付が壊れていても記事自体は落とさない
      expect(result.items[0]?.title).toBe("壊れた日付の記事");
    } finally {
      await feed.close();
    }
  });

  it("取得に失敗したときは failed が true で items は空になる", async () => {
    // 誰も待ち受けていないポートに向ける
    const result = await fetchFeedItems("http://127.0.0.1:1/");

    expect(result).toEqual({ items: [], failed: true });
  });
});
