import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// 進行バーの「いつ出すか」「どこまで伸ばすか」「何色か」は global.css の値が決めており、
// nav-progress.ts 側には数値が無い。値が失われても型チェックもビルドも通ってしまい、
// 崩れ方はブラウザでしか見えないため、CSSをテキストとして読んで値だけを固定する。
// 見た目そのもの（実際に描画されるか）はここでは分からない。それはブラウザで確認する。
const css = readFileSync(
  new URL("../styles/global.css", import.meta.url),
  "utf8",
);

// コメントを取り除いた本文。コメント内の記述に引っかかって、
// 実際には消えている宣言を「ある」と誤判定するのを防ぐ。
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, "");

// セレクタに対応する宣言ブロックの中身を取り出す。見つからなければ空文字。
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = declarations.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  return found?.[1] ?? "";
}

// バーを出すときの規則は3つ（通常・reduced-motionのクラス・reduced-motionのメディア指定）。
// 3つとも同じ待ち時間を使っていることまで見る。片方だけ変えられると、
// 視差効果を減らす設定の人にだけバーが出っぱなしになる。
const navigatingSelectors = [
  "html[data-navigating] .nav-progress",
  "html.reduced-motion[data-navigating] .nav-progress",
];

describe("ページ遷移の進行バー", () => {
  it("短い遷移では出さないよう、表示までの待ち時間が確保されている", () => {
    const delay = declarations.match(/--nav-progress-delay:\s*(\d+)ms\s*;/);
    expect(delay, "--nav-progress-delay の定義が見つからない").not.toBeNull();

    // 本番実測: キャッシュ済み15ms・先読み完了39ms・デスクトップ回線のコールド213〜229ms。
    // これらでバーを出さないため、待ち時間はデスクトップの山より上に置く。
    expect(Number(delay?.[1])).toBeGreaterThanOrEqual(400);
  });

  it("バーを出すすべての規則が同じ待ち時間を参照する", () => {
    // メディア指定の中の規則は同名セレクタなので、ruleBody は最初の一致（通常の規則）を返す。
    // ここでは出現回数で「3つとも参照している」を見る。
    const references = declarations.match(/var\(--nav-progress-delay\)/g) ?? [];
    expect(references).toHaveLength(3);
  });

  it("色は季節アクセントのトークンを参照する", () => {
    // トークン名が変わると var() が不正値になり、バーは transparent になって
    // 画面から消える。それでもビルドも型チェックも通ってしまうため、ここで押さえる。
    expect(ruleBody(".nav-progress")).toMatch(
      /background-color:\s*var\(--season-accent\)/,
    );
    // 参照先の定義が実在すること（コメントを除いた本文で確認する）
    expect(declarations).toMatch(/--season-accent:\s*[^;]+;/);
  });

  it("視差効果を減らす設定では動きのない表示に切り替える", () => {
    // 既存の [data-reveal] と同じ二重の担保。JSのクラス付与とメディア指定の
    // どちらか片方が欠けても効くようにする。
    for (const selector of navigatingSelectors.slice(1)) {
      expect(
        ruleBody(selector),
        `${selector} が動きのない表示を使っていない`,
      ).toMatch(/animation:\s*nav-progress-static\s/);
    }
    // メディア指定側。ブロック内での位置に依存せず、条件と規則の同居だけを見る。
    const mediaBlock = declarations.match(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g,
    );
    expect(
      mediaBlock?.some((block) =>
        /html\[data-navigating\][^{]*\{[^}]*nav-progress-static/.test(block),
      ),
      "prefers-reduced-motion のブロックに動きのない表示の規則が無い",
    ).toBe(true);
    // 参照先のキーフレームが実在すること
    expect(declarations).toMatch(/@keyframes nav-progress-static\s*\{/);
  });

  it("進行の表示は満杯まで到達しない", () => {
    // 取得したバイト数は取れないので本物の進捗率は出せない。満杯＝完了の意味を空けておき、
    // 完了はページが切り替わること自体で示す。伸びる版と静止版の両方に効かせる。
    for (const name of ["nav-progress", "nav-progress-static"]) {
      const keyframes = declarations.match(
        new RegExp(`@keyframes ${name}\\s*\\{[\\s\\S]*?\\n\\}`),
      )?.[0];
      expect(keyframes, `@keyframes ${name} が見つからない`).toBeDefined();

      const scales = [...(keyframes ?? "").matchAll(/scaleX\(([\d.]+)\)/g)].map(
        (m) => Number(m[1]),
      );
      expect(
        scales.length,
        `@keyframes ${name} に scaleX が無い`,
      ).toBeGreaterThan(0);
      expect(
        Math.max(...scales),
        `@keyframes ${name} が満杯に到達している`,
      ).toBeLessThan(1);
    }
  });
});
