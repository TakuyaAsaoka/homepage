/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// .astro コンポーネントを描画して検査するテスト（TableOfContents.test.ts）があるため、
// Astro の Vite 設定を通す。素の defineConfig では .astro を読めずに構文エラーになる。
export default getViteConfig({
  test: {
    // 現在のテスト対象は DOM に依存しない純ロジックとHTML文字列の検査のみのため node 環境で実行する。
    // reveal.ts など DOM 依存スクリプトをテストする際に jsdom へ切り替える。
    environment: "node",
  },
});
