// デプロイ先の基準パス。Astro の BASE_URL は本番ビルドで末尾スラッシュを持たない
// （例: "/homepage"）ため、末尾スラッシュを保証した定数に集約する。
// import.meta.env.BASE_URL を直接文字列連結してはならない（本番でリンクが壊れる）
export const BASE_PATH = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

export const SITE_TITLE = "ASAOKA Homepage";
export const SITE_DESCRIPTION = "アサオカのホームページ";
export const SITE_URL = "https://TakuyaAsaoka.github.io";
export const SITE_LANG = "ja";
export const SITE_LOCALE = "ja-JP";

// SNSリンク（使わないものは空文字にする）
export const SOCIAL_LINKS = {
  github: "https://github.com/TakuyaAsaoka",
  twitter: "",
  youtube: "",
};

// noteのRSS URL（空文字でRSSフィード無効化）
export const NOTE_RSS_URL: string = "https://note.com/limber_iguana638/rss";

// Home ヒーローの表示名（フルネームにしない）
export const SITE_AUTHOR = "アサオカ";
// Contact の mailto に使うメールアドレス
export const EMAIL = "asaoka.biz@gmail.com";
