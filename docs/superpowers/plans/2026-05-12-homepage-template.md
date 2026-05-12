# Homepage Template Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Astro SSGベースの個人ホームページテンプレートを作成する。Content Collections + Sveltia CMSで非エンジニアも編集可能にし、GitHub Pagesにデプロイする。

**Architecture:** Astro SSGで静的HTMLを生成し、GitHub Pagesでホスティング。コンテンツはContent Collections（Markdown）で管理し、Sveltia CMSで`/admin`に管理画面を提供する。noteのRSSを取得してBlogページに表示する。

**Tech Stack:** Astro (SSG), TypeScript, Sveltia CMS, GitHub Pages, GitHub Actions

---

## File Structure

```
homepage/
├── .github/
│   └── workflows/
│       └── deploy.yml              # GitHub Pages デプロイ用
├── public/
│   ├── admin/
│   │   ├── index.html              # Sveltia CMS 管理画面
│   │   └── config.yml              # Sveltia CMS 設定
│   ├── images/                     # CMS画像アップロード先
│   │   └── .gitkeep
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── BaseHead.astro          # <head>内のmeta, OGP
│   │   ├── Header.astro            # ナビゲーション
│   │   ├── Footer.astro            # フッター（SNSリンク枠）
│   │   └── ProjectCard.astro       # プロジェクト表示カード
│   ├── content/
│   │   └── projects/
│   │       └── sample-project.md   # サンプルプロジェクト
│   ├── layouts/
│   │   └── BaseLayout.astro        # 共通レイアウト
│   ├── pages/
│   │   ├── index.astro             # Home
│   │   ├── about.astro             # About
│   │   ├── blog.astro              # Blog（noteのRSS表示）
│   │   └── projects/
│   │       ├── index.astro         # Projects一覧
│   │       └── [...slug].astro     # Projects詳細
│   ├── styles/
│   │   └── global.css              # 最小限のグローバルスタイル
│   └── consts.ts                   # サイト設定（名前、URL等）
├── src/content.config.ts           # Content Collections スキーマ定義
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

---

## Task 1: Astroプロジェクト初期化

**Files:**
- Create: `astro.config.mjs`, `package.json`, `tsconfig.json`

- [ ] **Step 1: Astroプロジェクトを作成**

```bash
cd /Users/asaokatakuya/SynologyDrive/workspace/private/homepage
npm create astro@latest . -- --template minimal --install --no-git --typescript strict
```

コマンド解説:
- `npm create astro@latest` — Astroの最新版（現在6.3.1）でプロジェクトを生成する
- `.` — 現在のディレクトリにプロジェクトを作成する（新しいフォルダを作らない）
- `--` — npm側のオプションとAstro側のオプションの区切り
- `--template minimal` — 最小構成のテンプレートを使用（不要なサンプルコードなし）
- `--install` — 依存パッケージを自動でインストールする（`npm install`を省略できる）
- `--no-git` — git initをスキップする（既にgitリポジトリがあるため）
- `--typescript strict` — TypeScriptを厳格モードで有効化する（型チェックが最も厳しい設定）

- [ ] **Step 2: astro.config.mjs に site を設定**

`astro.config.mjs`:
```javascript
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://<username>.github.io",
  base: "/homepage",
});
```

設定解説:
- `site` — サイトの本番URL。OGPのcanonical URLなどに使われる
- `base` — サブパス。GitHub Pagesではリポジトリ名がURLのパスになる（例: `username.github.io/homepage/`）ため、`/homepage`を指定する。独自ドメインを使う場合は`/`に変更する

※ `<username>` はテンプレート利用者が自分のGitHubユーザー名に置き換える。

- [ ] **Step 3: ビルド確認**

Run: `npm run build`
Expected: `dist/` に静的ファイルが生成される

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: initialize Astro project with minimal template"
```

---

## Task 2: サイト設定と基本構成

**Files:**
- Create: `src/consts.ts`
- Create: `src/styles/global.css`

- [ ] **Step 1: サイト設定ファイルを作成**

`src/consts.ts`:
```typescript
export const SITE_TITLE = "My Homepage";
export const SITE_DESCRIPTION = "A personal homepage template built with Astro";
export const SITE_URL = "https://example.com";
export const SITE_LANG = "ja";

// SNSリンク（使わないものは空文字にする）
export const SOCIAL_LINKS = {
  github: "",
  twitter: "",
  youtube: "",
};

// noteのRSS URL
export const NOTE_RSS_URL = "";
```

- [ ] **Step 2: グローバルCSSを作成**

`src/styles/global.css`:
最小限のリセットCSSとレスポンシブ用の基本スタイルのみ。デザインはあとで決めるため、構造的なスタイルだけ定義する。

```css
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: system-ui, -apple-system, sans-serif;
  line-height: 1.6;
}

body {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

img {
  max-width: 100%;
  height: auto;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/consts.ts src/styles/global.css
git commit -m "feat: add site configuration and global styles"
```

---

## Task 3: レイアウトとコンポーネント

**Files:**
- Create: `src/components/BaseHead.astro`
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: BaseHead コンポーネントを作成**

`src/components/BaseHead.astro`:
OGPメタタグ、charset、viewportを含む`<head>`内の共通要素。
Props: `title`, `description`, `image`(optional)

```astro
---
import { SITE_TITLE, SITE_URL, SITE_LANG } from "../consts";

interface Props {
  title: string;
  description: string;
  image?: string;
}

const { title, description, image } = Astro.props;
const canonicalURL = Astro.site ? new URL(Astro.url.pathname, Astro.site) : Astro.url;
const ogImage = image && Astro.site ? new URL(image, Astro.site).href : image;
---

<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="generator" content={Astro.generator} />
<link rel="icon" type="image/svg+xml" href={`${import.meta.env.BASE_URL}favicon.svg`} />

<!-- Primary Meta Tags -->
<title>{title} | {SITE_TITLE}</title>
<meta name="title" content={`${title} | ${SITE_TITLE}`} />
<meta name="description" content={description} />
<link rel="canonical" href={canonicalURL} />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content={canonicalURL} />
<meta property="og:title" content={`${title} | ${SITE_TITLE}`} />
<meta property="og:description" content={description} />
<meta property="og:locale" content={SITE_LANG} />
<meta property="og:site_name" content={SITE_TITLE} />
{ogImage && <meta property="og:image" content={ogImage} />}

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content={`${title} | ${SITE_TITLE}`} />
<meta name="twitter:description" content={description} />
{ogImage && <meta name="twitter:image" content={ogImage} />}
```

- [ ] **Step 2: Header コンポーネントを作成**

`src/components/Header.astro`:
ナビゲーションリンク（Home, About, Blog, Projects）を含む。レスポンシブ対応。

```astro
---
import { SITE_TITLE } from "../consts";

const base = import.meta.env.BASE_URL;

const navItems = [
  { label: "Home", href: `${base}` },
  { label: "About", href: `${base}about/` },
  { label: "Blog", href: `${base}blog/` },
  { label: "Projects", href: `${base}projects/` },
];

const currentPath = Astro.url.pathname;
---

<header class="header">
  <nav class="nav">
    <a href={base} class="nav-title">{SITE_TITLE}</a>
    <ul class="nav-links">
      {navItems.map((item) => (
        <li>
          <a
            href={item.href}
            class:list={["nav-link", { active: currentPath === item.href }]}
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
</header>

<style>
  .header {
    padding: 1rem;
  }
  .nav {
    max-width: 800px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .nav-title {
    font-weight: bold;
    text-decoration: none;
    color: inherit;
  }
  .nav-links {
    display: flex;
    list-style: none;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .nav-link {
    text-decoration: none;
    color: inherit;
  }
  .nav-link.active {
    text-decoration: underline;
  }
</style>
```

- [ ] **Step 3: Footer コンポーネントを作成**

`src/components/Footer.astro`:
SNSリンク枠を含むフッター。`SOCIAL_LINKS`から設定済みのリンクのみ表示。

```astro
---
import { SOCIAL_LINKS } from "../consts";

const activeLinks = Object.entries(SOCIAL_LINKS).filter(([, url]) => url);
---

<footer class="footer">
  <div class="footer-inner">
    {activeLinks.length > 0 && (
      <ul class="social-links">
        {activeLinks.map(([name, url]) => (
          <li>
            <a href={url} target="_blank" rel="noopener noreferrer">
              {name}
            </a>
          </li>
        ))}
      </ul>
    )}
    <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
  </div>
</footer>

<style>
  .footer {
    padding: 2rem 1rem;
    text-align: center;
  }
  .footer-inner {
    max-width: 800px;
    margin: 0 auto;
  }
  .social-links {
    display: flex;
    justify-content: center;
    list-style: none;
    gap: 1rem;
    margin-bottom: 1rem;
  }
</style>
```

- [ ] **Step 4: BaseLayout を作成**

`src/layouts/BaseLayout.astro`:
BaseHead、Header、Footerを組み合わせた共通レイアウト。

```astro
---
import BaseHead from "../components/BaseHead.astro";
import Header from "../components/Header.astro";
import Footer from "../components/Footer.astro";
import "../styles/global.css";

interface Props {
  title: string;
  description: string;
  image?: string;
}

const { title, description, image } = Astro.props;
---

<!doctype html>
<html lang="ja">
  <head>
    <BaseHead title={title} description={description} image={image} />
  </head>
  <body>
    <Header />
    <main>
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 5: ビルド確認**

Run: `npm run build`
Expected: エラーなし

- [ ] **Step 6: Commit**

```bash
git add src/components/ src/layouts/
git commit -m "feat: add base layout with OGP, header, and footer"
```

---

## Task 4: Content Collections（Projects）

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/projects/sample-project.md`

- [ ] **Step 1: Content Collections スキーマを定義**

`src/content.config.ts`:
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
    url: z.string().url().optional(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { projects };
```

- [ ] **Step 2: サンプルプロジェクトを作成**

`src/content/projects/sample-project.md`:
```markdown
---
title: "Sample Project"
description: "This is a sample project for the template."
tags: ["Astro", "Template"]
pubDate: 2026-01-01
draft: false
---

This is a sample project entry. Replace this with your own content.
```

- [ ] **Step 3: ビルド確認**

Run: `npm run build`
Expected: エラーなし

- [ ] **Step 4: Commit**

```bash
git add src/content.config.ts src/content/projects/
git commit -m "feat: add Content Collections schema for projects"
```

---

## Task 5: ページ作成（Home, About, Blog, Projects）

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/pages/about.astro`
- Create: `src/pages/blog.astro`
- Create: `src/pages/projects/index.astro`
- Create: `src/pages/projects/[...slug].astro`
- Create: `src/components/ProjectCard.astro`

- [ ] **Step 1: ProjectCard コンポーネントを作成**

`src/components/ProjectCard.astro`:
```astro
---
interface Props {
  title: string;
  description: string;
  tags: string[];
  url?: string;
  slug: string;
}

const { title, description, tags, url, slug } = Astro.props;
---

<article class="project-card">
  <h3>
    <a href={`${import.meta.env.BASE_URL}projects/${slug}/`}>{title}</a>
  </h3>
  <p>{description}</p>
  {tags.length > 0 && (
    <ul class="tags">
      {tags.map((tag) => (
        <li class="tag">{tag}</li>
      ))}
    </ul>
  )}
</article>

<style>
  .project-card {
    padding: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  .project-card h3 a {
    text-decoration: none;
    color: inherit;
  }
  .tags {
    display: flex;
    list-style: none;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  .tag {
    font-size: 0.85rem;
    padding: 0.1rem 0.5rem;
    background: #f0f0f0;
    border-radius: 2px;
  }
</style>
```

- [ ] **Step 2: Homeページを更新**

`src/pages/index.astro`:
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { SITE_DESCRIPTION } from "../consts";
---

<BaseLayout title="Home" description={SITE_DESCRIPTION}>
  <section>
    <h1>Welcome</h1>
    <p>This is a personal homepage template built with Astro.</p>
  </section>
</BaseLayout>
```

- [ ] **Step 3: Aboutページを作成**

`src/pages/about.astro`:
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="About" description="About me">
  <section>
    <h1>About</h1>
    <p>Write your introduction here.</p>
  </section>
</BaseLayout>
```

- [ ] **Step 4: Blogページを作成（noteのRSS取得）**

まず`rss-parser`をインストール:
```bash
npm install rss-parser
```

コマンド解説:
- `npm install rss-parser` — RSSフィードをパース（解析）するライブラリを追加する。`package.json`のdependenciesに自動追記される

`src/pages/blog.astro`:
```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import { NOTE_RSS_URL } from "../consts";
import Parser from "rss-parser";

let feedItems: { title: string; link: string; pubDate: string }[] = [];

if (NOTE_RSS_URL) {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(NOTE_RSS_URL);
    feedItems = (feed.items ?? []).map((item) => ({
      title: item.title ?? "",
      link: item.link ?? "",
      pubDate: item.pubDate ?? "",
    }));
  } catch (e) {
    console.error("Failed to fetch RSS feed:", e);
  }
}
---

<BaseLayout title="Blog" description="Blog posts from note">
  <section>
    <h1>Blog</h1>
    {NOTE_RSS_URL === "" && (
      <p>Set <code>NOTE_RSS_URL</code> in <code>src/consts.ts</code> to display blog posts.</p>
    )}
    {feedItems.length > 0 ? (
      <ul class="blog-list">
        {feedItems.map((item) => (
          <li>
            <a href={item.link} target="_blank" rel="noopener noreferrer">
              {item.title}
            </a>
            {item.pubDate && (
              <time>{new Date(item.pubDate).toLocaleDateString("ja-JP")}</time>
            )}
          </li>
        ))}
      </ul>
    ) : NOTE_RSS_URL !== "" && (
      <p>No posts found.</p>
    )}
  </section>
</BaseLayout>

<style>
  .blog-list {
    list-style: none;
  }
  .blog-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
  }
  .blog-list time {
    font-size: 0.85rem;
    white-space: nowrap;
    color: #666;
  }
</style>
```

- [ ] **Step 5: Projects一覧ページを作成**

`src/pages/projects/index.astro`:
```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import ProjectCard from "../../components/ProjectCard.astro";
import { getCollection } from "astro:content";

const projects = (await getCollection("projects"))
  .filter((p) => !p.data.draft)
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---

<BaseLayout title="Projects" description="My projects">
  <section>
    <h1>Projects</h1>
    {projects.length > 0 ? (
      projects.map((project) => (
        <ProjectCard
          title={project.data.title}
          description={project.data.description}
          tags={project.data.tags}
          url={project.data.url}
          slug={project.id}
        />
      ))
    ) : (
      <p>No projects yet.</p>
    )}
  </section>
</BaseLayout>
```

- [ ] **Step 6: Projects詳細ページを作成**

`src/pages/projects/[...slug].astro`:
```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import { getCollection, render } from "astro:content";

export async function getStaticPaths() {
  const projects = await getCollection("projects");
  return projects
    .filter((p) => !p.data.draft)
    .map((project) => ({
      params: { slug: project.id },
      props: { project },
    }));
}

const { project } = Astro.props;
const { Content } = await render(project);
---

<BaseLayout title={project.data.title} description={project.data.description}>
  <article>
    <h1>{project.data.title}</h1>
    <time>{project.data.pubDate.toLocaleDateString("ja-JP")}</time>
    {project.data.tags.length > 0 && (
      <ul class="tags">
        {project.data.tags.map((tag: string) => (
          <li class="tag">{tag}</li>
        ))}
      </ul>
    )}
    {project.data.url && (
      <p><a href={project.data.url} target="_blank" rel="noopener noreferrer">View Project</a></p>
    )}
    <div class="content">
      <Content />
    </div>
  </article>
</BaseLayout>

<style>
  time {
    color: #666;
    font-size: 0.9rem;
  }
  .tags {
    display: flex;
    list-style: none;
    gap: 0.5rem;
    margin: 0.5rem 0;
  }
  .tag {
    font-size: 0.85rem;
    padding: 0.1rem 0.5rem;
    background: #f0f0f0;
    border-radius: 2px;
  }
  .content {
    margin-top: 2rem;
  }
</style>
```

- [ ] **Step 7: ビルド確認**

Run: `npm run build`
Expected: エラーなし、`dist/`に各ページが生成される

- [ ] **Step 8: Commit**

```bash
git add src/pages/ src/components/ProjectCard.astro package.json package-lock.json
git commit -m "feat: add Home, About, Blog, and Projects pages"
```

---

## Task 6: Sveltia CMS 設定

**Files:**
- Create: `public/admin/index.html`
- Create: `public/admin/config.yml`

**Note:** Sveltia CMSはCDNから読み込む静的HTMLファイルとして`/admin`に配置する。設定は`config.yml`で管理する。認証にはGitHub OAuth Appの登録と、OAuthプロキシ（外部サービスまたはCloudflare Workers等）が必要。テンプレートではCMSのUI部分のみ組み込み、認証セットアップ手順はREADMEに記載する。

- [ ] **Step 1: Sveltia CMS の管理画面HTMLを作成**

`public/admin/index.html`:
```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Content Manager</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <script src="https://unpkg.com/@sveltia/cms/dist/sveltia-cms.js" type="module"></script>
  </body>
</html>
```

- [ ] **Step 2: Sveltia CMS の設定ファイルを作成**

`public/admin/config.yml`:
```yaml
backend:
  name: github
  repo: "" # e.g. "username/homepage"
  branch: main

media_folder: "public/images"
public_folder: "/homepage/images"

collections:
  - name: "projects"
    label: "Projects"
    folder: "src/content/projects"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Description", name: "description", widget: "text" }
      - { label: "Tags", name: "tags", widget: "list", default: [] }
      - { label: "Image", name: "image", widget: "image", required: false }
      - { label: "URL", name: "url", widget: "string", required: false }
      - { label: "Publish Date", name: "pubDate", widget: "datetime" }
      - { label: "Draft", name: "draft", widget: "boolean", default: false }
      - { label: "Body", name: "body", widget: "markdown" }
```

- [ ] **Step 3: ビルド確認**

Run: `npm run build`
Expected: `dist/admin/index.html`と`dist/admin/config.yml`が生成される

- [ ] **Step 4: Commit**

```bash
git add public/admin/
git commit -m "feat: add Sveltia CMS admin page"
```

---

## Task 7: GitHub Pages デプロイ設定

**Files:**
- Create: `.github/workflows/deploy.yml`

※ `astro.config.mjs`の`site`と`base`はTask 1で設定済み。

- [ ] **Step 1: GitHub Actions ワークフローを作成**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]       # mainブランチへのpush時に実行
  workflow_dispatch:        # GitHub上から手動実行も可能にする

permissions:                # このワークフローに付与する権限
  contents: read            # リポジトリの読み取り（コードの取得に必要）
  pages: write              # GitHub Pagesへの書き込み（デプロイに必要）
  id-token: write           # OIDC認証トークン（GitHub Pagesの認証に必要）

concurrency:                # 同時実行の制御
  group: "pages"            # 同じグループ名のワークフローは同時に1つだけ実行
  cancel-in-progress: false # 実行中のデプロイはキャンセルしない（途中で壊れるのを防ぐ）

jobs:
  build:
    runs-on: ubuntu-latest  # Ubuntu最新版の仮想マシンで実行
    steps:
      - name: Checkout
        uses: actions/checkout@v4        # リポジトリのコードを取得する
      - name: Setup Pages
        uses: actions/configure-pages@v5 # GitHub Pagesの設定を自動検出する
      - name: Build with Astro
        uses: withastro/action@v6        # Astro公式のビルドアクション（ビルド+アーティファクトアップロードを自動で行う）
        with:
          node-version: 22               # Astro 6はNode.js 22.12.0以上が必要

  deploy:
    needs: build                         # buildジョブの完了後に実行
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}  # デプロイ後のURLを環境変数として出力
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4    # ビルド成果物をGitHub Pagesにデプロイする
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "feat: add GitHub Pages deployment workflow"
```

---

## Task 8: favicon と最終調整

**Files:**
- Create: `public/favicon.svg`
- Create: `public/images/.gitkeep`

- [ ] **Step 1: プレースホルダーfaviconを作成**

`public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="4" fill="#333"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-size="20" font-family="system-ui">H</text>
</svg>
```

- [ ] **Step 2: 画像ディレクトリを作成**

```bash
mkdir -p public/images      # public/imagesディレクトリを作成（-pは途中のディレクトリも作る）
touch public/images/.gitkeep # 空ファイルを作成（Gitは空ディレクトリを管理できないため、ファイルを置いて追跡させる）
```

- [ ] **Step 3: 最終ビルド確認**

Run: `npm run build`
Expected: エラーなし、全ページが`dist/`に生成

Run: `npm run preview`
Expected: ローカルで全ページが表示できる

- [ ] **Step 4: Commit**

```bash
git add public/
git commit -m "feat: add favicon and images directory"
```

---

## Task 9: テンプレートリポジトリ設定

- [ ] **Step 1: GitHubリポジトリをテンプレートに設定**

```bash
gh repo edit --template
```

コマンド解説:
- `gh repo edit` — GitHubリポジトリの設定を変更する
- `--template` — テンプレートリポジトリとして有効化する。有効にすると、リポジトリに「Use this template」ボタンが表示され、他のユーザーがこのリポジトリを雛形にして新しいリポジトリを作れるようになる

- [ ] **Step 2: 最終push**

```bash
git push origin main
```

コマンド解説:
- `git push` — ローカルのコミットをリモートリポジトリに送信する
- `origin` — リモートリポジトリの名前（GitHub上のリポジトリを指す）
- `main` — 送信するブランチ名

- [ ] **Step 3: GitHub Pagesを有効化**

リポジトリ Settings > Pages > Source を「GitHub Actions」に設定:
```bash
gh api repos/{owner}/{repo}/pages -X POST -f build_type=workflow
```

コマンド解説:
- `gh api` — GitHub APIを直接呼び出す
- `repos/{owner}/{repo}/pages` — GitHub PagesのAPIエンドポイント。`{owner}`と`{repo}`は自動で現在のリポジトリに置き換わる
- `-X POST` — HTTPメソッドをPOST（作成）に指定する
- `-f build_type=workflow` — デプロイソースをGitHub Actionsに設定する（ブランチからの直接デプロイではなく、ワークフローの成果物を使う）
