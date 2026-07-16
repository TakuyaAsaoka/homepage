import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://TakuyaAsaoka.github.io",
  base: "/homepage",
  integrations: [sitemap()],
});
