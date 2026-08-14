import type { MarkdownHeading } from "astro";

export interface TocEntry {
  heading: MarkdownHeading;
  children: MarkdownHeading[];
}

// 見出しの並びを h2 とその配下の h3 という入れ子に組み替える。
// 目次に載せるのは h2 と h3 だけ（h1 はページ見出し、h4 以下は細かすぎる）。
// 2つ未満なら空配列を返す＝目次を出さない、を戻り値に畳んでいる。
// 最初の h2 より前に h3 が来る本文もCMSでは書けるため、ぶら下げるのは
// 直前の項目が h2 のときだけにする。親のいない h3 は最上位の項目として扱う
// （直前の項目を無条件に親にすると、h2 の無い本文で h3 どうしが親子になる）。
export function buildToc(headings: MarkdownHeading[]): TocEntry[] {
  const targets = headings.filter(({ depth }) => depth === 2 || depth === 3);
  if (targets.length < 2) return [];
  const entries: TocEntry[] = [];
  for (const heading of targets) {
    const parent = entries.at(-1);
    if (heading.depth === 3 && parent?.heading.depth === 2) {
      parent.children.push(heading);
    } else {
      entries.push({ heading, children: [] });
    }
  }
  return entries;
}
