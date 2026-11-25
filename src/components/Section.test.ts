import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import Section from "./Section.astro";

// 見出しが h1 か h2 かは、ページではなくこの部品が決める。
// 渡した値が HTML に出ることを、テンプレートを描画して確かめる。
async function renderSection(props: Record<string, unknown>) {
  const container = await AstroContainer.create();
  return container.renderToString(Section, {
    props: { title: "章の題", ...props },
    slots: { default: "<p>中身</p>" },
  });
}

describe("Section", () => {
  it("level を渡さないと h2、1 を渡すと h1 の見出しになる", async () => {
    expect(await renderSection({})).toMatch(/<h2[^>]*>.*章の題.*<\/h2>/s);
    expect(await renderSection({ level: 1 })).toMatch(/<h1[^>]*>.*章の題.*<\/h1>/s);
  });

  it("見出しは中身より前に出る", async () => {
    expect(await renderSection({})).toMatch(/<\/h2>.*<p>中身<\/p>/s);
  });

  it("英字の札は、渡したときだけ読み上げから隠して出す", async () => {
    expect(await renderSection({ label: "ABOUT" })).toMatch(/class="en-label"[^>]*aria-hidden="true"[^>]*>ABOUT</);
    expect(await renderSection({})).not.toContain('class="en-label"');
  });
});
