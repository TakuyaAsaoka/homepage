# ヒーロー full-bleed 構造再設計 実装プラン（Issue #67）

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Home ヒーローの `100vw` full-bleed ハックを撤去し、クラシックスクロールバー環境での約7.5pxの左ズレを構造的に解消する。

**Architecture:** `main` を全幅化して名前付きスロット `hero` を受け、本文の幅制限（max-width + padding）は新設の `.main-inner` に移す。ヒーロー幅 = main 幅 = body 幅（スクロールバー除外）となり、`100vw` 由来のズレが原理的に発生しなくなる。相互依存していたハック4点（`100vw` / `margin-inline` 補正 / `margin-top: -1rem` / `overflow-x: clip`）をすべて削除する。

**Tech Stack:** Astro v6（名前付きスロット）、素の CSS（`src/styles/global.css`）。テストフレームワークは無く、検証は `npm run build` / `npm run check` / ビルド出力検査 / ブラウザ実測（chrome-devtools）。

**Spec:** `docs/records/specs/2026-07-16-67-hero-fullbleed-restructure-design.md`

**作業ディレクトリ:** worktree `.claude/worktrees/fix-67`（ブランチ `fix/67-hero-scrollbar-shift`）。以下のパスはすべて worktree ルートからの相対パス。

---

### Task 1: レイアウト構造の変更（hero スロット + main-inner + ハック撤去）

このタスクで機能変更が完結する。中間状態を作らないよう、4ファイルの編集を1コミットにまとめる。

**Files:**
- Modify: `src/layouts/BaseLayout.astro:53-55`
- Modify: `src/styles/global.css:100-117, 132-139`
- Modify: `src/pages/index.astro:27-38`

- [x] **Step 1: BaseLayout に hero スロットと main-inner を追加**

`src/layouts/BaseLayout.astro` の `<main>` ブロック（53-55行）を置き換える:

```astro
<!-- 変更前 -->
    <main>
      <slot />
    </main>
```

```astro
<!-- 変更後 -->
    <main>
      <slot name="hero" />
      <div class="main-inner">
        <slot />
      </div>
    </main>
```

hero スロットが空のページでは Astro は何も出力しないため、他ページの DOM 変化は `.main-inner` の1階層追加のみ。

- [x] **Step 2: global.css — main の幅制限を main-inner に移設**

`src/styles/global.css:100-106` を置き換える:

```css
/* 変更前 */
main {
  flex: 1;
  width: 100%;
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 1rem var(--content-pad);
}
```

```css
/* 変更後 */
/* main は全幅のままヒーロー（hero スロット）を受け、本文の幅制限は main-inner が担う */
main {
  flex: 1;
  width: 100%;
}

.main-inner {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: 1rem var(--content-pad);
}
```

- [x] **Step 3: global.css — overflow-x: clip ブロックを削除**

`src/styles/global.css:113-117`（Step 2 適用後は行番号がずれるため内容で特定）を、コメントごと削除する:

```css
/* 削除対象 */
/* full-bleed（100vw）のヒーローが生む横溢れを防ぐ */
html,
body {
  overflow-x: clip;
}
```

存在理由（100vw の横溢れ防止）が消滅するため。`100vw` の使用箇所が他に無いことは spec で確認済み。

- [x] **Step 4: global.css — .home-hero ルールを削除し、.hero-inner のコメントを更新**

`.home-hero` ルール（元133-137行）を削除する。直前のセクションコメント `/* ===== Homeページ: ヒーロー ===== */` は残す:

```css
/* 削除対象 */
.home-hero {
  width: 100vw;
  margin-inline: calc(50% - 50vw);
  margin-top: -1rem; /* main の上パディングを打ち消しヘッダー直下に密着 */
}
```

続けて `.hero-inner` の直前コメント（元138-139行）の旧構造前提の表現を更新する:

```css
/* 変更前 */
/* ヒーロー内テキストを本文と同じコンテナに載せ、左端ラインを全ページで揃える
   （背景・季節演出は full-bleed のまま） */
```

```css
/* 変更後 */
/* ヒーロー内テキストを本文（main-inner）と同じ幅制限に載せ、左端ラインを全ページで揃える
   （背景・季節演出は main の全幅に広がる） */
```

- [x] **Step 5: index.astro — .home-hero ラッパーを削除し slot="hero" で渡す**

`src/pages/index.astro:27-38` を置き換える。ラッパー div を外し、`SeasonalHero` に `slot="hero"` を直付けする（コンポーネントへの `slot` 属性直付けは Astro で有効）:

```astro
<!-- 変更前 -->
  <div class="home-hero">
    <SeasonalHero season="auto" height="70vh">
      <div class="hero-inner">
        <div class="hero-content">
          <p class="hero-role">SOFTWARE ENGINEER / SRE</p>
          <h1 class="hero-name">{SITE_AUTHOR}</h1>
          <span class="hero-rule" aria-hidden="true"></span>
          <p class="hero-copy">つくることと、動かし続けること。</p>
        </div>
      </div>
    </SeasonalHero>
  </div>
```

```astro
<!-- 変更後 -->
  <SeasonalHero slot="hero" season="auto" height="70vh">
    <div class="hero-inner">
      <div class="hero-content">
        <p class="hero-role">SOFTWARE ENGINEER / SRE</p>
        <h1 class="hero-name">{SITE_AUTHOR}</h1>
        <span class="hero-rule" aria-hidden="true"></span>
        <p class="hero-copy">つくることと、動かし続けること。</p>
      </div>
    </div>
  </SeasonalHero>
```

- [x] **Step 6: ビルドと型チェックで壊れていないことを確認**

Run: `npm run build && npm run check`
Expected: build が `Complete!`、check が `0 errors, 0 warnings, 0 hints` で終了

- [x] **Step 7: コミット**

```bash
git add src/layouts/BaseLayout.astro src/styles/global.css src/pages/index.astro
git commit -m "fix: ヒーローのfull-bleedハックを撤去しmain-inner構造に再編する (#67)"
```

---

### Task 2: 余白補正とコメントの整合性維持

見た目を変えないための余白補正と、旧構造を参照するコメントの更新。挙動に影響しない変更なので Task 1 と分けてコミットする。

**Files:**
- Modify: `src/styles/global.css`（`.home-intro` と `--content-pad` のコメント）
- Modify: `src/components/Header.astro:65`
- Modify: `src/components/Footer.astro:36`

- [x] **Step 1: .home-intro の上マージンを補正**

`src/styles/global.css` の `.home-intro`（元265行）。`.main-inner` の `padding-top: 1rem` が間に入るため、上マージンを 1rem 減らして合計 3.5rem を維持する（padding があるためマージン相殺は起きない）:

```css
/* 変更前 */
.home-intro {
  margin-block: 3.5rem 5rem;
```

```css
/* 変更後 */
.home-intro {
  /* main-inner の padding-top 1rem と合わせ、ヒーロー下端から 3.5rem の間隔を維持する */
  margin-block: 2.5rem 5rem;
```

- [x] **Step 2: --content-pad のコメントを main-inner 基準に更新**

`src/styles/global.css:4-5`:

```css
/* 変更前 */
  /* コンテンツの左右パディング。Header / main / ヒーロー内テキスト / Footer で共用し、
     全ページの左端ラインを一直線に揃える */
```

```css
/* 変更後 */
  /* コンテンツの左右パディング。Header / main-inner / ヒーロー内テキスト / Footer で共用し、
     全ページの左端ラインを一直線に揃える */
```

- [x] **Step 3: Header / Footer のコメントを main-inner 基準に更新**

`src/components/Header.astro:65` と `src/components/Footer.astro:36` の同一コメント（2箇所）:

```css
/* 変更前 */
  /* main / hero-inner と同一構造（max-width＋内側padding）にして左端ラインを揃える */
```

```css
/* 変更後 */
  /* main-inner / hero-inner と同一構造（max-width＋内側padding）にして左端ラインを揃える */
```

- [x] **Step 4: ビルドと型チェック**

Run: `npm run build && npm run check`
Expected: build が `Complete!`、check が `0 errors, 0 warnings, 0 hints` で終了

- [x] **Step 5: コミット**

```bash
git add src/styles/global.css src/components/Header.astro src/components/Footer.astro
git commit -m "fix: ヒーロー下余白の補正と旧構造コメントの更新 (#67)"
```

---

### Task 3: ビルド出力の検証

**Files:** なし（検証のみ）

- [x] **Step 1: 100vw と overflow-x: clip が残っていないことを確認**

Run: `grep -rn "100vw\|overflow-x" src/ | grep -v "node_modules"`
Expected: ヒット 0 件

- [x] **Step 2: dist の構造を確認**

Run: `npm run build && grep -c "main-inner" dist/index.html && grep -o '<main[^>]*>' dist/index.html`
Expected: `main-inner` が 1 件以上、`<main>` タグが存在

`dist/index.html` で以下の構造になっていることを目視確認する:
- `<main>` の直下に `data-seasonal-hero` の div（ヒーロー）があり、その後に `<div class="main-inner">` が続く
- ヒーローが `.main-inner` の**外**にある

Run: `grep -o 'class="main-inner"' dist/about/index.html`
Expected: 下層ページにも `main-inner` が存在（本文が包まれている）

---

### Task 4: ブラウザ実測検証

**Files:** なし（検証のみ）

chrome-devtools MCP を使用する。`npm run preview` でビルド結果を配信し（`http://localhost:4321/homepage/`）、以下を確認する。

- [x] **Step 1: preview サーバーを起動**

Run: `npm run preview`（バックグラウンド実行）

- [x] **Step 2: Home の左端整列を実測（狭い幅）**

ビューポートを幅 485px 程度にリサイズし、`evaluate_script` で以下を比較:
- `.hero-name`（ヒーローテキスト）の `getBoundingClientRect().left`
- `.home-intro`（本文）の `getBoundingClientRect().left`
Expected: 両者が一致する

- [x] **Step 3: Home の左端整列を実測（広い幅）**

ビューポートを幅 1200px にリサイズし、Step 2 と同じ比較 + Header `.nav-title` / Footer 内テキストの left も比較。
Expected: すべて一致する

- [x] **Step 4: ヒーロー上端の密着と下余白を確認**

`evaluate_script` で確認:
- `[data-seasonal-hero]` の `getBoundingClientRect().top` が `header` の `bottom` と一致（ヘッダー直下に密着。旧 `-1rem` の代替が効いている）
- `.home-intro` の `top` − ヒーローの `bottom` ≒ 3.5rem（56px。フォントサイズ16px前提）

- [x] **Step 5: 下層ページのリグレッション確認**

`/homepage/about/`・`/homepage/blog/`・`/homepage/projects/`・存在しないURL（404）を開き、以下を確認:
- 表示崩れが無い（スクリーンショット）
- 本文左端が Header / Footer と揃っている
- 404 ページで footer が従来どおり最下部に押し下げられている（`main` の `flex: 1` が効いている）

- [x] **Step 6: アニメーション・遷移のリグレッション確認**

- Home で SeasonalHero の粒子（または波紋）が描画される
- nav リンクでページ遷移し、View Transitions が正常（コンソールエラー 0 件）
- スクロールで `[data-reveal]` 要素がフェードインする

- [x] **Step 7: preview サーバーを停止**

---

### Task 5: 最終検証とプランのコミット

- [x] **Step 1: クリーン状態で全検証コマンドを実行**

Run: `npm run build && npm run check`
Expected: エラー・warning ともに 0 件

- [x] **Step 2: プラン・spec の checkbox を更新してコミット**

```bash
git add docs/records/plans/2026-07-16-67-hero-fullbleed-restructure.md
git commit -m "docs: 実装プランを追加 (#67)"
```

以降は開発プロセスに従い、コードレビュー（superpowers:requesting-code-review）→ main 取り込み → PR 作成へ進む。
