import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// フォント定義（@font-face 606個・474KB）を外部CSSに置くか、各ページのHTMLへ
// インライン展開するかは BaseHead.astro の書き方だけで決まる。どちらでも型検査も
// ビルドも通り、違いはページ遷移の転送量にしか出ないため、ここで書き方を固定する。
//
// 「外部CSSの中身が空になっていないか」はここでは見ない。それは
// src/pages/fonts.css.ts のビルド時チェックが担い、壊れるとビルドが落ちる。
const baseHead = readFileSync(new URL("./components/BaseHead.astro", import.meta.url), "utf8");

describe("フォント定義の読み込み", () => {
  it("外部CSSとして読み込む", () => {
    // href は BASE_PATH 経由でなければ本番（/homepage 配下）で404になる。
    expect(baseHead).toMatch(/<link\s+rel="stylesheet"\s+href=\{`\$\{BASE_PATH\}fonts\.css`\}/);
  });

  it("Astro の Font コンポーネントを使わない", () => {
    // <Font> は @font-face をページのHTMLへ <style> で展開する。1つでも戻ると、
    // そのページだけ474KBに膨らみ、ページ間のブラウザキャッシュが効かなくなる。
    expect(baseHead).not.toMatch(/<Font\b/);
    expect(baseHead).not.toMatch(/\bFont\b.*from "astro:assets"/);
  });
});
