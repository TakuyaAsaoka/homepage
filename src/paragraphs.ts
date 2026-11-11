// CMSの複数行の文章を、空行区切りで段落に分ける。
// Aboutの各セクションと、Homeの自己紹介（Aboutの経歴を出す）で共用する
export function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}
