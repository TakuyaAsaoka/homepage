import { buildFontCss } from "../font-css";

// Home のヒーロー（エディタの窓）だけが使う等幅の書体。
// fonts.css に入れると、等幅を使わないページも定義（355個・約280KB）を読むことになるため、
// 別のCSSに分けて Home だけが読む（読み込みは src/pages/index.astro の <link>）。
// astro.config.mjs の cssVariable との一致は src/fonts.test.ts が見張っている
const CSS_VARIABLES = ["--font-mono"];

export function GET() {
  return new Response(buildFontCss(CSS_VARIABLES), { headers: { "Content-Type": "text/css" } });
}
