import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// フォント定義（@font-face 606個・474KB）を外部CSSに置くか、各ページのHTMLへ
// インライン展開するかは、ここで見張っている書き方だけで決まる。どちらでも型検査も
// ビルドも通り、違いはページ遷移の転送量にしか出ない。
//
// 「外部CSSの中身が空になっていないか」はここでは見ない。それは
// src/pages/fonts.css.ts のビルド時チェックが担い、壊れるとビルドが落ちる。
// GitHub Actions は main への push ではビルドしか走らせない（deploy.yml の build ジョブが
// withastro/action を使う）ため、中身の検査はテストではなくビルドに載せている。
const srcDir = fileURLToPath(new URL(".", import.meta.url));

function read(relativePath: string): string {
  return readFileSync(join(srcDir, relativePath), "utf8");
}

// src 配下のソースを全部読む。1ファイルだけ見ていると、別のレイアウトやページに
// Font コンポーネントを足す形で同じ退行に戻せてしまう。
// テスト自身は対象外。ページに出力されないうえ、検査に使う文字列そのものに一致してしまう。
const sources = readdirSync(srcDir, { recursive: true, withFileTypes: true })
  .filter(
    (entry) =>
      entry.isFile() && /\.(astro|ts|tsx|js|mjs)$/.test(entry.name) && !entry.name.endsWith(".test.ts"),
  )
  .map((entry) => ({
    path: join(entry.parentPath, entry.name),
    text: readFileSync(join(entry.parentPath, entry.name), "utf8"),
  }));

describe("フォント定義の読み込み", () => {
  it("外部CSSとして読み込む", () => {
    // href は BASE_PATH 経由でなければ本番（/homepage 配下）で404になる。
    expect(read("components/BaseHead.astro")).toMatch(
      /<link\s+rel="stylesheet"\s+href=\{`\$\{BASE_PATH\}fonts\.css`\}/,
    );
  });

  it("外部CSSを組み立てるエンドポイントがある", () => {
    // これが消えると <link> だけが残り、全ページで404になってフォントが丸ごと消える。
    expect(() => read("pages/fonts.css.ts")).not.toThrow();
  });

  it("Astro の Font コンポーネントをどこでも使わない", () => {
    // Font コンポーネントは @font-face をそのページのHTMLへ <style> で展開する。
    // 1箇所でも戻ると、そのページだけ474KBに膨らみ、ページ間のキャッシュが効かなくなる。
    const used = sources.filter(({ text }) => /<Font\b/.test(text)).map(({ path }) => path);
    expect(used).toEqual([]);
  });

  it("出力する書体が astro.config.mjs の設定と一致する", () => {
    // 設定に書体を足しても fonts.css.ts に足し忘れると、その書体だけ黙って出ない。
    const config = readFileSync(new URL("../astro.config.mjs", import.meta.url), "utf8");
    const configured = [...config.matchAll(/cssVariable:\s*"([^"]+)"/g)].map((m) => m[1]);
    const emitted = [
      ...read("pages/fonts.css.ts").matchAll(/"(--font-[\w-]+)"/g),
    ].map((m) => m[1]);

    expect(configured.length).toBeGreaterThan(0);
    expect(emitted).toEqual(configured);
  });
});
