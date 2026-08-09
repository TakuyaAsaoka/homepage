import { describe, it, expect } from "vitest";
import { navCurrentState } from "./nav";

// 本番デプロイ形態（GitHub Pages プロジェクトサイト）の基準パス
const BASE = "/homepage/";

describe("navCurrentState", () => {
  it("閲覧中のページ自身は page を返す", () => {
    expect(navCurrentState("/homepage/works/", `${BASE}works/`, BASE)).toBe(
      "page",
    );
  });

  it("子ルートでは親のナビ項目が true を返す", () => {
    expect(
      navCurrentState("/homepage/works/sample-work/", `${BASE}works/`, BASE),
    ).toBe("true");
  });

  it("別セクションのページでは undefined を返す", () => {
    expect(navCurrentState("/homepage/blog/", `${BASE}works/`, BASE)).toBe(
      undefined,
    );
  });

  it("前方一致でもセグメント境界を跨ぐパスには誤マッチしない", () => {
    expect(navCurrentState("/homepage/works-foo/", `${BASE}works/`, BASE)).toBe(
      undefined,
    );
  });

  it("HomeはHome自身でのみ page を返す", () => {
    expect(navCurrentState("/homepage/", BASE, BASE)).toBe("page");
  });

  it("Homeは子ルートでは undefined を返す（全パスの先頭に一致するため）", () => {
    expect(navCurrentState("/homepage/works/", BASE, BASE)).toBe(undefined);
  });

  it("末尾スラッシュの有無に依存しない", () => {
    expect(navCurrentState("/homepage/works", `${BASE}works/`, BASE)).toBe(
      "page",
    );
  });
});

// 独自ドメイン・ユーザーサイト（base "/"）のデプロイ形態。
// normalizePath("/") は空文字になり Home の比較が "" === "" という別経路を通るため、
// プロジェクトサイトとは別に固定する。
describe("navCurrentState（base が / のデプロイ形態）", () => {
  it("HomeはHome自身でのみ page を返す", () => {
    expect(navCurrentState("/", "/", "/")).toBe("page");
  });

  it("Homeは他セクションでは undefined を返す", () => {
    expect(navCurrentState("/blog/", "/", "/")).toBe(undefined);
  });

  it("子ルートでは親のナビ項目が true を返す", () => {
    expect(navCurrentState("/works/sample-work/", "/works/", "/")).toBe("true");
  });
});
