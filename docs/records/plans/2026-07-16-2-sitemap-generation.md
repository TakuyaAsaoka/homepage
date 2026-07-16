# サイトマップ自動生成 実装プラン

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ビルド時に `@astrojs/sitemap` でサイトマップ（`sitemap-index.xml`）を自動生成する（Issue #2）。

**Architecture:** `@astrojs/sitemap` 公式インテグレーションを `astro.config.mjs` に追加するだけの構成。サイトマップはビルド済みルートから生成されるため、draftページ（`getStaticPaths` で除外済み・ビルドされない）は自動的にサイトマップからも除外される。robots.txtはスコープ外（specの「スコープ外」節を参照）。

**Tech Stack:** Astro v6 / @astrojs/sitemap / npm

**Spec:** `docs/records/specs/2026-07-16-2-sitemap-generation-design.md`

**前提:**
- 作業ディレクトリ: `.claude/worktrees/feature-2-sitemap`（ブランチ `feature/2-sitemap`）
- このプロジェクトにはテストフレームワークがない。検証は「ビルド出力の目視確認 + `npm run check`」で行う
- 現在 `draft: true` のプロジェクトは存在しない（`src/content/projects/` は `homepage.md` と `sales-to-invoice.md` の2件のみ）。draft除外の検証には一時フィクスチャを使う

---

### Task 1: @astrojs/sitemap の導入

**Files:**
- Modify: `astro.config.mjs`
- Modify: `package.json`, `package-lock.json`（npm installによる）

- [ ] **Step 1: パッケージをインストール**

```bash
npm install @astrojs/sitemap
```

Expected: `package.json` の `dependencies` に `@astrojs/sitemap` が追加される

- [ ] **Step 2: astro.config.mjs にインテグレーションを追加**

`astro.config.mjs` 全体を以下の内容にする:

```javascript
import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://TakuyaAsaoka.github.io",
  base: "/homepage",
  integrations: [sitemap()],
});
```

- [ ] **Step 3: ビルドしてサイトマップ生成を確認**

```bash
npm run build && ls dist/sitemap-index.xml dist/sitemap-0.xml
```

Expected: ビルド成功。両ファイルが存在する

- [ ] **Step 4: コミット**

```bash
git add astro.config.mjs package.json package-lock.json
git commit -m "feat: @astrojs/sitemapでサイトマップを自動生成する (#2)"
```

---

### Task 2: サイトマップ内容の検証

**Files:**
- （検証のみ。404が含まれていた場合のみ `astro.config.mjs` を修正）
- 一時作成→削除: `src/content/projects/draft-fixture.md`

- [ ] **Step 1: 全公開ページのURLが含まれることを確認**

```bash
cat dist/sitemap-0.xml
```

Expected: 以下6URLがすべて含まれる:
- `https://TakuyaAsaoka.github.io/homepage/`
- `https://TakuyaAsaoka.github.io/homepage/about/`
- `https://TakuyaAsaoka.github.io/homepage/blog/`
- `https://TakuyaAsaoka.github.io/homepage/projects/`
- `https://TakuyaAsaoka.github.io/homepage/projects/homepage/`
- `https://TakuyaAsaoka.github.io/homepage/projects/sales-to-invoice/`

- [ ] **Step 2: 404ページが含まれないことを確認（check-then-decide）**

```bash
grep -c "404" dist/sitemap-0.xml || echo "404なし: OK"
```

Expected: `404なし: OK`（近年の `@astrojs/sitemap` は404ルートをデフォルト除外するため、これが本命の結果）

**もし404が含まれていた場合のみ**、`astro.config.mjs` の `sitemap()` を以下に変更して再ビルドし、除外を確認してから追加コミットする:

```javascript
sitemap({
  filter: (page) => !page.includes("/404"),
}),
```

- [ ] **Step 3: draft除外を一時フィクスチャで検証**

`src/content/projects/draft-fixture.md` を作成:

```markdown
---
title: "draft検証用フィクスチャ"
description: "サイトマップからの除外を検証するための一時ファイル"
pubDate: 2026-07-16
draft: true
---

検証用。コミットしないこと。
```

```bash
npm run build && grep -c "draft-fixture" dist/sitemap-0.xml || echo "draft除外: OK"
```

Expected: `draft除外: OK`（`draft-fixture` がサイトマップに含まれない）

> Note: フィクスチャのフロントマターが `src/content.config.ts` のスキーマでエラーになる場合は、スキーマの必須フィールドに合わせて修正する。

- [ ] **Step 4: フィクスチャを削除して再ビルド**

```bash
rm src/content/projects/draft-fixture.md && npm run build
```

Expected: ビルド成功。`git status` でフィクスチャが残っていないこと

- [ ] **Step 5: 型チェック**

```bash
npm run check
```

Expected: エラー0件・警告0件

---

### Task 3: 最終検証とPR作成

- [ ] **Step 1: 最新mainを取り込む**

```bash
git fetch origin main && git merge origin/main
```

Expected: コンフリクトなし（あれば解消する）

- [ ] **Step 2: クリーン状態で最終検証**

`package.json` / `package-lock.json` に変更があるため、クリーンインストールで検証する:

```bash
rm -rf node_modules && npm ci && npm run build && npm run check
```

Expected: すべて成功。エラー・警告0件

- [ ] **Step 3: PRを作成**

```bash
git push -u origin feature/2-sitemap
gh pr create --title "feat: サイトマップを自動生成する (#2)" --body "..."
```

PR本文には以下を含める:
- Issue #2への参照（`Closes #2`）
- robots.txtをスコープ外とした理由（specへのリンク）と代替運用（Search Console直接登録）
- 検証結果（サイトマップ内容、draft除外確認）
