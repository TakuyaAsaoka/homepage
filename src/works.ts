import { getCollection, type CollectionEntry } from "astro:content";

// 公開works（draftでない制作）をpubDate降順で取得する。
// 「公開の定義（=!draft）」をここに一元化し、一覧・詳細・将来のタグ別一覧で共用する。
export async function getPublishedWorks(): Promise<CollectionEntry<"works">[]> {
  return (await getCollection("works"))
    .filter((work) => !work.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
