import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import WorkCard from "./WorkCard.astro";

// 役割と結果は制作ごとに任意の項目。値が無い制作で空の行や見出しだけが残ると
// カードの高さと読み上げが崩れるため、テンプレートを描画して行の有無を確かめる。
async function renderCard(extra: { role?: string; outcome?: string }) {
  const container = await AstroContainer.create();
  return container.renderToString(WorkCard, {
    props: {
      title: "制作の名前",
      description: "制作の説明",
      tags: ["Astro"],
      slug: "sample",
      pubDate: "2026-01-01",
      ...extra,
    },
  });
}

describe("WorkCard", () => {
  it("役割と結果を渡すと、それぞれの行に出る", async () => {
    const html = await renderCard({ role: "設計から運用まで", outcome: "手作業が要らなくなった" });
    expect(html).toMatch(/class="role"[^>]*>設計から運用まで</);
    expect(html).toMatch(/class="outcome"[^>]*>.*手作業が要らなくなった/s);
  });

  it("役割と結果が無い制作では、その行を出さない", async () => {
    const html = await renderCard({});
    expect(html).not.toContain('class="role"');
    expect(html).not.toContain('class="outcome"');
    expect(html).not.toContain("結果");
  });
});
