// デプロイ先の基準パス。Astro の BASE_URL は本番ビルドで末尾スラッシュを持たない
// （例: "/homepage"）ため、末尾スラッシュを保証した定数に集約する。
// import.meta.env.BASE_URL を直接文字列連結してはならない（本番でリンクが壊れる）
export const BASE_PATH = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

// サイト名・SNSリンク等の文言はCMS管理（src/content/settings/site.yaml）。
// ここには技術的な定数のみを置く
export const SITE_LANG = "ja";
export const SITE_LOCALE = "ja-JP";
// OGP（SNS/チャット共有）のデフォルト画像。ページ個別指定が無いときのフォールバック
export const DEFAULT_OG_IMAGE = `${BASE_PATH}images/og.png`;
