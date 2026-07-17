# 「制作/Works」呼称の完全統一 実装計画

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「制作物/Projects/プロジェクト（works概念）」の呼称を、サイト・URL・CMS・コード識別子・コメント・ガイド文書のすべてで canonical（制作 / WORKS / Works / works）に完全統一し、一切の乖離をなくす。

**Architecture:** コード変更は「コレクションのworksリネーム」を中核とする原子的な1タスク（半端な状態はビルドが壊れるため）。CMS設定（config.yml）とガイド文書（coding-standards.md）はビルドに影響しない独立タスク。最後に2段階grep + build + 生成HTMLで「乖離ゼロ」を実証する。

**Tech Stack:** Astro v6（Content Collections / file-based routing）、Sveltia CMS、TypeScript strict

**参照ドキュメント（必読）:**
- 設計書: `docs/records/specs/2026-07-18-91-unify-works-naming-design.md`（canonical・5層・二義性・検証条件の正）
- Issue: https://github.com/TakuyaAsaoka/homepage/issues/91
- コーディング規約: `docs/coding-standards.md`（インデント2スペース、ダブルクォート、日本語コメント、フロントマターはインポート→Props型定義→ロジックの順）

**canonical（正）:** 制作（日本語見出し・項目名）/ WORKS（英字サブラベル）/ Works（ナビ・タイトル・パンくず）/ works（URL・コード識別子・フォルダ）。**全廃**: 制作物・Projects・projects・ProjectCard・project-card・works概念の「プロジェクト」。**残す**: リポジトリ意味の「プロジェクト」（homepageプロジェクト等）と `docs/records/`。

**検証方針:** テスト基盤なし。品質ゲートは `npm run build && npm run check`（0エラー0警告）。加えて設計書の2段階grep・生成HTML確認で乖離ゼロを実証する。

**作業ディレクトリ:** `.claude/worktrees/feature-91`（ブランチ `feature/91-unify-works-naming`）。以下のパスはこのworktreeからの相対パス。

---

## ファイル構成（変更マップ）

| ファイル | 操作 | 責務 |
|---------|------|------|
| `src/content/projects/` → `works/` | git mv（2ファイル） | 制作コンテンツ本体 |
| `src/components/ProjectCard.astro` → `WorkCard.astro` | git mv + 編集 | 一覧カード |
| `src/pages/projects/` → `works/` | git mv（index + [...slug]） | 一覧・詳細ルート（URLを/works/に） |
| `src/content.config.ts` | 編集 | コレクション定義 |
| `src/pages/index.astro` | 編集 | Home（制作抜粋） |
| `src/pages/rss.xml.ts` | 編集 | RSS生成 |
| `src/components/Header.astro` | 編集 | ナビ |
| `src/layouts/BaseLayout.astro` | 編集 | コメント1行 |
| `src/styles/global.css` | 編集 | コメント1行 |
| `public/admin/config.yml` | 編集 | CMS設定（ラベル/フォルダ/ヒント/並び） |
| `docs/coding-standards.md` | 編集 | ガイド文書 |

---

## Task 1: コード全体のworksリネーム（原子的・1コミット）

コレクション名を変えると全消費側が同時に壊れるため、src/配下のworks概念を**まとめて**変更し、末尾で一括検証・コミットする。config.yml と coding-standards.md は後続タスク。

**Files:**
- Rename: `src/content/projects/` → `src/content/works/`（`homepage.md`, `sales-to-invoice.md`）
- Rename: `src/components/ProjectCard.astro` → `src/components/WorkCard.astro`
- Rename: `src/pages/projects/` → `src/pages/works/`（`index.astro`, `[...slug].astro`）
- Modify: `src/content.config.ts`, `src/pages/index.astro`, `src/pages/rss.xml.ts`, `src/components/Header.astro`, `src/layouts/BaseLayout.astro`, `src/styles/global.css`

- [ ] **Step 1: git mv でファイル・ディレクトリを移動**

```bash
git mv src/content/projects src/content/works
git mv src/components/ProjectCard.astro src/components/WorkCard.astro
git mv src/pages/projects src/pages/works
```

- [ ] **Step 2: content.config.ts を編集**

3箇所を変更（`projects` コレクションを `works` に）:

```
const projects = defineCollection({          →  const works = defineCollection({
  base: "./src/content/projects"             →    base: "./src/content/works"
export const collections = { projects, ... } →  export const collections = { works, home, about, settings };
```

- [ ] **Step 3: src/components/WorkCard.astro（移動後）を編集**

```
<article class="project-card">                       →  <article class="work-card">
<a href={`${BASE_PATH}projects/${slug}/`}>{title}</a> →  <a href={`${BASE_PATH}works/${slug}/`}>{title}</a>
.project-card { ... }        （style内3箇所）          →  .work-card
```

`.project-card` はこのファイルのスコープドスタイル内3箇所（`.project-card`, `.project-card h3 a`, `.project-card :global(.tags)`）。すべて `.work-card` に。

- [ ] **Step 4: src/pages/works/index.astro（移動後）を編集**

```
import ProjectCard from "../../components/ProjectCard.astro";  →  import WorkCard from "../../components/WorkCard.astro";
const projects = (await getCollection("projects"))            →  const works = (await getCollection("works"))
<BaseLayout title="Projects" description="アサオカの制作物一覧" breadcrumb={[{ label: "Projects" }]}>
   → <BaseLayout title="Works" description="アサオカの制作一覧" breadcrumb={[{ label: "Works" }]}>
<span class="section-label" aria-hidden="true">PROJECTS</span> →  WORKS
{projects.length > 0 ? (                                       →  {works.length > 0 ? (
  projects.map((project) => (                                  →    works.map((work) => (
    <ProjectCard                                               →      <WorkCard
      title={project.data.title}                               →        title={work.data.title}
      description={project.data.description}                    →        description={work.data.description}
      tags={project.data.tags}                                 →        tags={work.data.tags}
      url={project.data.url}                                   →        url={work.data.url}
      slug={project.id}                                        →        slug={work.id}
<p>公開できる制作物を準備中です。</p>                          →  <p>公開できる制作を準備中です。</p>
```

（`.filter((p) => !p.data.draft)` の `p` は汎用引数なので変更不要）

- [ ] **Step 5: src/pages/works/[...slug].astro（移動後）を編集**

`project` 変数をすべて `work` に、コレクション名・パンくず・ボタン文言を変更:

```
const projects = await getCollection("projects");  →  const works = await getCollection("works");
return projects                                    →  return works
  .map((project) => ({                             →    .map((work) => ({
    params: { slug: project.id },                  →      params: { slug: work.id },
    props: { project },                            →      props: { work },
const { project } = Astro.props;                   →  const { work } = Astro.props;
const { Content } = await render(project);         →  const { Content } = await render(work);
title={project.data.title}                         →  title={work.data.title}
description={project.data.description}              →  description={work.data.description}
{ label: "Projects", href: `${BASE_PATH}projects/` } → { label: "Works", href: `${BASE_PATH}works/` }
{ label: project.data.title },                     →  { label: work.data.title },
datePublished: project.data.pubDate,               →  datePublished: work.data.pubDate,
keywords: project.data.tags,                       →  keywords: work.data.tags,
image: project.data.image,                         →  image: work.data.image,
<h1>{project.data.title}</h1>                      →  <h1>{work.data.title}</h1>
{project.data.pubDate.toISOString()}               →  {work.data.pubDate.toISOString()}
{project.data.pubDate.toLocaleDateString(SITE_LOCALE)} → {work.data.pubDate.toLocaleDateString(SITE_LOCALE)}
<TagList tags={project.data.tags} />               →  <TagList tags={work.data.tags} />
{project.data.url && (                             →  {work.data.url && (
<a href={project.data.url} ...>プロジェクトを見る</a> → <a href={work.data.url} ...>制作を見る</a>
```

- [ ] **Step 6: src/pages/index.astro を編集**

```
// 制作セクションに抜粋する最新プロジェクト（draft除外・pubDate降順の先頭2件） → …最新の制作（…）
const recentProjects = (await getCollection("projects"))       →  const recentWorks = (await getCollection("works"))
{recentProjects.length > 0 ? (                                 →  {recentWorks.length > 0 ? (
{recentProjects.map((project) => (                             →  {recentWorks.map((work) => (
<a class="works-link" href={`${BASE_PATH}projects/${project.id}/`}> → href={`${BASE_PATH}works/${work.id}/`}
<span class="works-title">{project.data.title}</span>          →  {work.data.title}
<span class="works-desc">{project.data.description}</span>     →  {work.data.description}
<p class="works-empty" ...>公開できる制作物を準備中です。</p>  →  公開できる制作を準備中です。
<a class="section-more" href={`${BASE_PATH}projects/`} ...>     →  href={`${BASE_PATH}works/`}
```

（見出しの `制作` / `WORKS`、class名 `works-*` は既に正しいので変更しない）

- [ ] **Step 7: src/pages/rss.xml.ts を編集**

```
// プロジェクトコレクションからRSSフィードを生成する。      →  // 制作コレクションからRSSフィードを生成する。
const projects = (await getCollection("projects"))          →  const works = (await getCollection("works"))
  .filter((project) => !project.data.draft)                 →    .filter((work) => !work.data.draft)
items: projects.map((project) => ({                         →  items: works.map((work) => ({
  title: project.data.title,                                →    title: work.data.title,
  description: project.data.description,                     →    description: work.data.description,
  pubDate: project.data.pubDate,                            →    pubDate: work.data.pubDate,
  link: `projects/${project.id}/`,                          →    link: `works/${work.id}/`,
```

- [ ] **Step 8: src/components/Header.astro を編集**

```
{ label: "Projects", href: `${BASE_PATH}projects/` }, →  { label: "Works", href: `${BASE_PATH}works/` },
```

- [ ] **Step 9: src/layouts/BaseLayout.astro を編集（コメント1行）**

```
// JSON-LD（Article）用の記事情報。プロジェクト詳細ページのみ渡す → // JSON-LD（Article）用の記事情報。制作詳細ページのみ渡す
```

- [ ] **Step 10: src/styles/global.css を編集（コメント1行）**

```
/* ===== Homeページ: 制作（Projects抜粋） ===== */ → /* ===== Homeページ: 制作（WORKS抜粋） ===== */
```

- [ ] **Step 11: src/配下の残存ゼロを確認（コミット前ゲート）**

```bash
grep -rniE "projects|projectcard|project-card|制作物" src
grep -rn "プロジェクト" src
```
Expected: 1つ目は**ヒット0件**。2つ目も**ヒット0件**（src配下にworks概念の「プロジェクト」は残らない。リポジトリ意味の「プロジェクト」はsrc配下には存在しない）。
何か残っていれば該当箇所を修正してから次へ。

- [ ] **Step 12: ビルドと型チェック**

Run: `npm run build && npm run check`
Expected: 両方成功、0 errors / 0 warnings / 0 hints。

- [ ] **Step 13: URL移行の確認**

```bash
ls dist/works/index.html && ls "dist/works/homepage/index.html"
test ! -d dist/projects && echo "OK: dist/projects は生成されていない"
grep -o "/homepage/works/" dist/index.html | head -1
```
Expected: `dist/works/` が生成され、`dist/projects/` は存在しない。Homeのリンクが `/homepage/works/`。

- [ ] **Step 14: コミット**

```bash
git add -A
git commit -m "refactor: 制作/Worksの呼称をコード全体で統一しURLを/works/に変更する (#91)"
```

---

## Task 2: CMS設定（config.yml）の統一と並び替え

**Files:**
- Modify: `public/admin/config.yml`

- [ ] **Step 1: projects コレクションを works に統一**

```
- name: "projects"                                    →  - name: "works"
  label: "制作物"                                      →    label: "制作"
  folder: "src/content/projects"                       →    folder: "src/content/works"
hint: "制作物の名前"                                    →  hint: "制作の名前"
hint: "制作物の公開URL（あれば）"                       →  hint: "制作の公開URL（あれば）"
```

- [ ] **Step 2: コレクションの並びを `ページ → 制作 → サイト設定` に変更**

`collections:` 配下のブロック順を、現在の `works(旧projects) → pages → settings` から **`pages → works → settings`** に並び替える（各コレクションブロックまるごと移動。中身は変更しない）。

- [ ] **Step 3: グループ見出しの検討（YAGNI）**

Sveltia CMS がコレクションのグループ化（サイドバーの見出し仕切り）を**単純な設定キーで**サポートしているか、Sveltia CMS のドキュメント/READMEで確認する。
- 簡単に追加できる場合のみ「コンテンツ」「設定」等の見出しを付与する。
- 非対応・設定が非自明な場合は**並び替えのみとし実装しない**。その旨を報告する（無理に作り込まない）。

- [ ] **Step 4: YAML構文とスキーマ整合の確認**

```bash
node -e "let y;try{y=require('js-yaml');y={parse:y.load}}catch{y=require('yaml')};const d=y.parse(require('fs').readFileSync('public/admin/config.yml','utf8'));console.log(d.collections.map(c=>c.name+':'+c.label));"
```
Expected: 並びが `pages`（ページ）→ `works`（制作）→ `settings`（サイト設定）。`works` の label が「制作」、folder が `src/content/works`。YAMLパースが成功すること。

- [ ] **Step 5: リグレッション確認とコミット**

```bash
npm run build && npm run check
git add public/admin/config.yml
git commit -m "feat: CMSの制作コレクション表記を統一し並びをページ→制作→サイト設定にする (#91)"
```
Expected: build+check 成功（config.ymlはビルド対象外だがリグレッション確認）。

---

## Task 3: ガイド文書（coding-standards.md）の統一

**Files:**
- Modify: `docs/coding-standards.md`

- [ ] **Step 1: works概念の参照を works 系に更新**

設計書 `docs/records/specs/2026-07-18-91-unify-works-naming-design.md` の「層5」テーブルの全行を適用する。まとめ行（`:270-278, :298, :348, :362-363, :418-419`）は**1箇所ずつ**潰すこと。具体的には以下を置換:

| 現在 | 統一後 |
|------|--------|
| `ProjectCard.astro`（全出現） | `WorkCard.astro` |
| `projects/`（ツリー・命名例のディレクトリ） | `works/` |
| `# プロジェクト記事（Markdown）` | `# 制作記事（Markdown）` |
| `sample-project.md` | `sample-work.md` |
| `PageType = ... | "projects"` | `... | "works"` |
| `ProjectEntry`（型名例） | `WorkEntry` |
| `getPublishedProjects` | `getPublishedWorks` |
| `getCollection("projects")`（全コード例） | `getCollection("works")` |
| コード例中の `projects` / `project` 変数 | `works` / `work` |
| フロントマター例 `title: プロジェクト名` / `description: プロジェクトの概要` | `title: 制作名` / `description: 制作の概要` |
| CSSクラス例 `` `project-card` `` | `` `work-card` `` |

**変更しない（リポジトリ意味）**: `homepage プロジェクトの…`（冒頭）、目次・見出しの `プロジェクト構成`、`プロジェクトルート`。

- [ ] **Step 2: 残存確認（文言ベース）**

```bash
grep -niE "projects|projectcard|project-card|制作物" docs/coding-standards.md
grep -n "プロジェクト" docs/coding-standards.md
```
Expected: 1つ目は**0件**。2つ目は**リポジトリ意味の行のみ**（冒頭の「homepage プロジェクト」、目次「プロジェクト構成」、「プロジェクトルート」、見出し「## 2. プロジェクト構成」）。works概念（プロジェクト記事/名/概要）が残っていないこと。

- [ ] **Step 3: コミット**

```bash
git add docs/coding-standards.md
git commit -m "docs: コーディング規約のprojects例をworksに統一する (#91)"
```

---

## Task 4: 総合検証

**Files:** なし（検証のみ）

- [ ] **Step 1: 2段階grepで乖離ゼロを実証（設計書の検証条件）**

```bash
grep -rniE "projects|projectcard|project-card|制作物" src public docs/coding-standards.md
grep -rn "プロジェクト" src public docs/coding-standards.md
```
Expected:
- 1つ目: **0件**。
- 2つ目: `docs/coding-standards.md` のリポジトリ意味の行（冒頭・目次・プロジェクトルート・## 2.）**のみ**。`src/`・`public/` は0件。works概念の「プロジェクト◯◯」が1つも無いこと。

- [ ] **Step 2: クリーンビルドと型チェック**

Run: `rm -rf dist && npm run build && npm run check`
Expected: 両方成功、0 errors / 0 warnings / 0 hints。

- [ ] **Step 3: URL・サブラベル・RSSの生成物確認**

```bash
test -d dist/works && test ! -d dist/projects && echo "URL: /works/ に統一 OK"
grep -o "WORKS" dist/index.html | head -1        # Home サブラベル
grep -o "WORKS" dist/works/index.html | head -1  # 一覧 サブラベル（旧PROJECTS）
grep -o "works/homepage/" dist/rss.xml | head -1 # RSS item link
node -e "const h=require('fs').readFileSync('dist/works/homepage/index.html','utf8');console.log('制作を見る:', h.includes('制作を見る'));"
```
Expected: `dist/works/` 生成・`dist/projects/` 非存在、Home・一覧ともに `WORKS`、RSS link が `works/...`、詳細ページのボタンが「制作を見る」。

- [ ] **Step 4: 既存コンテンツのslug維持確認**

```bash
ls dist/works/homepage/index.html dist/works/sales-to-invoice/index.html
```
Expected: 既存2件（homepage / sales-to-invoice）のslugが維持され、`/works/<slug>/` で生成されている。

- [ ] **Step 5: CMS並び順の最終確認**

`public/admin/config.yml` のコレクション順が `pages → works → settings`、`works` の label が「制作」であることを目視確認。

- [ ] **Step 6: 最新mainの取り込み**

Run: `git fetch origin main && git merge origin/main`
Expected: コンフリクトなし（あれば解消してビルド・型チェック・Step 1のgrepを再実行）。

---

## 完了後

superpowers:finishing-a-development-branch スキルに従いPR作成へ進む（PR本文にIssue #91と設計書・本計画へのリンクを含める）。マージ後は `~/.claude/CLAUDE.md` のWorktreeクリーンアップ手順を実行する。
