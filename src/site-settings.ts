import { getEntry } from "astro:content";

// サイト設定（CMS管理）を取得する。取得点をここに集約し、
// ファイル欠落時はビルドを失敗させて設定漏れを早期に検知する
export async function getSiteSettings() {
  const entry = await getEntry("settings", "site");
  if (!entry) {
    throw new Error("サイト設定（src/content/settings/site.yaml）が見つかりません");
  }
  return entry.data;
}
