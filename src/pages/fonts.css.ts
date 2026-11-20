import { buildFontCss } from "../font-css";

// 全ページが読む書体。astro.config.mjs の fonts に書いた cssVariable と一致させる。
// 設定を直接 import すると Rollup が解決に失敗するため、ここに並べたうえで
// 一致を src/fonts.test.ts が見張っている（fonts-mono.css.ts の分と合わせて見る）。
const CSS_VARIABLES = ["--font-sans"];

// @font-face と CSS 変数（--font-sans）を1枚の外部CSSにまとめて出す。
// Astro の Font コンポーネントは同じ内容を各ページのHTMLへインライン展開するため、
// ページをまたいだブラウザキャッシュが効かない（日本語は unicode-range で分割され、
// 1書体で367定義・約290KBになる）。読み込みは BaseHead.astro の <link> が行う。
export function GET() {
  return new Response(buildFontCss(CSS_VARIABLES), { headers: { "Content-Type": "text/css" } });
}
