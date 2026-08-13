// Astro が @font-face を組み立てて持っている内部モジュールの型。
// astro/client.d.ts は公開扱いの仮想モジュール（virtual:astro:image-styles.css 等）しか
// 宣言しておらず、これは宣言が無いため import が型エラーになる。
//
// この宣言は型を通すためだけのもので、安全装置ではない。ここに書いた形と
// Astro 側の実物がずれても型検査は気づかない（宣言のほうが優先されるため）。
// ずれの検出は src/pages/fonts.css.ts の実行時チェックが担う。
declare module "virtual:astro:assets/fonts/internal" {
  export const componentDataByCssVariable: Map<string, { css: string }>;
}
