# Google Fonts セルフホスト化（Astro Fonts API）実装プラン

- Issue: #101
- ブランチ: `feature/101-selfhost-fonts`
- 作成日: 2026-07-25
- 前提バージョン: astro 6.3.1（Fonts API は v6.0.0 で安定版）

## ゴール

Google Fonts（Shippori Mincho / Zen Kaku Gothic New）を **Astro v6 Fonts API（google プロバイダ）** でビルド時に取得し、woff2 を同一オリジン（GitHub Pages）から配信する。これにより:

- `fonts.googleapis.com` / `fonts.gstatic.com` への外部リクエストをゼロにする（プライバシー・接続オーバーヘッド削減）
- unicode-range によるサブセット分割（日本語フォントの分割配信）を維持する
- 見た目・ウェイト構成（Shippori Mincho 500/600、Zen Kaku Gothic New 400/500/700）は現状と同一を保つ

## 背景（なぜ Fonts API か / 不採用案）

| 案 | 判定 | 理由 |
|----|------|------|
| **Astro v6 Fonts API + google プロバイダ** | **採用** | フレームワーク標準機能。ビルド時に Google からフォントを取得・ハッシュ命名で `_astro/fonts/` に配置し、unicode-range 分割の @font-face と CSS 変数を自動生成。`base: "/homepage"` の考慮も組み込み済み。追加依存ゼロ |
| @fontsource | 不採用 | npm 依存が増える。unicode-range 分割は維持されるが、CSS 変数生成・preload 制御などは手作業 |
| woff2 直ダウンロード + 手書き @font-face | 不採用 | 日本語フォントは 100 超のサブセットファイルになり手動管理が非現実的 |
| glyphhanger によるサブセット自作 | 不採用 | CMS でコンテンツが増える度に再サブセットが必要。運用コストが高い |

## 対象ファイル

| ファイル | 変更内容 |
|---------|---------|
| `astro.config.mjs` | `fonts` 設定を追加（2 ファミリ） |
| `src/components/BaseHead.astro` | preconnect + Google Fonts stylesheet を `<Font>` コンポーネント×2 に置換 |
| `src/styles/global.css` | `--font-serif` / `--font-sans` の自前定義を削除（Fonts API が注入するため） |

変更不要: `--font-serif` / `--font-sans` を **参照** している側（`Header.astro`, `404.astro`, `index.astro`, `global.css` 内の `var(...)` 参照）は変数名が変わらないためそのまま。フォントファミリ名のリテラル参照は上記 2 ファイル（置換対象箇所）以外に存在しないことを確認済み。

## 仕組みの要点（実装前に理解すること）

node_modules/astro（6.3.1）の型定義・実装で確認済みの事実:

1. 設定は **トップレベルの `fonts` 配列**（experimental ではない）。`fontProviders` は `astro/config` からインポートする。
2. 各エントリのキー: `provider` / `name` / `cssVariable` / `weights` / `styles` / `subsets` / `fallbacks`（他に `display`, `formats`, `optimizedFallbacks` 等。デフォルト: `weights: [400]`, `styles: ["normal","italic"]`, `subsets: ["latin"]`, `formats: ["woff2"]`, `display: "swap"`）。
3. `<Font>` コンポーネントは `astro:assets` からインポートし、`<head>` 内に置く。Props は `cssVariable`（必須）と `preload`（省略時 false）のみ。
4. `<Font>` は **`<style>` タグをインライン注入**し、その中に「全 unicode-range 分の @font-face」と「`:root { --font-xxx: "<ファミリ名>-<ハッシュ>", <フォールバック...>; }`」を出力する。
   - **重要**: @font-face のファミリ名は `Shippori Mincho-<ハッシュ>` のようにハッシュ付きになる（`resolve-family.js` の `uniqueName`）。したがって CSS からは**必ず `var(--font-serif)` 経由で参照**し、`"Shippori Mincho"` というリテラル名を書いてはいけない。
   - **重要**: `:root { --font-serif: ... }` を注入するため、`global.css` 側に同名変数の定義が残っていると読み込み順で勝敗が不定になる。global.css 側の定義は**削除必須**。
5. フォールバックは `fallbacks` 配列で設定に移す。末尾が総称ファミリ（`serif` / `sans-serif` / `system-ui` 等）の場合、デフォルトでフォントメトリクスに基づく最適化フォールバック（size-adjust 付き）も自動生成される（`optimizedFallbacks`、デフォルト true のまま使う）。
6. フォントファイルはビルド時に Google から取得され `dist/_astro/fonts/<ハッシュ>.woff2` に出力される。URL は `base` 込みで `/homepage/_astro/fonts/...` になる（`vite-plugin-fonts.js` で `joinPaths(config.base, assetsDir)` を確認済み）。取得結果は `.astro/fonts/` にキャッシュされる。
7. **既知の quirk**: `subsets: ["japanese"]` 単独指定だと一部ウェイト（600）の @font-face が欠落する。**`["latin", "japanese"]` と併記する**こと（latin はどのみち英数字表示に必要）。

---

## Phase 1: astro.config.mjs に fonts 設定を追加

### 変更内容

`astro.config.mjs` 全体を以下に置き換える:

```js
import sitemap from "@astrojs/sitemap";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  site: "https://takuyaasaoka.github.io",
  base: "/homepage",
  integrations: [sitemap()],
  // Google Fonts をビルド時に取得してセルフホスト化する（Issue #101）。
  // @font-face と CSS 変数（--font-serif / --font-sans）は BaseHead.astro の
  // <Font> コンポーネントが :root に注入する。
  fonts: [
    {
      provider: fontProviders.google(),
      name: "Shippori Mincho",
      cssVariable: "--font-serif",
      weights: [500, 600],
      styles: ["normal"],
      // "japanese" 単独だとウェイト 600 の取得が欠落する既知の問題があるため latin を併記する
      subsets: ["latin", "japanese"],
      fallbacks: ["Hiragino Mincho ProN", "serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Zen Kaku Gothic New",
      cssVariable: "--font-sans",
      weights: [400, 500, 700],
      styles: ["normal"],
      subsets: ["latin", "japanese"],
      fallbacks: ["system-ui", "-apple-system", "sans-serif"],
    },
  ],
});
```

ポイント:

- `cssVariable` は既存 CSS が参照している変数名（`--font-serif` / `--font-sans`）**そのもの**にする。これにより参照側（Header.astro 等）は無変更で済む。
- `styles: ["normal"]` を明示する（デフォルトは italic を含むが、両フォントに italic は存在しないため）。
- `fallbacks` は現行 global.css の値をそのまま移植（Hiragino Mincho ProN / system-ui / -apple-system を失わない）。
- `display` は未指定（デフォルト `swap`。現行の Google Fonts URL の `display=swap` と同一）。

### 期待状態

- `npm run dev` 起動時にターミナルに fonts 関連のエラーが出ない（初回はフォント取得のため数秒かかる。`.astro/fonts/` にキャッシュが生成される）。
- この時点では `<Font>` 未設置のため画面上の変化はない。

### 検証

```bash
npm run build   # fonts 設定の zod バリデーションが通り、ビルド成功すること
```

---

## Phase 2: BaseHead.astro を `<Font>` に置き換え

### 変更内容

**(1) フロントマターにインポートを追加**（規約: インポート → Props 型定義 → ロジックの順。既存インポート群の位置に追加）:

```diff
 ---
+import { Font } from "astro:assets";
 import { SITE_LOCALE, BASE_PATH, DEFAULT_OG_IMAGE } from "../consts";
 import { getSiteSettings } from "../site-settings";
```

**(2) Fonts ブロック（現行 43–49 行目）を置換**:

```diff
-<!-- Fonts -->
-<link rel="preconnect" href="https://fonts.googleapis.com" />
-<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
-<link
-  rel="stylesheet"
-  href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
-/>
+<!-- Fonts（セルフホスト。@font-face と CSS 変数を注入する。設定: astro.config.mjs の fonts） -->
+<Font cssVariable="--font-serif" />
+<Font cssVariable="--font-sans" />
```

ポイント:

- `preload` は付けない。日本語フォントは unicode-range で 100 前後のファイルに分割されており、preload 対象の機械的な選別が難しい。現行（外部 CSS + display:swap）でも preload していないため、まずは同等挙動とする。preload 最適化は必要になったら別 Issue。
- BaseHead.astro は全レイアウト共通の head パーシャルなので、この 1 箇所の変更で全ページに適用される。

### 期待状態

- 全ページの `<head>` に `<style>`（@font-face 群 + `:root` の変数定義）が注入される。
- `fonts.googleapis.com` への `<link>` が消える。
- この時点では global.css にも旧定義が残っているが、変数値がどちらで解決されてもフォント表示は成立する（過渡状態として許容。Phase 3 で解消）。

### 検証

```bash
npm run dev
```

ブラウザで `http://localhost:4321/homepage/` を開き、DevTools → Network（Font フィルタ）で:

- フォントが `localhost:4321` の `/_astro/fonts/...` 系 URL から読まれること
- `fonts.gstatic.com` へのリクエストが**ない**こと

---

## Phase 3: global.css の自前定義を削除

### 変更内容

`src/styles/global.css` の 14–16 行目を置換:

```diff
-  /* フォント（Google Fonts） */
-  --font-serif: "Shippori Mincho", "Hiragino Mincho ProN", serif;
-  --font-sans: "Zen Kaku Gothic New", system-ui, -apple-system, sans-serif;
+  /* フォント: --font-serif / --font-sans は Astro Fonts API が注入する
+     （定義箇所: astro.config.mjs の fonts / 注入箇所: BaseHead.astro の <Font>）。
+     フォールバック（Hiragino Mincho ProN / system-ui 等）も astro.config.mjs 側で管理する */
```

ポイント:

- 変数の**定義**だけを削除する。`var(--font-serif)` / `var(--font-sans)` の**参照**箇所（global.css 内・Header.astro・404.astro・index.astro）は一切触らない。
- コメントを残し、変数の出所を明示する（グローバル CSS だけ読んだ人が迷子にならないように）。

### 期待状態

- `--font-serif` / `--font-sans` の定義元が `<Font>` 注入の `<style>` のみになり、値の競合が消える。
- フォールバック指定は astro.config.mjs の `fallbacks` として維持されている（Phase 1 で移植済み）。

### 検証

Phase 4 の一括検証で行う。

---

## Phase 4: 一括検証（品質ゲート）

> このプロジェクトの品質ゲートは `npm run build` と `npm run check` のみ（test/lint スクリプトは存在しない）。

### 4-1. ビルドと型チェック

```bash
cd /path/to/worktree
rm -rf dist
npm run build && npm run check
```

- 両方ともエラー・warning 0 件で通ること。
- 注意: ビルドには Google へのネットワークアクセスが必要（初回のみ。以降 `.astro/fonts/` キャッシュが効く）。GitHub Actions のデプロイワークフローでも同様にビルド時取得となるが、Actions ランナーは外部ネットワーク可のため追加設定は不要。

### 4-2. 成果物にフォントが同一オリジン配置されていること

```bash
ls dist/_astro/fonts/*.woff2 | wc -l
```

- woff2 が多数（日本語 2 ファミリ×計 5 ウェイトの unicode-range 分割で、数百ファイル規模）存在すること。

```bash
grep -c "/homepage/_astro/fonts/" dist/index.html
```

- 1 以上であること（インライン `<style>` 内の @font-face src が base 込みの同一オリジンパスを指す）。

### 4-3. 外部フォントドメインが完全に消えていること

```bash
grep -rl "fonts.googleapis.com\|fonts.gstatic.com" dist/ ; echo "exit=$?"
```

- 出力なし・`exit=1`（マッチ 0 件）であること。1 件でも残っていたら BaseHead 以外に埋め込みがある兆候なので `grep -rn` で特定して除去する。

### 4-4. 全ウェイトが揃っていること（600 欠落 quirk の確認）

```bash
grep -o "font-weight:[^;]*" dist/index.html | sort | uniq -c
```

- `400` `500` `600` `700` がすべて現れること。**特に 600（Shippori Mincho の見出し用）が存在することを必ず確認**（`subsets` 設定ミス時にここが欠落する）。

### 4-5. ブラウザでの動作確認

```bash
npm run preview   # http://localhost:4321/homepage/
```

DevTools で以下を確認:

1. **Network（Font フィルタ）**: すべて `localhost:4321` オリジン。`fonts.gstatic.com` への通信ゼロ。日本語ページで複数の woff2 分割ファイルが読まれる（unicode-range 分割が機能している証拠）。
2. **Computed スタイル**: 見出し（h1 等）を選択 → Computed → `font-family` の Rendered Fonts が Shippori Mincho 系（ハッシュ付き名）であること。本文は Zen Kaku Gothic New 系。
3. **フォールバック**: DevTools → Network → 「Font をブロック」した状態で再読み込みし、明朝系見出しが Hiragino Mincho ProN で表示されること（フォールバック消失がないことの確認）。

### 4-6. 視覚的同一の確認

- 本番サイト（https://takuyaasaoka.github.io/homepage/）と preview を並べ、トップ / About / Blog 一覧 / 記事詳細 / 404 で見出し・本文の書体、太さ（見出し 600、本文 400、強調 500/700）が同一であることを目視確認する。
- 特に「太さの差」に注目する（ウェイト欠落時はブラウザ合成の faux bold になり、微妙に太く滲む）。

---

## リスク / ロールバック

| リスク | 対処 |
|--------|------|
| ビルド時に Google への取得が失敗（ネットワーク断・レート制限） | `.astro/fonts/` キャッシュがあれば再ビルド可。キャッシュなしで失敗した場合はリトライ。恒常的に問題化するなら `fontProviders.local()` への移行を別 Issue で検討 |
| ウェイト 600 欠落（quirk） | Phase 4-4 の grep で機械的に検出。`subsets: ["latin", "japanese"]` 併記で回避済み |
| head へのインライン `<style>` 肥大（@font-face 数百件で HTML が数十 KB 増える） | gzip 後は軽微。問題視するなら preload/サブセット最適化を別 Issue に切る |
| CSS 変数の定義競合（global.css 消し忘れ） | Phase 3 で削除。`grep -n '"Shippori Mincho"\|"Zen Kaku Gothic New"' src/ -r` が 0 件になることでも確認できる |

**ロールバック**: 3 ファイルの変更のみで完結しているため、`git revert <コミット>` で即座に旧状態（Google Fonts 外部読み込み）へ戻せる。データ移行・依存追加は一切ない。
