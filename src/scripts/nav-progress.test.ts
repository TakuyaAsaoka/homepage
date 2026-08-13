import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// 進行バーの「いつ出すか」「どこまで伸ばすか」は global.css の値が決めており、
// nav-progress.ts 側には数値が無い。値が失われても型チェックもビルドも通ってしまい、
// 崩れ方はブラウザでしか見えないため、CSSをテキストとして読んで数値だけを固定する。
// 見た目そのもの（実際に描画されるか）はここでは分からない。それはブラウザで確認する。
const css = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");

// html[data-navigating] に対する animation 宣言（reduced-motion 用の規則は含めない）
const navigatingRule = css.match(/\nhtml\[data-navigating\][^{]*\{[^}]*\}/)?.[0] ?? "";

describe("ページ遷移の進行バー", () => {
  it("短い遷移では出さないよう、表示までの遅延が確保されている", () => {
    const delayMs = Number(navigatingRule.match(/animation:[^;]*?\s(\d+)ms\s+forwards/)?.[1]);

    // 本番実測: キャッシュ済み15ms・先読み完了39ms・デスクトップ回線のコールド213〜229ms。
    // これらでバーを出さないため、遅延はデスクトップの山より上に置く。
    expect(delayMs).toBeGreaterThanOrEqual(400);
  });

  it("進行の表示は満杯まで到達しない", () => {
    const keyframes = css.match(/@keyframes nav-progress\s*\{[\s\S]*?\n\}/)?.[0] ?? "";
    const scales = [...keyframes.matchAll(/scaleX\(([\d.]+)\)/g)].map((m) => Number(m[1]));

    // 取得したバイト数は取れないので本物の進捗率は出せない。満杯＝完了の意味を空けておき、
    // 完了はページが切り替わること自体で示す。
    expect(scales.length).toBeGreaterThan(0);
    expect(Math.max(...scales)).toBeLessThan(1);
  });
});
