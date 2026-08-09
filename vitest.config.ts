import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // 現在のテスト対象は DOM に依存しない純ロジックのみのため node 環境で実行する。
    // reveal.ts など DOM 依存スクリプトをテストする際に jsdom へ切り替える。
    environment: "node",
  },
});
