# JSON-LD 構造化データ 実装計画（Issue #13）

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 各ページの `<head>` に JSON-LD 構造化データ（WebSite / BreadcrumbList / Article）を `@graph` 1本として出力する。

**Architecture:** JSON-LD の唯一の出力点として `StructuredData.astro` を新設し、`BaseHead.astro` 内で描画する。各ページ → `BaseLayout` → `BaseHead` → `StructuredData` の一方向にデータ（`breadcrumb` / `article`）を中継する。パンくずデータは Issue #15 の既存 `BreadcrumbItem[]` をそのまま再利用し、階層を組み立て直さない。

**Tech Stack:** Astro v6（静的生成）、TypeScript strict、schema.org（JSON-LD）

**Spec:** `docs/records/specs/2026-07-17-13-json-ld-structured-data-design.md`（唯一の設計の真実。逸脱禁止）

---

## 前提知識（実装者向け）

### このプロジェクトの検証方法（TDD の読み替え）

このプロジェクトは npm 管理で、**テストランナー / lint スクリプトが存在しない**（scripts: dev / build / preview / check / astro のみ）。そのため本計画では**テストコードは書かない**。TDD の「テストを書く → 失敗確認 → 実装 → 成功確認」のサイクルは、以下に読み替える:

1. 実装する
2. `npm run check`（astro check = 型チェック）でエラー・warning 0 件を確認する
3. 最終タスクで `npm run build` + `dist/` 生成 HTML の目視確認を行う

### URL 生成規約（spec 6章・全タスク共通の必須ルール）

- `import.meta.env.BASE_URL` の直接文字列連結は**禁止**。`src/consts.ts` の `BASE_PATH`（末尾スラッシュ保証済み。本番では `/homepage/`）を使う。
- `Astro.site` は `astro.config.mjs` で `https://takuyaasaoka.github.io` に設定済みだが、**オリジンのみ**を持つ。真のサイトルートは `BASE_PATH` との合成で得る。
- `Astro.site` 未設定時のフォールバックは、既存 `BaseHead.astro` の三項演算子パターン（`Astro.site ? new URL(...) : <相対のまま>`）に倣う。

| URL | 生成式 | 本番での値の例 |
|-----|--------|---------------|
| サイトルート絶対URL | `new URL(BASE_PATH, Astro.site).href` | `https://takuyaasaoka.github.io/homepage/` |
| canonical URL | `new URL(Astro.url.pathname, Astro.site).href` | `https://takuyaasaoka.github.io/homepage/projects/homepage/` |
| パンくず各項目URL | `new URL(item.href, Astro.site).href` | `item.href` は既に `/homepage/...`（BASE_PATH 込み）を含む |

### image パスの前提

`content.config.ts` の `image` は `z.string().optional()`（パス文字列）。Sveltia CMS の設定（`public/admin/config.yml` の `public_folder: "/homepage/images"`）により、保存されるパスは **BASE_PATH 込み**（例: `/homepage/images/foo.png`）である。したがって `new URL(article.image, Astro.site).href` の合成だけで絶対URLになる（既存 `BaseHead.astro` の `resolvedImage` → `ogImage` と同流儀。ただしデフォルト画像へのフォールバックはせず、**存在時のみ** Article に含める）。

### コーディング規約（`docs/coding-standards.md`）

- Astro フロントマターは「インポート → Props 型定義 → ロジック」の順。
- コメントは日本語。
- `BreadcrumbItem` 型（`{ label: string; href?: string }`）は既存 `src/components/Breadcrumb.astro` が export しているものを import して再利用する。**重複定義しない**。

### 変更ファイル全体像（依存順）

```
1. src/components/StructuredData.astro   （新設・ArticleData 型を export）
        ▲ import
2. src/components/BaseHead.astro         （breadcrumb?/article? を受けて StructuredData へ）
        ▲ import
3. src/layouts/BaseLayout.astro          （article? を追加し breadcrumb と共に中継）
        ▲ 利用
4. src/pages/projects/[...slug].astro    （article を渡す）
```

about / blog / projects一覧 / index（Home）の各ページは**変更不要**（既存の `breadcrumb` プロップがそのまま流れる。Home は breadcrumb を渡していないので WebSite のみ出力される）。

---

### Task 1: StructuredData.astro（JSON-LD の唯一の出力点）を新設する

**Files:**
- Create: `src/components/StructuredData.astro`

- [ ] **Step 1: コンポーネントを新規作成する**

以下の内容で `src/components/StructuredData.astro` を作成する（フロントマターは「インポート → Props 型定義 → ロジック」の順）:

```astro
---
import { SITE_TITLE, SITE_AUTHOR, BASE_PATH } from "../consts";
import type { BreadcrumbItem } from "./Breadcrumb.astro";

// Article ノードの生成に必要なページ固有データ。
// headline / description は Props の title / description を再利用するため持たない（重複回避）
export interface ArticleData {
  datePublished: Date;
  keywords: string[];
  image?: string;
}

interface Props {
  title: string;
  description: string;
  // Home を除くパンくず階層（Breadcrumb.astro と同じデータ）。省略時は BreadcrumbList を出力しない
  breadcrumb?: BreadcrumbItem[];
  // 記事情報。省略時は Article を出力しない
  article?: ArticleData;
}

const { title, description, breadcrumb, article } = Astro.props;

// URL 生成規約: import.meta.env.BASE_URL の直接連結は禁止（src/consts.ts 参照）。
// Astro.site はオリジンのみを持つため、サイトルートは BASE_PATH と合成して得る。
// Astro.site 未設定時は相対パスのままフォールバックする（既存 BaseHead と同流儀）
const siteRootURL = Astro.site ? new URL(BASE_PATH, Astro.site).href : BASE_PATH;
const canonicalURL = (Astro.site ? new URL(Astro.url.pathname, Astro.site) : Astro.url).href;

// WebSite ノード（全ページ共通）
const graph: Record<string, unknown>[] = [
  {
    "@type": "WebSite",
    name: SITE_TITLE,
    url: siteRootURL,
  },
];

// BreadcrumbList ノード（breadcrumb があるページのみ）。
// 視覚的パンくず（Breadcrumb.astro）と同様に先頭へ Home を付与し、同じ階層データから機械可読版を生成する
if (breadcrumb) {
  const allItems: BreadcrumbItem[] = [{ label: "Home", href: BASE_PATH }, ...breadcrumb];
  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: allItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      // href 無し（末尾 = 現在ページ）は canonical URL を用いる
      item: item.href
        ? Astro.site
          ? new URL(item.href, Astro.site).href
          : item.href
        : canonicalURL,
    })),
  });
}

// Article ノード（article があるページのみ）
if (article) {
  // image は CMS が BASE_PATH 込みのパス（例: /homepage/images/foo.png）で保存するため、
  // Astro.site との合成だけで絶対URLになる（既存 BaseHead の resolvedImage → ogImage と同流儀）
  const articleImage = article.image
    ? Astro.site
      ? new URL(article.image, Astro.site).href
      : article.image
    : undefined;
  graph.push({
    "@type": "Article",
    headline: title,
    description: description,
    datePublished: article.datePublished.toISOString(),
    keywords: article.keywords,
    author: {
      "@type": "Person",
      name: SITE_AUTHOR,
    },
    mainEntityOfPage: canonicalURL,
    // image は存在時のみ含める
    ...(articleImage ? { image: articleImage } : {}),
  });
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": graph,
};
---

<!-- JSON-LD の唯一の出力点。他のコンポーネント・ページで application/ld+json を出力してはならない -->
<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

実装上の要点:
- `<script type="application/ld+json">` の出力は **`set:html={JSON.stringify(jsonLd)}` を使う**。Astro の `<script>` はデフォルトでバンドル処理されるが、`type="application/ld+json"` かつ `set:html` 指定ならデータブロックとしてそのまま出力される。
- `@graph` は必ず1本。ノードの有無は `breadcrumb` / `article` の有無で決まる（WebSite は常時）。
- `keywords` は文字列配列のまま出力する（schema.org は配列を許容）。

- [ ] **Step 2: 型チェックを実行して通ることを確認する**

Run: `npm run check`
Expected: `0 errors, 0 warnings`（この時点では未使用コンポーネントだが、単体で型エラーが無いことを確認する）

- [ ] **Step 3: コミット**

```bash
git add src/components/StructuredData.astro
git commit -m "feat: JSON-LD構造化データ出力コンポーネントを追加する (#13)"
```

---

### Task 2: BaseHead.astro が breadcrumb / article を受けて StructuredData を描画する

**Files:**
- Modify: `src/components/BaseHead.astro`

- [ ] **Step 1: インポートと Props を追加する**

フロントマター先頭のインポート部（`import { SITE_TITLE, ... } from "../consts";` の下）に追加:

```typescript
import StructuredData, { type ArticleData } from "./StructuredData.astro";
import type { BreadcrumbItem } from "./Breadcrumb.astro";
```

`interface Props` に2フィールドを追加し、分割代入にも加える:

```typescript
interface Props {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  // JSON-LD（BreadcrumbList）用のパンくず階層。省略可
  breadcrumb?: BreadcrumbItem[];
  // JSON-LD（Article）用の記事情報。省略可
  article?: ArticleData;
}

const { title, description, image, noindex, breadcrumb, article } = Astro.props;
```

- [ ] **Step 2: テンプレート末尾に StructuredData を描画する**

`BaseHead.astro` テンプレートの末尾（Twitter メタタグブロックの後）に追加:

```astro
<!-- 構造化データ（JSON-LD） -->
<StructuredData title={title} description={description} breadcrumb={breadcrumb} article={article} />
```

- [ ] **Step 3: 型チェックを実行して通ることを確認する**

Run: `npm run check`
Expected: `0 errors, 0 warnings`

- [ ] **Step 4: コミット**

```bash
git add src/components/BaseHead.astro
git commit -m "feat: BaseHeadからJSON-LD構造化データを出力する (#13)"
```

---

### Task 3: BaseLayout.astro が article を受けて BaseHead へ中継する

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: インポートと Props を追加する**

インポート部に追加（既存の `Breadcrumb` インポートの下）:

```typescript
import { type ArticleData } from "../components/StructuredData.astro";
```

`interface Props` に `article?` を追加し、分割代入にも加える:

```typescript
interface Props {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  // Home を除くパンくず階層。省略時はパンくず非表示（Home・404 は渡さない）
  breadcrumb?: BreadcrumbItem[];
  // JSON-LD（Article）用の記事情報。プロジェクト詳細ページのみ渡す
  article?: ArticleData;
}

const { title, description, image, noindex, breadcrumb, article } = Astro.props;
```

- [ ] **Step 2: BaseHead へ breadcrumb / article を中継する**

`<head>` 内の `<BaseHead ... />` を以下に変更する（`breadcrumb` は視覚的パンくずと JSON-LD の両方に同じデータが流れる）:

```astro
<BaseHead
  title={title}
  description={description}
  image={image}
  noindex={noindex}
  breadcrumb={breadcrumb}
  article={article}
/>
```

`<body>` 側の `{breadcrumb && <Breadcrumb items={breadcrumb} />}` は**変更しない**。

- [ ] **Step 3: 型チェックを実行して通ることを確認する**

Run: `npm run check`
Expected: `0 errors, 0 warnings`

- [ ] **Step 4: コミット**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: BaseLayoutにarticleプロップを追加しBaseHeadへ中継する (#13)"
```

---

### Task 4: プロジェクト詳細ページが article を渡す

**Files:**
- Modify: `src/pages/projects/[...slug].astro`

- [ ] **Step 1: BaseLayout に article プロップを追加する**

`<BaseLayout ...>` の属性に `article` を追加する（既存の `breadcrumb` はそのまま）:

```astro
<BaseLayout
  title={project.data.title}
  description={project.data.description}
  breadcrumb={[
    { label: "Projects", href: `${BASE_PATH}projects/` },
    { label: project.data.title },
  ]}
  article={{
    datePublished: project.data.pubDate,
    keywords: project.data.tags,
    image: project.data.image,
  }}
>
```

補足: `project.data.pubDate` は `z.coerce.date()` により `Date` 型、`tags` は `default([])` により常に `string[]`、`image` は `string | undefined` — いずれも `ArticleData` の型と一致する。

他ページ（`about.astro` / `blog.astro` / `projects/index.astro` / `index.astro`）は**変更しない**。

- [ ] **Step 2: 型チェックを実行して通ることを確認する**

Run: `npm run check`
Expected: `0 errors, 0 warnings`

- [ ] **Step 3: コミット**

```bash
git add "src/pages/projects/[...slug].astro"
git commit -m "feat: プロジェクト詳細ページにArticle構造化データを出力する (#13)"
```

---

### Task 5: 品質ゲート（build + check + dist 目視確認）

このプロジェクトの**唯一の品質ゲート**。GitHub Actions の CI は無効化されているため、ここでの全パスがマージ前の最終チェックになる。

- [ ] **Step 1: ビルドと型チェックを実行する**

Run: `npm run build && npm run check`
Expected: 両方成功。**エラー 0 件・warning 0 件**（既存の warning があっても修正する）

- [ ] **Step 2: 生成 HTML の JSON-LD をページ種別ごとに目視確認する**

まず全ページに JSON-LD が1本ずつ出力されていることを確認:

```bash
grep -rl 'application/ld+json' dist --include='*.html'
```

Expected: `dist/index.html`、`dist/about/index.html`、`dist/blog/index.html`、`dist/projects/index.html`、`dist/projects/<slug>/index.html` が列挙される（`dist/404.html` は BaseLayout を使っていれば含まれるが、breadcrumb を渡していないため WebSite のみで問題ない）。

次に代表3ページの JSON-LD 本体を抽出して内容を確認する（`python3 -m json.tool` で整形すると読みやすい。例）:

```bash
# トップページ
grep -o '<script type="application/ld+json">[^<]*</script>' dist/index.html \
  | sed -e 's/<[^>]*>//g' | python3 -m json.tool

# 下層ページ（about）
grep -o '<script type="application/ld+json">[^<]*</script>' dist/about/index.html \
  | sed -e 's/<[^>]*>//g' | python3 -m json.tool

# プロジェクト詳細（slug は dist/projects/ 配下の実在ディレクトリ名に置き換える。例: homepage）
grep -o '<script type="application/ld+json">[^<]*</script>' dist/projects/homepage/index.html \
  | sed -e 's/<[^>]*>//g' | python3 -m json.tool
```

確認観点チェックリスト:

| ページ | `@graph` に含まれるノード |
|--------|--------------------------|
| トップ（`dist/index.html`） | WebSite のみ |
| 下層（about / blog / projects 一覧） | WebSite + BreadcrumbList |
| プロジェクト詳細 | WebSite + BreadcrumbList + Article |

補足: 現時点で `src/content/projects/` のどのプロジェクトも `image:` frontmatter を持たないため、Article の `image` ブランチは dist で観測されない（`image` フィールドが無いのは想定どおりで、探し回らないこと）。`image` の絶対URL化を実地確認したい場合のみ、いずれかのプロジェクトに一時的に `image:` を追加して検証し、確認後に戻す。

内容の妥当性:
- [ ] `@context` が `https://schema.org`、JSON-LD の `<script>` がページに**1本だけ**ある
- [ ] WebSite: `name` = `ASAOKA Homepage`、`url` = `https://takuyaasaoka.github.io/homepage/`（**絶対URL**）
- [ ] BreadcrumbList: 先頭が Home（position 1）、各 `item` が `https://takuyaasaoka.github.io/homepage/...` の**絶対URL**、末尾（現在ページ）の `item` が当該ページの canonical URL と一致
- [ ] Article: `headline` / `description` がページの `<title>` / `<meta name="description">` と一致、`datePublished` が **ISO 8601 文字列**（例: `2025-01-01T00:00:00.000Z`）、`keywords` が**文字列配列**、`author.name` = `アサオカ`、`mainEntityOfPage` = canonical URL、`image` は frontmatter に image があるプロジェクトのみ絶対URLで出現

- [ ] **Step 3: 確認結果に問題があれば修正して Step 1 からやり直す**

修正した場合は該当ファイルをコミットしてから再検証する。

- [ ] **Step 4: 最終確認のコミット状態を確認する**

```bash
git status
```

Expected: `nothing to commit, working tree clean`（Task 1〜4 で全変更がコミット済み）

---

## 受け入れ条件との対応（spec 8章）

| 受け入れ条件 | 対応タスク |
|--------------|-----------|
| JSON-LD スクリプトタグが専用コンポーネントで出力される | Task 1, 2 |
| トップページに WebSite スキーマ（name, url） | Task 1（常時出力）+ Task 5 で確認 |
| プロジェクト詳細に Article（headline, description, datePublished, keywords + author / image / mainEntityOfPage） | Task 1, 4 + Task 5 で確認 |
| `Astro.site` と `BASE_PATH` で正しい URL が生成される | Task 1（URL 生成規約）+ Task 5 で確認 |
| JSON-LD の内容がページのメタ情報と一致 | Task 5 Step 2 チェックリスト |
| `npm run build` / `npm run check` が通る | 各タスク + Task 5 |
