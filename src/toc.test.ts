import { describe, expect, it } from "vitest";
import { buildToc } from "./toc";

const h = (depth: number, slug: string, text: string) => ({ depth, slug, text });

describe("buildToc", () => {
  it("h2 の配下に h3 をぶら下げる", () => {
    expect(buildToc([h(2, "a", "A"), h(3, "b", "B"), h(2, "c", "C")])).toEqual([
      { heading: h(2, "a", "A"), children: [h(3, "b", "B")] },
      { heading: h(2, "c", "C"), children: [] },
    ]);
  });

  it("見出しが1つだけのときは空配列を返す", () => {
    expect(buildToc([h(2, "a", "A")])).toEqual([]);
  });

  it("見出しが無いときは空配列を返す", () => {
    expect(buildToc([])).toEqual([]);
  });

  it("h1 と h4 は目次に載せない", () => {
    // 目次が出る構成（h2が2つ）で見る。h2が1つ以下だとしきい値で空配列になり、
    // 絞り込みを広げる退行を見逃す
    expect(
      buildToc([h(1, "t", "T"), h(2, "a", "A"), h(4, "d", "D"), h(2, "c", "C")]),
    ).toEqual([
      { heading: h(2, "a", "A"), children: [] },
      { heading: h(2, "c", "C"), children: [] },
    ]);
  });

  it("h1 と h4 はしきい値の数にも入れない", () => {
    expect(buildToc([h(1, "a", "A"), h(4, "b", "B"), h(2, "c", "C")])).toEqual([]);
  });

  it("最初の h2 より前に h3 が来ても落ちず、最上位の項目になる", () => {
    expect(buildToc([h(3, "a", "A"), h(2, "b", "B")])).toEqual([
      { heading: h(3, "a", "A"), children: [] },
      { heading: h(2, "b", "B"), children: [] },
    ]);
  });

  it("連続する h3 は同じ h2 にまとまる", () => {
    expect(buildToc([h(2, "a", "A"), h(3, "b", "B"), h(3, "c", "C")])).toEqual([
      { heading: h(2, "a", "A"), children: [h(3, "b", "B"), h(3, "c", "C")] },
    ]);
  });

  it("重複した見出しは別々の slug のまま保つ", () => {
    expect(buildToc([h(2, "背景", "背景"), h(2, "背景-1", "背景")])).toEqual([
      { heading: h(2, "背景", "背景"), children: [] },
      { heading: h(2, "背景-1", "背景"), children: [] },
    ]);
  });
});
