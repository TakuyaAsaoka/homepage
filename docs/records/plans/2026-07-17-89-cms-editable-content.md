# サイト文言のCMS管理化 実装計画

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Home・About・サイト設定の文言をYAMLデータファイルに切り出し、Sveltia CMS管理画面から編集できるようにする。

**Architecture:** コードに埋め込まれた文言を `src/content/pages/*.yaml`・`src/content/settings/site.yaml` に移し、Astroコンテンツコレクション（glob loader + zodスキーマ）で型安全に読み込む。Sveltia CMSにはファイルコレクション「ページ」「サイト設定」を追加し、全フィールドに日本語ラベルと入力ヒントを付与する。

**Tech Stack:** Astro v6（Content Collections / glob loader）、zod（`astro/zod`、v4 API）、Sveltia CMS、TypeScript strict

**参照ドキュメント:**
- 設計書: `docs/records/specs/2026-07-17-89-cms-editable-content-design.md`（承認済み・必読）
- Issue: https://github.com/TakuyaAsaoka/homepage/issues/89
- コーディング規約: `docs/coding-standards.md`（インデント2スペース、ダブルクォート、コメントは日本語、フロントマターはインポート→Props型定義→ロジックの順）

**検証方針:** このリポジトリにテスト基盤（vitest等）はない。品質ゲートは `npm run build && npm run check` の全パス。zodスキーマの検証は「不正値を一時的に入れてビルドが失敗することを確認し、元に戻す」手順で行う。

**作業ディレクトリ:** `.claude/worktrees/feature-89`（ブランチ `feature/89-cms-editable-content`）。以下のパスはすべてこのworktreeからの相対パス。

---

### Task 1: コンテンツコレクション定義とYAMLデータファイルの作成

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/content/pages/home.yaml`
- Create: `src/content/pages/about.yaml`
- Create: `src/content/settings/site.yaml`

- [ ] **Step 1: content.config.ts に home / about / settings コレクションを追加**

ファイル全体を以下の内容にする（既存の `projects` はそのまま残す）:

```typescript
import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    url: z.url().optional(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

// SNSリンク等は空文字で「使わない」を表すため、URL形式か空文字のみ許可する
const emptyableUrl = z.union([z.url(), z.literal("")]);

// Homeページの文言（CMS管理）。表示名はサイト設定の author を使うためここには持たない
const home = defineCollection({
  loader: glob({ pattern: "home.yaml", base: "./src/content/pages" }),
  schema: z.object({
    hero: z.object({
      role: z.string(),
      tagline: z.string(),
    }),
    intro: z.object({
      text: z.string(),
      linkLabel: z.string(),
    }),
    skills: z.array(z.string()),
  }),
});

// Aboutページの文言（CMS管理）。セクションは追加・削除・並び替え可能
const about = defineCollection({
  loader: glob({ pattern: "about.yaml", base: "./src/content/pages" }),
  schema: z.object({
    lead: z.string(),
    sections: z.array(
      z.object({
        title: z.string(),
        label: z.string(),
        body: z.string(),
      }),
    ),
  }),
});

// サイト全体の設定（CMS管理）。技術的な定数は src/consts.ts に残す
const settings = defineCollection({
  loader: glob({ pattern: "site.yaml", base: "./src/content/settings" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    copyrightHolder: z.string(),
    email: z.email(),
    social: z.object({
      github: emptyableUrl,
      twitter: emptyableUrl,
      youtube: emptyableUrl,
    }),
    noteRssUrl: emptyableUrl,
  }),
});

export const collections = { projects, home, about, settings };
```

> **Note:** HomeとAboutはスキーマが異なるため、1つの `pages` コレクションにunion型で同居させず、コレクションを分割して `getEntry()` の戻り値の型を厳密に保つ（設計書参照）。

- [ ] **Step 2: src/content/pages/home.yaml を作成**

現在 `src/pages/index.astro` にハードコードされている文言をそのまま移す:

```yaml
hero:
  role: SOFTWARE ENGINEER / SRE
  tagline: つくることと、動かし続けること。
intro:
  text: 自動車業界で、つくって動かし続ける仕事をしています。
  linkLabel: わたしについて
skills:
  - TypeScript
  - React
  - Node.js
  - AWS
  - Kubernetes
  - Terraform
  - Grafana
  - Prometheus
```

- [ ] **Step 3: src/content/pages/about.yaml を作成**

現在 `src/pages/about.astro` にハードコードされている文言をそのまま移す。「仕事の外では」は2段落あるため、空行で区切る:

```yaml
lead: ソフトウェアエンジニア / SRE。自動車業界で、基幹システムのクラウド構築と業務アプリの内製開発に携わっています。
sections:
  - title: 歩み
    label: CAREER
    body: ローコードツールによる業務のデジタル化からキャリアを始め、社内のリスキリングを機に内製のソフトウェアエンジニアへ。販売店向けアプリの開発を経験したのち、SREとして信頼性と運用の世界に踏み込みました。現在は基幹システムのクラウド構築をベンダーと協業しながら、社内システムの開発にも携わっています。
  - title: 得意なこと
    label: STRENGTHS
    body: 「現場の言葉」と「エンジニアの言葉」の両方を話すこと。非エンジニアとして業務改善から始めたからこそ、現場の困りごとを要件に翻訳し、動くものにして届けるまでを一気通貫でやれるのが強みです。
  - title: 大事にしていること
    label: VALUES
    body: いきなり大きなものをつくろうとはしません。まず小さく始めて、実際に使ってもらいながら、少しずつ育てていく。ほんとうに必要なものは、ユーザーと一緒に手を動かす中でしか見えてこないと思うからです。
  - title: 仕事の外では
    label: OFF WORK
    body: |-
      仕事を離れれば、一番は家族との時間です。子どもが日々できることを増やしていく、その成長をそばで見られることが、何よりの喜びです。

      ときどきは海へ出て、釣り糸を垂れる時間も大切にしています。
```

- [ ] **Step 4: src/content/settings/site.yaml を作成**

現在の `src/consts.ts` の値をそのまま移す:

```yaml
title: ASAOKA Homepage
description: アサオカのホームページ
author: アサオカ
copyrightHolder: ASAOKA
email: asaoka.biz@gmail.com
social:
  github: https://github.com/TakuyaAsaoka
  twitter: ""
  youtube: ""
noteRssUrl: https://note.com/limber_iguana638/rss
```

- [ ] **Step 5: ビルドと型チェックが通ることを確認**

Run: `npm run build && npm run check`
Expected: 両方成功（コレクションは定義済みだが未使用の状態。エラー・warningが0件であること）

- [ ] **Step 6: zod検証が効くことを確認（不正値テスト）**

`src/content/settings/site.yaml` の `email` を一時的に `not-an-email` に変更して `npm run build` を実行。
Expected: **ビルドが失敗**し、エラーメッセージに `email` フィールドの形式違反が表示される。
確認後、必ず `asaoka.biz@gmail.com` に戻し、`npm run build` が成功することを再確認する。

- [ ] **Step 7: コミット**

```bash
git add src/content.config.ts src/content/pages/ src/content/settings/
git commit -m "feat: Home・About・サイト設定のコンテンツコレクションを定義する (#89)"
```

---

### Task 2: サイト設定取得ヘルパーの作成

**Files:**
- Create: `src/site-settings.ts`

- [ ] **Step 1: src/site-settings.ts を作成**

サイト設定は6ファイル以上から参照されるため、取得と存在チェックを単一のヘルパーに集約する:

```typescript
import { getEntry } from "astro:content";

// サイト設定（CMS管理）を取得する。取得点をここに集約し、
// ファイル欠落時はビルドを失敗させて設定漏れを早期に検知する
export async function getSiteSettings() {
  const entry = await getEntry("settings", "site");
  if (!entry) {
    throw new Error("サイト設定（src/content/settings/site.yaml）が見つかりません");
  }
  return entry.data;
}
```

- [ ] **Step 2: 型チェックが通ることを確認**

Run: `npm run check`
Expected: 成功（`as` キャストなし・戻り値の型はzodスキーマから推論される）

- [ ] **Step 3: コミット**

```bash
git add src/site-settings.ts
git commit -m "feat: サイト設定取得ヘルパーを追加する (#89)"
```

---

### Task 3: 共通コンポーネント4つをサイト設定へ置換

**Files:**
- Modify: `src/components/Header.astro:1-20`（フロントマターと nav-title）
- Modify: `src/components/Footer.astro:1-14`（フロントマターと copyright）
- Modify: `src/components/BaseHead.astro`（フロントマターと SITE_TITLE 参照箇所）
- Modify: `src/components/StructuredData.astro:1-77`（フロントマター内の SITE_TITLE / SITE_AUTHOR）

この段階では `consts.ts` の定数は削除しない（他ファイルがまだ参照しているため）。各ファイルの参照だけを差し替える。

- [ ] **Step 1: Header.astro を置換**

フロントマター冒頭を以下に変更（`SITE_TITLE` のimportを外し、ヘルパーを追加）:

```astro
---
import { BASE_PATH } from "../consts";
import { getSiteSettings } from "../site-settings";

const site = await getSiteSettings();

const navItems = [
```

テンプレートの `{SITE_TITLE}` を `{site.title}` に変更:

```astro
    <a href={BASE_PATH} class="nav-title">{site.title}</a>
```

- [ ] **Step 2: Footer.astro を置換**

フロントマターを以下に変更:

```astro
---
import { getSiteSettings } from "../site-settings";

const site = await getSiteSettings();

// 表示順のSNSリンク定義（空文字のリンクは非表示にする）
const activeLinks = [
  { label: "GitHub", url: site.social.github },
  { label: "X", url: site.social.twitter },
  { label: "YouTube", url: site.social.youtube },
].filter((item) => item.url);
---
```

テンプレートの `{COPYRIGHT_HOLDER}` を `{site.copyrightHolder}` に変更。

- [ ] **Step 3: BaseHead.astro を置換**

import行を以下に変更:

```astro
import { SITE_LANG, BASE_PATH, DEFAULT_OG_IMAGE } from "../consts";
import { getSiteSettings } from "../site-settings";
```

Props取得の後に追加:

```astro
const site = await getSiteSettings();
```

テンプレート内の `SITE_TITLE` 参照（6箇所: RSSリンクの `title`、`<title>`、`meta name="title"`、`og:title`、`og:site_name`、`twitter:title`）をすべて `site.title` に変更。例:

```astro
<title>{title} | {site.title}</title>
<meta name="title" content={`${title} | ${site.title}`} />
```

- [ ] **Step 4: StructuredData.astro を置換**

import行を以下に変更:

```astro
import { BASE_PATH } from "../consts";
import { getSiteSettings } from "../site-settings";
```

`const { title, description, breadcrumb, article } = Astro.props;` の直後に追加:

```astro
const site = await getSiteSettings();
```

WebSiteノードの `name: SITE_TITLE` を `name: site.title` に、Articleノードの `name: SITE_AUTHOR` を `name: site.author` に変更。

- [ ] **Step 5: ビルドと型チェックが通ることを確認**

Run: `npm run build && npm run check`
Expected: 両方成功

- [ ] **Step 6: コミット**

```bash
git add src/components/Header.astro src/components/Footer.astro src/components/BaseHead.astro src/components/StructuredData.astro
git commit -m "feat: 共通コンポーネントの文言をサイト設定から取得する (#89)"
```

---

### Task 4: rss.xml.ts と blog.astro をサイト設定へ置換

**Files:**
- Modify: `src/pages/rss.xml.ts:4,22-24`
- Modify: `src/pages/blog.astro:1-37,56`

- [ ] **Step 1: rss.xml.ts を置換**

import行を以下に変更:

```typescript
import { BASE_PATH } from "../consts";
import { getSiteSettings } from "../site-settings";
```

`GET` 関数の先頭（`const projects = ...` の前）に追加:

```typescript
  const site = await getSiteSettings();
```

`rss()` の引数を変更:

```typescript
  return rss({
    title: site.title,
    description: site.description,
```

- [ ] **Step 2: blog.astro を置換**

フロントマターを以下に変更（`NOTE_RSS_URL` を `site.noteRssUrl` に差し替え。ロジックは現状維持）:

```astro
---
import Parser from "rss-parser";
import BaseLayout from "../layouts/BaseLayout.astro";
import { SITE_LOCALE } from "../consts";
import { getSiteSettings } from "../site-settings";

const site = await getSiteSettings();

// note のプロフィールURL（RSS取得失敗時の代替導線に使う）
const noteProfileUrl = site.noteRssUrl.replace(/\/rss\/?$/, "");

let feedItems: { title: string; link: string; pubDate: string }[] = [];
let fetchFailed = false;

if (site.noteRssUrl) {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(site.noteRssUrl);
    feedItems = (feed.items ?? []).map((item) => ({
      title: item.title ?? "",
      link: item.link ?? "",
      pubDate: item.pubDate ?? "",
    }));
  } catch (error) {
    fetchFailed = true;
    if (error instanceof Error) {
      console.error("RSSフィード取得エラー:", error.message);
    }
  }
}
---
```

テンプレート内の未設定時メッセージを、CMS運用に合わせて変更（`NOTE_RSS_URL === ""` → `site.noteRssUrl === ""`）:

```astro
    {site.noteRssUrl === "" && (
      <p>サイト設定の「note RSS URL」を設定すると記事が表示されます。</p>
    )}
```

末尾の分岐 `NOTE_RSS_URL !== ""` も `site.noteRssUrl !== ""` に変更。

- [ ] **Step 3: ビルドと型チェックが通ることを確認**

Run: `npm run build && npm run check`
Expected: 両方成功。ビルドログにRSS取得エラーが出ていないこと（note連携の動作確認を兼ねる）

- [ ] **Step 4: コミット**

```bash
git add src/pages/rss.xml.ts src/pages/blog.astro
git commit -m "feat: RSSフィードとブログページの設定値をサイト設定から取得する (#89)"
```

---

### Task 5: Home（index.astro）を home.yaml + サイト設定へ置換

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: フロントマターを置換**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import SeasonalHero from "../components/SeasonalHero.astro";
import { getCollection, getEntry } from "astro:content";
import { BASE_PATH } from "../consts";
import { getSiteSettings } from "../site-settings";

// CMS管理のHome文言とサイト設定を取得する
const homeEntry = await getEntry("home", "home");
if (!homeEntry) {
  throw new Error("Home文言（src/content/pages/home.yaml）が見つかりません");
}
const home = homeEntry.data;
const site = await getSiteSettings();

// GitHubリンクの表示テキストはURLから導出する（URLだけ変更されて表示が古く残ることを防ぐ）
const githubLabel = site.social.github.replace(/^https?:\/\//, "");

// 制作セクションに抜粋する最新プロジェクト（draft除外・pubDate降順の先頭2件）
const recentProjects = (await getCollection("projects"))
  .filter((p) => !p.data.draft)
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
  .slice(0, 2);
---
```

- [ ] **Step 2: テンプレートの文言参照を置換**

以下の5箇所を変更する（それ以外の構造・class・data-reveal属性は一切変えない）:

1. `<BaseLayout title="Home" description={SITE_DESCRIPTION}>` → `<BaseLayout title="Home" description={site.description}>`
2. ヒーロー:

```astro
        <p class="hero-role">{home.hero.role}</p>
        <h1 class="hero-name">{site.author}</h1>
        <span class="hero-rule" aria-hidden="true"></span>
        <p class="hero-copy">{home.hero.tagline}</p>
```

3. 紹介文:

```astro
  <p class="home-intro" data-reveal>
    {home.intro.text}
    <a class="home-intro-link" href={`${BASE_PATH}about/`}>{home.intro.linkLabel}<span class="arrow" aria-hidden="true">→</span></a>
  </p>
```

4. スキル一覧: `{skills.map((skill) => <li>{skill}</li>)}` → `{home.skills.map((skill) => <li>{skill}</li>)}`
5. 連絡先: GitHubの行は空文字なら非表示にし（フッターと挙動統一）、表示テキストはURLから導出。メールは `site.email` を使う:

```astro
    <ul class="contact-list" role="list" data-reveal="delayed">
      {site.social.github && (
        <li>
          <span class="contact-label">GITHUB</span>
          <a href={site.social.github} target="_blank" rel="noopener noreferrer">{githubLabel}</a>
        </li>
      )}
      <li>
        <span class="contact-label">EMAIL</span>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </li>
    </ul>
```

- [ ] **Step 3: ビルドと型チェックが通ることを確認**

Run: `npm run build && npm run check`
Expected: 両方成功

- [ ] **Step 4: 生成HTMLに文言が反映されていることを確認**

Run: `grep -o "つくることと、動かし続けること。" dist/index.html && grep -o "github.com/TakuyaAsaoka" dist/index.html`
Expected: 両方ヒットする

- [ ] **Step 5: コミット**

```bash
git add src/pages/index.astro
git commit -m "feat: Homeページの文言をCMS管理のデータから取得する (#89)"
```

---

### Task 6: About（about.astro）を about.yaml へ置換

**Files:**
- Modify: `src/pages/about.astro`

- [ ] **Step 1: フロントマターとテンプレートを置換**

フロントマターとテンプレートを以下に変更する（`<style>` ブロックは現状のまま残す）:

```astro
---
import { getEntry } from "astro:content";
import BaseLayout from "../layouts/BaseLayout.astro";

// CMS管理のAbout文言を取得する
const aboutEntry = await getEntry("about", "about");
if (!aboutEntry) {
  throw new Error("About文言（src/content/pages/about.yaml）が見つかりません");
}
const about = aboutEntry.data;

// 本文を空行区切りで段落に分割する
function toParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}
---

<BaseLayout title="About" description="アサオカの自己紹介 — 経歴・仕事観・人となり" breadcrumb={[{ label: "About" }]}>
  <section>
    <h1 class="section-heading page-heading">
      <span class="section-title">自己紹介</span>
      <span class="section-label" aria-hidden="true">ABOUT</span>
    </h1>
    <p class="about-lead">{about.lead}</p>
  </section>

  {about.sections.map((section) => (
    <section class="about-section">
      <h2 class="section-heading">
        <span class="section-title">{section.title}</span>
        <span class="section-label" aria-hidden="true">{section.label}</span>
      </h2>
      {toParagraphs(section.body).map((paragraph) => <p>{paragraph}</p>)}
    </section>
  ))}
</BaseLayout>
```

- [ ] **Step 2: ビルドと型チェックが通ることを確認**

Run: `npm run build && npm run check`
Expected: 両方成功

- [ ] **Step 3: 生成HTMLでセクション構造と段落分割を確認**

Run: `grep -c "about-section" dist/about/index.html && grep -o "釣り糸を垂れる" dist/about/index.html`
Expected: `about-section` が4件以上ヒット（4セクション分）、かつ「仕事の外では」の2段落目の文言がヒットする。さらに `grep -o "<p[^>]*>ときどきは" dist/about/index.html` で2段落目が独立した `<p>` になっていることを確認（scoped styleにより `<p>` には `data-astro-cid-*` 属性が付くため、`<p>ときどきは` の完全一致では検索しないこと）

- [ ] **Step 4: コミット**

```bash
git add src/pages/about.astro
git commit -m "feat: Aboutページの文言をCMS管理のデータから取得する (#89)"
```

---

### Task 7: consts.ts から移行済み定数を削除

**Files:**
- Modify: `src/consts.ts`

- [ ] **Step 1: 移行済み定数への参照が残っていないことを確認**

Run: `grep -rn "SITE_TITLE\|SITE_DESCRIPTION\|SITE_AUTHOR\|COPYRIGHT_HOLDER\|SOCIAL_LINKS\|NOTE_RSS_URL\|EMAIL" src/ --include="*.astro" --include="*.ts" | grep -v "consts.ts" | grep -v "contact-label"`
Expected: ヒット0件（残っていたらTask 3〜6の置換漏れ。該当ファイルを先に置換する）
補足: `index.astro` の `<span class="contact-label">EMAIL</span>` は連絡先の見出し表示テキストであり定数参照ではないため、`grep -v "contact-label"` で除外している。最終的な置換漏れ検出はStep 3のビルド（削除済み定数へのimportが残っていれば失敗する）が担保する。

- [ ] **Step 2: consts.ts をスリム化**

ファイル全体を以下の内容にする:

```typescript
// デプロイ先の基準パス。Astro の BASE_URL は本番ビルドで末尾スラッシュを持たない
// （例: "/homepage"）ため、末尾スラッシュを保証した定数に集約する。
// import.meta.env.BASE_URL を直接文字列連結してはならない（本番でリンクが壊れる）
export const BASE_PATH = import.meta.env.BASE_URL.endsWith("/")
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

// サイト名・SNSリンク等の文言はCMS管理（src/content/settings/site.yaml）。
// ここには技術的な定数のみを置く
export const SITE_LANG = "ja";
export const SITE_LOCALE = "ja-JP";
// OGP（SNS/チャット共有）のデフォルト画像。ページ個別指定が無いときのフォールバック
export const DEFAULT_OG_IMAGE = `${BASE_PATH}images/og.png`;
```

- [ ] **Step 3: ビルドと型チェックが通ることを確認**

Run: `npm run build && npm run check`
Expected: 両方成功（削除した定数への参照が残っていればここで失敗する）

- [ ] **Step 4: コミット**

```bash
git add src/consts.ts
git commit -m "refactor: CMSへ移行した定数をconsts.tsから削除する (#89)"
```

---

### Task 8: CMS設定（config.yml）の更新と日本語化

**Files:**
- Modify: `public/admin/config.yml`

- [ ] **Step 1: config.yml を全面更新**

ファイル全体を以下の内容にする（backend / media設定は現状のまま。Projectsの日本語化、「ページ」「サイト設定」ファイルコレクションの追加）:

```yaml
# CMS管理画面のログイン設定（OAuth導入手順・PAT方式）は docs/cms-oauth-setup.md を参照
backend:
  name: github
  repo: "TakuyaAsaoka/homepage"
  branch: main
  # OAuthログイン用のsveltia-cms-auth WorkerのURL（docs/cms-oauth-setup.md のStep 4）
  base_url: "https://sveltia-cms-auth.dimas080201.workers.dev"

media_folder: "public/images"
public_folder: "/homepage/images"

collections:
  - name: "projects"
    label: "制作物"
    folder: "src/content/projects"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "タイトル", name: "title", widget: "string", hint: "制作物の名前" }
      - { label: "説明", name: "description", widget: "text", hint: "一覧やSNS共有時に表示される短い説明文" }
      - { label: "タグ", name: "tags", widget: "list", default: [], hint: "使用技術など。Enterで追加できます" }
      - { label: "画像", name: "image", widget: "image", required: false, hint: "一覧・詳細ページに表示される画像" }
      - { label: "URL", name: "url", widget: "string", required: false, hint: "制作物の公開URL（あれば）" }
      - { label: "公開日", name: "pubDate", widget: "datetime", hint: "一覧はこの日付の新しい順に並びます" }
      - { label: "下書き", name: "draft", widget: "boolean", default: false, hint: "オンにするとサイトに表示されません" }
      - { label: "本文", name: "body", widget: "markdown", hint: "詳細ページの本文" }

  - name: "pages"
    label: "ページ"
    files:
      - name: "home"
        label: "Home"
        file: "src/content/pages/home.yaml"
        fields:
          - label: "ヒーロー"
            name: "hero"
            widget: "object"
            fields:
              - { label: "肩書き", name: "role", widget: "string", hint: "名前の上に英字で表示されます（例: SOFTWARE ENGINEER / SRE）" }
              - { label: "キャッチコピー", name: "tagline", widget: "string", hint: "名前の下に表示される一文" }
          - label: "紹介文"
            name: "intro"
            widget: "object"
            fields:
              - { label: "本文", name: "text", widget: "text", hint: "ヒーロー直下に表示される自己紹介の一文" }
              - { label: "リンクテキスト", name: "linkLabel", widget: "string", hint: "Aboutページへのリンクの文言" }
          - { label: "スキル一覧", name: "skills", widget: "list", hint: "技術セクションに表示されます。Enterで追加できます" }
      - name: "about"
        label: "About"
        file: "src/content/pages/about.yaml"
        fields:
          - { label: "リード文", name: "lead", widget: "text", hint: "ページ冒頭に表示される導入文" }
          - label: "セクション"
            name: "sections"
            widget: "list"
            summary: "{{fields.title}}"
            hint: "セクションの追加・削除・並び替えができます"
            fields:
              - { label: "見出し", name: "title", widget: "string", hint: "例: 歩み" }
              - { label: "英字ラベル", name: "label", widget: "string", hint: "見出しの横に表示される英字（例: CAREER）" }
              - { label: "本文", name: "body", widget: "text", hint: "空行を入れると段落が分かれます" }

  - name: "settings"
    label: "サイト設定"
    files:
      - name: "site"
        label: "サイト設定"
        file: "src/content/settings/site.yaml"
        fields:
          - { label: "サイト名", name: "title", widget: "string", hint: "ヘッダー・ブラウザのタブ・SNS共有時に表示されます" }
          - { label: "サイト説明", name: "description", widget: "string", hint: "検索結果やSNS共有時に表示される説明文" }
          - { label: "表示名", name: "author", widget: "string", hint: "Homeのヒーローに大きく表示される名前" }
          - { label: "著作権表記", name: "copyrightHolder", widget: "string", hint: "フッターの©の後に表示される欧文表記" }
          - { label: "メールアドレス", name: "email", widget: "string", hint: "Homeの連絡先に表示されます" }
          - label: "SNSリンク"
            name: "social"
            widget: "object"
            fields:
              - { label: "GitHub", name: "github", widget: "string", required: false, default: "", hint: "プロフィールのURL。空にすると非表示になります" }
              - { label: "X（Twitter）", name: "twitter", widget: "string", required: false, default: "", hint: "プロフィールのURL。空にすると非表示になります" }
              - { label: "YouTube", name: "youtube", widget: "string", required: false, default: "", hint: "チャンネルのURL。空にすると非表示になります" }
          - { label: "note RSS URL", name: "noteRssUrl", widget: "string", required: false, default: "", hint: "noteのRSS URL（例: https://note.com/xxx/rss）。空にするとブログページのRSS連携が止まります" }
```

- [ ] **Step 2: フィールド定義とzodスキーマの一致を確認**

`public/admin/config.yml` の各 `name` が `src/content.config.ts` のスキーマのキーと完全一致することを目視で照合する（`docs/coding-standards.md` §10「コレクション定義は content.config.ts のスキーマと一致させてください」）。

- [ ] **Step 3: ビルドが通ることを確認**

Run: `npm run build && npm run check`
Expected: 両方成功（config.ymlは静的ファイルなのでビルドへの影響はないが、リグレッション確認として実行）

- [ ] **Step 4: コミット**

```bash
git add public/admin/config.yml
git commit -m "feat: CMS管理画面にページ・サイト設定を追加し全フィールドを日本語化する (#89)"
```

---

### Task 9: 総合検証

**Files:** なし（検証のみ）

- [ ] **Step 1: クリーンビルドと型チェック**

Run: `npm run build && npm run check`
Expected: 両方成功。エラー・warning 0件

- [ ] **Step 2: 開発サーバーでの目視確認**

`npm run dev` を起動し（バックグラウンド実行）、以下を確認する。ブラウザ操作ツールが使えない場合は `curl http://localhost:4321/homepage/` 等で生成HTMLを確認する:

| ページ | 確認項目 |
|--------|---------|
| `/homepage/` | ヒーロー（肩書き・名前・キャッチコピー）、紹介文、スキル8件、連絡先（GitHubリンクの表示テキストが `github.com/TakuyaAsaoka`、メール） |
| `/homepage/about/` | リード文、4セクション（見出し+英字ラベル）、「仕事の外では」が2段落に分かれている |
| `/homepage/blog/` | note記事一覧が表示される（RSS取得成功） |
| 全ページ共通 | ヘッダーのサイト名、フッターの©表記とGitHubリンク |
| `/homepage/rss.xml` | `<title>ASAOKA Homepage</title>` が含まれる |
| `/homepage/admin/` | CMS管理画面に「制作物」「ページ」「サイト設定」が日本語で表示される（ログインは不要。コレクション一覧の表示確認まで） |

確認後、開発サーバーを停止する。

- [ ] **Step 3: 文言変更が反映されることを確認**

`src/content/pages/home.yaml` の `tagline` を一時的に `テスト用キャッチコピー` に変更し、`npm run build` 後に `grep -o "テスト用キャッチコピー" dist/index.html` でヒットすることを確認。**確認後、必ず元の値に戻し**、`git diff` で作業ツリーがクリーンであることを確認する。

- [ ] **Step 4: 空文字時の挙動確認（境界値）**

`src/content/settings/site.yaml` の `social.github` を一時的に `""` に変更し、`npm run build` 後に `dist/index.html` に `GITHUB` の連絡先行が出力されないこと、`dist/about/index.html` 等のフッターにGitHubリンクが出ないことを確認。**確認後、必ず元の値に戻し**、再ビルドして `git diff` がクリーンであることを確認する。

- [ ] **Step 5: 空リスト時の挙動確認（境界値）**

`src/content/pages/home.yaml` の `skills` を一時的に `[]` に、`src/content/pages/about.yaml` の `sections` を一時的に `[]` に変更し、`npm run build` が成功すること・`dist/index.html` の技術セクションと `dist/about/index.html` が表示崩れなく生成されることを確認する（空リストはスキーマ上許容。設計書のエラー処理節参照）。**確認後、必ず元の値に戻し**、再ビルドして `git diff` がクリーンであることを確認する。

- [ ] **Step 6: 最新mainの取り込み**

Run: `git fetch origin main && git merge origin/main`
Expected: コンフリクトなし（発生した場合は解消してビルド・型チェックを再実行）

---

## 完了後

実装完了後は superpowers:finishing-a-development-branch スキルに従い、PR作成へ進む（PR本文にはIssue #89への参照と設計書・本計画へのリンクを含める）。マージ後は `~/.claude/CLAUDE.md` のWorktreeクリーンアップ手順を実行する。
