import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  site: "https://takuyaasaoka.github.io",
  base: "/homepage",
  integrations: [sitemap()],
  // Google Fonts をビルド時に取得してセルフホスト化する（Issue #101）。
  // ここで取得した内容から @font-face と CSS 変数（--font-sans）を
  // 組み立てて1枚の外部CSSに出すのは src/pages/fonts.css.ts（Issue #147）。
  // Astro の Font コンポーネントは使わない（各ページのHTMLへインライン展開されるため）。
  fonts: [
    // 見出しも本文もこの1書体で出す（Issue #159）。見出しは 700、本文は 400、
    // 英字ラベルは 500 を使う。ここに無い太さをCSSで指定すると、ブラウザが作った太字になる
    {
      provider: fontProviders.google(),
      name: "Noto Sans JP",
      cssVariable: "--font-sans",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["latin", "japanese"],
      fallbacks: ["system-ui", "-apple-system", "sans-serif"],
    },
  ],
});
