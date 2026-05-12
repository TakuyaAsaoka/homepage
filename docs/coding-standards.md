# コーディング規約 (Coding Standards)

homepage プロジェクトのコーディング規約ドキュメントです。
一貫したスタイルでコードを書くための指針を定義しています。

---

## 目次

1. [概要と適用範囲](#1-概要と適用範囲)
2. [プロジェクト構成](#2-プロジェクト構成)
3. [TypeScript規約](#3-typescript規約)
4. [フォーマット規約](#4-フォーマット規約)
5. [Astroコンポーネント規約](#5-astroコンポーネント規約)
6. [関数設計](#6-関数設計)
7. [エラーハンドリング](#7-エラーハンドリング)
8. [非同期処理](#8-非同期処理)
9. [コメント規約](#9-コメント規約)
10. [コンテンツ管理](#10-コンテンツ管理)
11. [スタイル規約](#11-スタイル規約)
12. [コマンドリファレンス](#12-コマンドリファレンス)

---

## 1. 概要と適用範囲

### 適用範囲

本規約は以下のすべてのコードに適用されます：

- `src/` 配下のアプリケーションコード
- `public/` 配下の静的ファイル設定
- プロジェクトルートの設定ファイル

### 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| 言語 | TypeScript | strict モード |
| フレームワーク | Astro | ^6.3 |
| コンテンツ管理 | Astro Content Collections | - |
| バリデーション | Zod（Astro組み込み） | - |
| CMS | Sveltia CMS | - |
| デプロイ | GitHub Pages | - |
| パッケージマネージャ | npm | - |
| Node.js | - | >=22.12.0 |

---

## 2. プロジェクト構成

### ディレクトリ構造

```
homepage/
├── public/
│   ├── admin/              # Sveltia CMS 管理画面
│   │   └── config.yml      # CMS設定
│   ├── images/             # 画像ファイル
│   └── favicon.svg         # ファビコン
├── src/
│   ├── components/         # 再利用可能なコンポーネント
│   │   ├── BaseHead.astro  # <head>メタ情報
│   │   ├── Header.astro    # ヘッダー
│   │   ├── Footer.astro    # フッター
│   │   └── ProjectCard.astro
│   ├── content/            # コンテンツコレクション
│   │   └── projects/       # プロジェクト記事（Markdown）
│   ├── layouts/            # ページレイアウト
│   │   └── BaseLayout.astro
│   ├── pages/              # ページ（ファイルベースルーティング）
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── blog.astro
│   │   └── projects/
│   ├── styles/             # グローバルスタイル
│   │   └── global.css
│   ├── consts.ts           # サイト定数
│   └── content.config.ts   # コンテンツスキーマ定義
├── docs/                   # ドキュメント
├── .github/workflows/      # GitHub Actions
├── astro.config.mjs        # Astro設定
├── tsconfig.json           # TypeScript設定
└── CLAUDE.md               # AI開発ルール
```

### ファイル命名規則

| 対象 | 形式 | 例 |
|------|------|-----|
| Astroコンポーネント | PascalCase | `BaseHead.astro`, `ProjectCard.astro` |
| ページ | kebab-case | `about.astro`, `blog.astro` |
| TypeScriptファイル | kebab-case | `consts.ts`, `content.config.ts` |
| コンテンツ（Markdown） | kebab-case | `sample-project.md` |
| ディレクトリ | kebab-case | `components/`, `projects/` |

### モジュール形式

- **ESM のみ使用**（`"type": "module"` を `package.json` に設定）

```typescript
// ✅ 正しい
import { SITE_TITLE } from "../consts";

// ✅ Astroコンポーネントのインポート
import BaseHead from "../components/BaseHead.astro";
```

---

## 3. TypeScript規約

### 型定義: interface vs type

- **オブジェクト型（Props等）**: `interface` を優先使用
- **ユニオン型、プリミティブエイリアス**: `type` を使用

```typescript
// ✅ コンポーネントPropsは interface
interface Props {
  title: string;
  description: string;
  image?: string;
}

// ✅ ユニオン型は type
type PageType = "home" | "about" | "blog" | "projects";
```

### 命名規則

| 対象 | 形式 | 例 |
|------|------|-----|
| 変数・関数 | camelCase | `formatDate`, `isPublished` |
| 型・インターフェース | PascalCase | `Props`, `ProjectEntry` |
| 定数 | SCREAMING_SNAKE_CASE | `SITE_TITLE`, `NOTE_RSS_URL` |
| ファイル | kebab-case | `content.config.ts` |
| コンポーネント | PascalCase | `ProjectCard.astro` |

### 型の厳密性

- `any` の使用は禁止（`unknown` を使用）
- 明示的な型アノテーションよりも型推論を活用
- TypeScript strict モードを遵守（`astro/tsconfigs/strict` 継承）

```typescript
// ✅ 型推論を活用
const title = "My Homepage"; // string と推論される

// ✅ 複雑な戻り値は明示
function getPublishedProjects(): Promise<ProjectEntry[]> {
  // ...
}
```

---

## 4. フォーマット規約

### 基本設定

| 設定項目 | 値 | 説明 |
|---------|-----|------|
| インデント | スペース2つ | Astro/HTML/CSS/TypeScript共通 |
| クォート | ダブルクォート `"` | 文字列は常にダブルクォート |
| セミコロン | 必須 | 文末には必ずセミコロン |

### 行の長さ

- 推奨最大行長: 100文字
- 長い行は適切に改行する

```typescript
// ✅ 長い行は改行
const canonicalURL = Astro.site
  ? new URL(Astro.url.pathname, Astro.site)
  : Astro.url;

// ❌ 1行が長すぎる
const canonicalURL = Astro.site ? new URL(Astro.url.pathname, Astro.site) : Astro.url;
```

---

## 5. Astroコンポーネント規約

### コンポーネント構造

Astroコンポーネントはフロントマター（スクリプト）とテンプレートで構成されます。

```astro
---
// 1. インポート
import BaseHead from "../components/BaseHead.astro";
import { SITE_TITLE } from "../consts";

// 2. Props型定義
interface Props {
  title: string;
  description: string;
}

// 3. Props取得・ロジック
const { title, description } = Astro.props;
const formattedTitle = `${title} | ${SITE_TITLE}`;
---

<!-- 4. テンプレート -->
<div class="container">
  <h1>{formattedTitle}</h1>
  <p>{description}</p>
</div>
```

### フロントマターの記述順序

1. 外部パッケージのインポート
2. 内部コンポーネント・モジュールのインポート
3. スタイルのインポート
4. Props型定義（`interface Props`）
5. Props取得とローカル変数・ロジック

```astro
---
// 外部パッケージ
import rssParser from "rss-parser";

// 内部コンポーネント
import BaseHead from "../components/BaseHead.astro";
import Header from "../components/Header.astro";

// スタイル
import "../styles/global.css";

// Props型定義
interface Props {
  title: string;
}

// Props取得・ロジック
const { title } = Astro.props;
---
```

### レイアウトの使用

ページコンポーネントは必ずレイアウトを使用します。

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="ホーム" description="個人ホームページ">
  <section>
    <h2>ようこそ</h2>
  </section>
</BaseLayout>
```

### 動的ルーティング

`[...slug].astro` パターンで動的ページを生成します。

```astro
---
import { getCollection } from "astro:content";

export async function getStaticPaths() {
  const projects = await getCollection("projects");
  return projects.map((project) => ({
    params: { slug: project.id },
    props: { project },
  }));
}

const { project } = Astro.props;
const { Content } = await render(project);
---
```

---

## 6. 関数設計

### 関数宣言スタイル

- トップレベル関数: `function` 宣言を使用
- コールバック・無名関数: アロー関数を使用

```typescript
// ✅ トップレベル関数
export function formatDate(date: Date): string {
  return date.toLocaleDateString("ja-JP");
}

// ✅ コールバックはアロー関数
const published = projects.filter((p) => !p.data.draft);
```

### 関数の長さ

- 1関数は50行以内を目安
- 複雑なロジックは小さな関数に分割

---

## 7. エラーハンドリング

### try-catch パターン

- `catch` ブロックでは必ず `instanceof Error` チェックを行う
- エラーは適切にログ出力する

```typescript
// ✅ 推奨パターン
try {
  const feed = await parser.parseURL(rssUrl);
  return feed.items;
} catch (error) {
  if (error instanceof Error) {
    console.error("RSSフィード取得エラー:", error.message);
  }
  return [];
}
```

### ビルド時エラー

Astroは静的サイト生成のため、ビルド時にエラーが発生した場合はフォールバック値を返すことを推奨します。

```typescript
// ✅ ビルド時のフォールバック
const projects = await getCollection("projects").catch(() => []);
```

---

## 8. 非同期処理

### async/await 使用

- Promise チェーンではなく `async/await` を使用
- 並列処理には `Promise.all()` を活用

```typescript
// ✅ 並列処理
const [projects, blogPosts] = await Promise.all([
  getCollection("projects"),
  fetchBlogPosts(),
]);
```

---

## 9. コメント規約

### 言語

**すべてのコメントは日本語で記述する**（CLAUDE.md の規約）

```typescript
// ✅ 日本語コメント
// サイトのメタ情報を定義する
export const SITE_TITLE = "My Homepage";

// ❌ 英語コメント
// Define site metadata
export const SITE_TITLE = "My Homepage";
```

### コメントを書くべき場所

- **書く**: 非自明なロジック、設定値の意図
- **書かない**: 自明なコード、型定義から明らかな内容

```typescript
// ✅ 必要なコメント（設定値の意図）
// SNSリンク（使わないものは空文字にする）
export const SOCIAL_LINKS = {
  github: "",
  twitter: "",
};

// ❌ 不要なコメント（自明）
// タイトルを定義
const title = "ホーム";
```

---

## 10. コンテンツ管理

### Content Collections

コンテンツは `src/content/` 配下にMarkdownで管理し、`content.config.ts` でスキーマを定義します。

```typescript
// content.config.ts
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
```

### Markdownフロントマター

コンテンツファイルのフロントマターはスキーマに準拠します。

```markdown
---
title: プロジェクト名
description: プロジェクトの概要
tags: ["astro", "typescript"]
pubDate: 2026-01-01
draft: false
---

本文をここに記述する。
```

### CMS設定

Sveltia CMS の設定は `public/admin/config.yml` で管理します。
コレクション定義は `content.config.ts` のスキーマと一致させてください。

---

## 11. スタイル規約

### グローバルスタイル

- `src/styles/global.css` でサイト全体のスタイルを管理
- レイアウトコンポーネントでインポート

### スコープドスタイル

- コンポーネント固有のスタイルは `<style>` タグで記述（Astro自動スコープ）

```astro
<div class="card">
  <h3>{title}</h3>
</div>

<style>
  .card {
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
</style>
```

### クラス命名

- シンプルなケバブケースを使用（例: `project-card`, `site-header`）
- Astroのスコープドスタイルにより、BEM等の厳密な命名規則は不要

---

## 12. コマンドリファレンス

### 開発コマンド

```bash
npm install       # 依存関係インストール
npm run dev       # 開発サーバー起動（http://localhost:4321）
npm run build     # プロダクションビルド（dist/に出力）
npm run preview   # ビルド結果のプレビュー
```

### デプロイ

GitHub Pages へのデプロイは `.github/workflows/deploy.yml` により、`main` ブランチへのpush時に自動実行されます。

---

## 付録: クイックリファレンス

| 項目 | 規約 |
|------|------|
| インデント | スペース2つ |
| クォート | ダブルクォート `"` |
| セミコロン | 必須 |
| オブジェクト型 | `interface` を優先 |
| ユニオン型 | `type` を使用 |
| コメント言語 | 日本語 |
| 関数宣言 | `function` キーワード |
| コンポーネント | `.astro` ファイル、PascalCase |
| ページ | kebab-case |
| コンテンツ | Markdown + Content Collections |
| モジュール | ESM のみ |
| TypeScript | strict モード |

---

*最終更新: 2026-05-13*
