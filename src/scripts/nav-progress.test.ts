import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// 進行バーの「いつ出すか」「どう動くか」「どこまで伸ばすか」「何色か」は global.css の値が
// 決めており、nav-progress.ts 側には数値が無い。値が失われても型チェックもビルドも通ってしまい、
// 崩れ方はブラウザでしか見えないため、CSSをテキストとして読んで値だけを固定する。
// 見た目そのもの（実際に描画されるか）はここでは分からない。それはブラウザで確認する。
const css = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../layouts/BaseLayout.astro", import.meta.url), "utf8");

// コメントを取り除いた本文。コメント内の記述に引っかかって、
// 実際には消えている宣言を「ある」と誤判定するのを防ぐ。
const declarations = css.replace(/\/\*[\s\S]*?\*\//g, "");

// セレクタに対応する宣言ブロックの中身を取り出す。
// 行頭に錨を打つのは、`.nav-progress` が `html[data-navigating] .nav-progress` の
// 末尾にも一致してしまい、規則の並び順で拾う対象が変わるのを防ぐため。
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const found = declarations.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  // 「規則が無い」と「規則はあるが中身が違う」を取り違えないよう、ここで落とす
  expect(found, `${selector} の規則が見つからない`).not.toBeNull();
  return found?.[1] ?? "";
}

// @keyframes の中身を取り出す。
function keyframesBody(name: string): string {
  const found = declarations.match(new RegExp(`@keyframes ${name}\\s*\\{[\\s\\S]*?\\n\\}`));
  expect(found, `@keyframes ${name} が見つからない`).not.toBeNull();
  return found?.[0] ?? "";
}

// animation の短縮記法を並びごと固定する。値がどこかにあることだけを見ると、次の3つを見逃す。
// ・時間値は1つ目が継続時間・2つ目が待ち時間。入れ替わると待ち時間が10sになりバーが実質出ない
// ・linear が落ちると既定の ease になり、伸び方の設計（前半で大きく伸ばす）が変わる
// ・forwards が落ちると終了時に基準の opacity: 0 へ戻る。静止版は継続時間が1msなので、
//   視差効果を減らす設定の利用者にバーが一度も出なくなる
function animationShorthand(name: string): RegExp {
  return new RegExp(
    `animation:\\s*${name}\\s+[\\d.]+m?s\\s+linear\\s+var\\(--nav-progress-delay\\)\\s+forwards`,
  );
}

// バーを出す規則は3つ（通常・reduced-motionのクラス・reduced-motionのメディア指定）。
// メディア指定の中はセレクタが通常時と同名なので、そこだけブロックごと取り出して見る。
const NORMAL = "html[data-navigating] .nav-progress";
const REDUCED_MOTION_CLASS = "html.reduced-motion[data-navigating] .nav-progress";

describe("ページ遷移の進行バー", () => {
  it("短い遷移では出さないよう、表示までの待ち時間が確保されている", () => {
    // 値の有無ではなく定義そのものを全部拾う。あとから別ブロックで上書きされると、
    // 先頭だけ見るテストは緑のまま待ち時間が変わってしまう。
    const definitions = [...declarations.matchAll(/--nav-progress-delay:([^;]*);/g)];
    expect(definitions, "--nav-progress-delay の定義はちょうど1つであること").toHaveLength(1);

    // 単位が落ちた「500」や空の値は、宣言としては通るのに待ち時間が0に化ける。
    // その場合バーは全遷移で即座に出るので、時間として読めることまで要求する。
    const value = definitions[0][1].trim();
    const time = value.match(/^([\d.]+)(ms|s)$/);
    expect(time, `待ち時間が時間として読めない: "${value}"`).not.toBeNull();

    const delayMs = time?.[2] === "s" ? Number(time[1]) * 1000 : Number(time?.[1]);
    // 本番実測: キャッシュ済み15ms・先読み完了39ms・デスクトップ回線のコールド213〜229ms。
    // これらでバーを出さないため、待ち時間はデスクトップの山より上に置く。
    expect(delayMs).toBeGreaterThanOrEqual(400);
  });

  it("通常時は伸びる表示を使う", () => {
    // 静止版に差し替えられると、待ち時間のあいだ動かない帯が出るだけになる。
    // 名前の直後に空白を要求しているので nav-progress-static とは一致しない。
    expect(ruleBody(NORMAL)).toMatch(animationShorthand("nav-progress"));
    expect(declarations).toMatch(/@keyframes nav-progress\s*\{/);
  });

  it("レイアウトにバーの要素と配線がある", () => {
    // CSSの値をどれだけ固定しても、当たる要素と配線が無ければ機能そのものが消える。
    expect(layout).toMatch(/<div class="nav-progress"/);
    expect(layout).toMatch(/initNavProgress\(\);/);
  });

  it("バーは画面上端に固定され、見える大きさを持って左から伸びる", () => {
    const body = ruleBody(".nav-progress");
    // position が落ちると div が通常の流れに入り、全ページで本文が2px下がる。
    expect(body).toMatch(/position:\s*fixed/);
    // 中身が空の固定要素なので、幅と高さのどちらが落ちても大きさが0になり画面から消える。
    expect(body).toMatch(/width:\s*100%/);
    expect(body).toMatch(/height:\s*[\d.]+px/);
    // 起点が中央だと、左右へ広がる別物の表示になる。
    expect(body).toMatch(/transform-origin:\s*0\s/);
  });

  it("色は季節アクセントのトークンを参照する", () => {
    // トークン名が変わると var() が不正値になり、バーは transparent になって
    // 画面から消える。それでもビルドも型チェックも通ってしまうため、ここで押さえる。
    expect(ruleBody(".nav-progress")).toMatch(/background-color:\s*var\(--season-accent\)/);
    // 参照先の定義が実在すること（コメントを除いた本文で確認する）
    expect(declarations).toMatch(/--season-accent:\s*[^;]+;/);
  });

  it("視差効果を減らす設定では動きのない表示に切り替える", () => {
    // 既存の [data-reveal] と同じ二重の担保。JSのクラス付与とメディア指定の
    // どちらか片方が欠けても効くようにする。
    expect(ruleBody(REDUCED_MOTION_CLASS)).toMatch(animationShorthand("nav-progress-static"));

    // メディア指定側。ブロック内での位置に依存せず、条件と規則の同居だけを見る。
    const mediaBlocks =
      declarations.match(/@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\n\}/g) ?? [];
    const block = mediaBlocks.find((b) =>
      /html\[data-navigating\][^{]*\{[^}]*nav-progress-static/.test(b),
    );
    expect(block, "prefers-reduced-motion のブロックに動きのない表示の規則が無い").toBeDefined();
    expect(block).toMatch(animationShorthand("nav-progress-static"));

    expect(declarations).toMatch(/@keyframes nav-progress-static\s*\{/);
  });

  it("バーは不透明になるところまで進む", () => {
    // 基準の規則は opacity: 0 なので、見えるかどうかはキーフレーム側だけが決めている。
    // 0 のままだと、伸びてはいるが透明で一度も見えないバーになる。
    for (const name of ["nav-progress", "nav-progress-static"]) {
      const values = [...keyframesBody(name).matchAll(/opacity:\s*([\d.]+)/g)].map((m) =>
        Number(m[1]),
      );
      expect(values.length, `@keyframes ${name} に opacity が無い`).toBeGreaterThan(0);
      expect(Math.max(...values), `@keyframes ${name} のバーが透明なままになる`).toBeGreaterThan(0);
    }
  });

  it("進行の表示は満杯まで到達しない", () => {
    // 取得したバイト数は取れないので本物の進捗率は出せない。満杯＝完了の意味を空けておき、
    // 完了はページが切り替わること自体で示す。伸びる版と静止版の両方に効かせる。
    for (const name of ["nav-progress", "nav-progress-static"]) {
      const scales = [...keyframesBody(name).matchAll(/scaleX\(([\d.]+)\)/g)].map((m) =>
        Number(m[1]),
      );
      expect(scales.length, `@keyframes ${name} に scaleX が無い`).toBeGreaterThan(0);
      expect(Math.max(...scales), `@keyframes ${name} が満杯に到達している`).toBeLessThan(1);
    }
  });
});
