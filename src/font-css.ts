import { componentDataByCssVariable } from "virtual:astro:assets/fonts/internal";

// 指定した書体の @font-face と CSS 変数をつないで返す。
// 書体のCSSを出すエンドポイント（src/pages/fonts.css.ts と fonts-mono.css.ts）が共用する。
export function buildFontCss(cssVariables: string[]): string {
  // 取得元は Astro の内部モジュールで、公開APIではない（client.d.ts に型宣言が無い）。
  // 形が変わると値が undefined になり、空または歯抜けのCSSがビルド成功のまま出てしまう。
  // 出来上がるのは「フォントが消えたサイト」なので、ここでビルドごと落とす。
  //
  // 「入っているものを確かめる」ではなく「出すと決めた書体を取りに行く」形にする。
  // 前者だと中身が丸ごと空になったときに一度も検査が回らず、素通りしてしまう。
  return cssVariables
    .map((cssVariable) => {
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
}
