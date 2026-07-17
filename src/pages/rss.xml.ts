import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { BASE_PATH } from "../consts";
import { getSiteSettings } from "../site-settings";

// プロジェクトコレクションからRSSフィードを生成する。
// draft を除外し、公開日の新しい順に並べる。
export async function GET(context: APIContext) {
  const site = await getSiteSettings();
  const projects = (await getCollection("projects"))
    .filter((project) => !project.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  // astro.config.mjs で site を設定していないと URL を解決できない。設定漏れを早期に検知する。
  if (!context.site) {
    throw new Error("astro.config.mjs に site が設定されていません");
  }

  // context.site は base（/homepage）を含まないため、サイト実体の URL に base を付与する。
  // これが channel の <link> になり、各 item の相対 link もこの URL を基準に解決される。
  const siteUrl = new URL(BASE_PATH, context.site).href;

  return rss({
    title: site.title,
    description: site.description,
    site: siteUrl,
    items: projects.map((project) => ({
      title: project.data.title,
      description: project.data.description,
      pubDate: project.data.pubDate,
      // base は siteUrl 側に含まれるため、ここでは相対パスにして解決を委ねる
      link: `projects/${project.id}/`,
    })),
  });
}
