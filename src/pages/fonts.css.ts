import { componentDataByCssVariable } from "virtual:astro:assets/fonts/internal";

// 出力する書体。astro.config.mjs の fonts に書いた cssVariable と一致させる。
// 設定を直接 import すると Rollup が解決に失敗するため、ここに並べたうえで
// 一致を src/fonts.test.ts が見張っている。
const CSS_VARIABLES = ["--font-serif", "--font-sans"];

// @font-face と CSS 変数（--font-serif / --font-sans）を1枚の外部CSSにまとめて出す。
// Astro の Font コンポーネントは同じ内容を各ページのHTMLへインライン展開するため、
// ページをまたいだブラウザキャッシュが効かない（日本語は unicode-range で分割され、
// 606定義・474KBになる）。読み込みは BaseHead.astro の <link> が行う。
export function GET() {
  // 取得元は Astro の内部モジュールで、公開APIではない（client.d.ts に型宣言が無い）。
  // 形が変わると値が undefined になり、空または歯抜けのCSSがビルド成功のまま出てしまう。
  // 出来上がるのは「フォントが消えたサイト」なので、ここでビルドごと落とす。
  //
  // 「入っているものを確かめる」ではなく「出すと決めた書体を取りに行く」形にする。
  // 前者だと中身が丸ごと空になったときに一度も検査が回らず、素通りしてしまう。
  const css = CSS_VARIABLES.map((cssVariable) => {
      const familyCss = componentDataByCssVariable.get(cssVariable)?.css ?? "";
      // @font-face（書体の実体）と :root のCSS変数（参照する名前）の両方を要求する。
      // 片方だけでは、字が出ないか、指定しても効かないかのどちらかになる。
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
