import { componentDataByCssVariable } from "virtual:astro:assets/fonts/internal";

// @font-face と CSS 変数（--font-serif / --font-sans）を1枚の外部CSSにまとめて出す。
// Astro の Font コンポーネントは同じ内容を各ページのHTMLへインライン展開するため、
// ページをまたいだブラウザキャッシュが効かない（日本語は unicode-range で分割され、
// 606定義・474KBになる）。読み込みは BaseHead.astro の <link> が行う。
export function GET() {
  // 取得元は Astro の内部モジュールで、公開APIではない（client.d.ts に型宣言が無い）。
  // 形が変わると値が undefined になり、join した結果は空文字か歯抜けのCSSになる。
  // どちらもビルドは緑のまま通り、出来上がるのは「フォントが消えたサイト」なので、
  // 書体ごとに中身を確かめてビルドごと落とす。全体を join してから見ると、
  // 片方の書体だけ欠けた状態（見出しは出るが本文だけ消える）を見逃す。
  const css = [...componentDataByCssVariable.entries()]
    .map(([cssVariable, data]) => {
      const familyCss = data?.css ?? "";
      if (!familyCss.includes("@font-face") || !familyCss.includes(cssVariable)) {
        throw new Error(
          `virtual:astro:assets/fonts/internal から ${cssVariable} の @font-face を` +
            "取得できませんでした。Astro の更新でこの内部モジュールの形が変わった可能性があります",
        );
      }
      return familyCss;
    })
    .join("");

  return new Response(css, { headers: { "Content-Type": "text/css" } });
}
