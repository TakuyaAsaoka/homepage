import type { MarkdownHeading } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import TableOfContents from "./TableOfContents.astro";

// 入れ子の組み立て自体は buildToc（src/toc.ts）が担い、src/toc.test.ts が見張っている。
// ここが見るのは戻り値をHTMLに落とすところ。読み上げに効くのは
// 「nav に名前が付いているか」「h3 が h2 の li の中の ul に入っているか」で、
// どちらも buildToc の戻り値には現れないためテンプレートを描画して確かめる。
async function renderToc(headings: MarkdownHeading[]) {
  const container = await AstroContainer.create();
  const html = await container.renderToString(TableOfContents, { props: { headings } });
  // Astro が付ける data-* は中身と関係ないため落とす。
  // data-astro-cid-* はスコープドスタイルの目印、data-astro-source-* は開発時の
  // ソース位置（絶対パスが入るため、残すと実行した機械によって結果が変わる）。
  return html
    .replace(/ data-astro-(cid-[\w-]+|source-file|source-loc)(="[^"]*")?/g, "")
    .replace(/\s+</g, "<")
    .trim();
}

const h = (depth: number, slug: string, text: string) => ({ depth, slug, text });

describe("TableOfContents", () => {
  it("h3 は h2 の項目の中の入れ子リストに入る", async () => {
    const html = await renderToc([h(2, "背景", "制作の背景"), h(3, "経緯", "きっかけ")]);
    expect(html).toBe(
      '<nav class="toc" aria-label="目次">' +
        '<ul role="list">' +
        '<li><a href="#背景">制作の背景</a>' +
        '<ul role="list"><li><a href="#経緯">きっかけ</a></li></ul>' +
        "</li>" +
        "</ul>" +
        "</nav>",
    );
  });

  it("h3 を持たない h2 には空のリストを出さない", async () => {
    const html = await renderToc([h(2, "背景", "背景"), h(2, "結果", "結果")]);
    expect(html).not.toContain("</a><ul");
  });

  it("目次の nav には名前を付ける（ページ内に nav が複数あるため）", async () => {
    const html = await renderToc([h(2, "背景", "背景"), h(2, "結果", "結果")]);
    expect(html).toContain('aria-label="目次"');
  });

  it("見出しが2つ未満のときは何も出さない", async () => {
    expect(await renderToc([h(2, "背景", "背景")])).toBe("");
    expect(await renderToc([])).toBe("");
  });

  it("リンク文字列は見出しの文言で、リンク先は slug のアンカー", async () => {
    // ビルド実測: 同じ文言の2つ目の見出しは id="制作の背景-1" になる
    const html = await renderToc([h(2, "制作の背景", "制作の背景"), h(2, "制作の背景-1", "制作の背景")]);
    expect(html).toContain('<li><a href="#制作の背景">制作の背景</a></li>');
    expect(html).toContain('<li><a href="#制作の背景-1">制作の背景</a></li>');
  });
});
