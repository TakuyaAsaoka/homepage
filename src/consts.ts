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
// OGP共有と一覧カードのデフォルト画像。ページ個別指定が無いときのフォールバック。
// import で持つことで寸法が分かり、ファイルを消せばビルドが失敗する（URL直書きだと公開後まで気づけない）
export { default as DEFAULT_IMAGE } from "./assets/og.png";
