import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// 進行バーの「いつ出すか」「どこまで伸ばすか」は global.css の値が決めており、
// nav-progress.ts 側には数値が無い。値が失われても型チェックもビルドも通ってしまい、
// 崩れ方はブラウザでしか見えないため、CSSをテキストとして読んで数値だけを固定する。
// 見た目そのもの（実際に描画されるか）はここでは分からない。それはブラウザで確認する。
const css = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");

// html[data-navigating] に対する animation 宣言（reduced-motion 用の規則は含めない）
const navigatingRule = css.match(/\nhtml\[data-navigating\][^{]*\{[^}]*\}/)?.[0] ?? "";

// バー本体のスタイル宣言
const barRule = css.match(/\n\.nav-progress\s*\{[^}]*\}/)?.[0] ?? "";

describe("ページ遷移の進行バー", () => {
  it("短い遷移では出さないよう、表示までの遅延が確保されている", () => {
    const delay = navigatingRule.match(/animation:[^;]*?\s(\d+)ms\s+forwards/);
    // 遅延が読み取れない＝ animation の書き方が変わったということなので、
    // NaN との比較で分かりにくく落ちる前にここで止める
    expect(delay, `animation の遅延を読み取れなかった: ${navigatingRule}`).not.toBeNull();

    // 本番実測: キャッシュ済み15ms・先読み完了39ms・デスクトップ回線のコールド213〜229ms。
    // これらでバーを出さないため、遅延はデスクトップの山より上に置く。
    expect(Number(delay?.[1])).toBeGreaterThanOrEqual(400);
  });

  it("色は季節アクセントのトークンを参照する", () => {
    // トークン名が変わると var() が不正値になり、バーは transparent になって
    // 画面から消える。それでもビルドも型チェックも通ってしまうため、ここで押さえる。
    expect(barRule).toMatch(/background-color:\s*var\(--season-accent\)/);
    expect(css).toMatch(/--season-accent:/);
  });

  it("視差効果を減らす設定では動きのない表示に切り替える", () => {
    // 既存の [data-reveal] と同じ二重の担保。JSのクラス付与とメディア指定の
    // どちらか片方が欠けても効くようにする。
    expect(css).toMatch(/html\.reduced-motion\[data-navigating\]\s*\.nav-progress/);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*html\[data-navigating\]\s*\.nav-progress/,
    );
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
