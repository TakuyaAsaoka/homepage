import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  site: "https://takuyaasaoka.github.io",
  base: "/homepage",
  integrations: [sitemap()],
  // Google Fonts をビルド時に取得してセルフホスト化する（Issue #101）。
  // ここで取得した内容から @font-face と CSS 変数（--font-serif / --font-sans）を
  // 組み立てて1枚の外部CSSに出すのは src/pages/fonts.css.ts（Issue #147）。
  // Astro の Font コンポーネントは使わない（各ページのHTMLへインライン展開されるため）。
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Shippori Mincho",
      cssVariable: "--font-serif",
      weights: [500, 600],
      styles: ["normal"],
      // "japanese" 単独だとウェイト 600 の取得が欠落する既知の問題があるため latin を併記する
      subsets: ["latin", "japanese"],
      fallbacks: ["Hiragino Mincho ProN", "serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Zen Kaku Gothic New",
      cssVariable: "--font-sans",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["latin", "japanese"],
      fallbacks: ["system-ui", "-apple-system", "sans-serif"],
    },
  ],
});
