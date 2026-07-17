# JSON-LD 構造化データ設計（Issue #13）

## 1. 概要 / 目的

各ページの `<head>` に検索エンジン向けの JSON-LD 構造化データ（`<script type="application/ld+json">`）を1本追加する。

- **平易に言うと**: Google に「このサイトの名前」「ページの階層（パンくず）」「記事の情報」を機械可読な形で伝え、検索結果のリッチリザルト（サイト名表示・パンくず表示・記事情報）に反映されやすくする。**画面の見た目は一切変わらない**。
- Issue #15 で実装済みの視覚的パンくずUIの「機械可読版」を、同じデータ（`BreadcrumbItem[]`）から生成する。

## 2. スコープ

| 区分 | 内容 |
|------|------|
| 含む | WebSite / Article スキーマ（Issue #13 の受け入れ条件） |
| 含む | BreadcrumbList スキーマ（JSON-LD の管轄を #13 に一元化する決定。#15 コメント参照） |
| 含む | JSON-LD 出力の一元化（出力箇所を分裂させず、1コンポーネントに集約） |
| 含まない | SearchAction / dateModified 等（後述の「対象外」参照） |

## 3. アーキテクチャとデータフロー

```
各ページ (about/blog/projects/index/projects/[...slug])
   │  breadcrumb?, article? を BaseLayout に渡す
   ▼
BaseLayout.astro ── breadcrumb, article, title, description を BaseHead に中継
   ▼
BaseHead.astro (<head>内) ── <StructuredData .../> を描画
   ▼
StructuredData.astro (新設・JSON-LDの唯一の出力点)
   └─ <script type="application/ld+json"> に @graph を1本出力
```

- JSON-LD の出力点は `StructuredData.astro` のみ。他のコンポーネント・ページで `application/ld+json` を出力してはならない。
- パンくずデータは既存の `breadcrumb` プロップ（`BreadcrumbItem[]`）をそのまま流用する。新たに階層を組み立て直さない。

## 4. コンポーネント設計

### 4.1 `src/components/StructuredData.astro`（新設）

JSON-LD の**唯一の出力点**。

- **Props**: `title: string`, `description: string`, `breadcrumb?: BreadcrumbItem[]`, `article?: ArticleData`
- `@graph` 配列を組み立て、1つの `<script type="application/ld+json" set:html={JSON.stringify(graph)} />` で出力する。
- **export する型**:

```typescript
// headline/description は title/description を再利用するため持たない（重複回避）
export interface ArticleData {
  datePublished: Date;
  keywords: string[];
  image?: string;
}
```

- `@graph` に含めるノード:

| ノード | 条件 | 内容 |
|--------|------|------|
| WebSite | 常に含める | `name: SITE_TITLE`, `url: <サイトルート絶対URL>` |
| BreadcrumbList | `breadcrumb` があるとき | `Breadcrumb.astro` と同様に先頭へ Home（`href = BASE_PATH`）を付与し、`itemListElement` を position 1..n で構築 |
| Article | `article` があるとき | 詳細は「5. JSON-LD スキーマ仕様」参照 |

### 4.2 `src/components/BaseHead.astro`（変更）

- Props に `breadcrumb?: BreadcrumbItem[]`, `article?: ArticleData` を追加し、`<StructuredData>` に渡す。

### 4.3 `src/layouts/BaseLayout.astro`（変更）

- Props に `article?: ArticleData` を追加。既存の `breadcrumb` と共に `BaseHead` へ中継する。

### 4.4 `src/pages/projects/[...slug].astro`（変更）

- 既存の `breadcrumb` に加え、以下を渡す:

```astro
article={{
  datePublished: project.data.pubDate,
  keywords: project.data.tags,
  image: project.data.image,
}}
```

### 4.5 その他のページ（変更不要）

- about / blog / projects（一覧）: 既存の `breadcrumb` プロップがそのまま BreadcrumbList に反映される。追加変更は不要。
- `index.astro`（Home）: breadcrumb を渡さない（既存どおり）→ WebSite のみ出力。受け入れ条件「トップページに WebSite」を満たす。

## 5. JSON-LD スキーマ仕様

### 5.1 WebSite（全ページ）

| フィールド | 生成元 |
|-----------|--------|
| `name` | `SITE_TITLE`（`src/consts.ts`） |
| `url` | サイトルート絶対URL（`https://takuyaasaoka.github.io/homepage/`） |

### 5.2 BreadcrumbList（`breadcrumb` があるページ）

| フィールド | 生成元 |
|-----------|--------|
| `itemListElement[]` | 先頭に Home を付与した `BreadcrumbItem[]` から position 1..n で構築 |
| 各 `item`（URL） | `item.href` を絶対URL化。末尾（現在ページ・`href` 無し）は canonical URL を用いる |

- `BreadcrumbItem`（`{ label: string; href?: string }`）は既存 `Breadcrumb.astro` の export を再利用する。

### 5.3 Article（プロジェクト詳細ページ）

| フィールド | 生成元 |
|-----------|--------|
| `headline` | `title`（Props を再利用） |
| `description` | `description`（Props を再利用） |
| `datePublished` | `article.datePublished` の ISO 文字列 |
| `keywords` | `article.keywords`（タグ配列） |
| `author` | Person（`name: SITE_AUTHOR` = 「アサオカ」） |
| `image` | `article.image` 存在時のみ絶対URL化して出力 |
| `mainEntityOfPage` | canonical URL |

## 6. URL生成規約（必須）

- `import.meta.env.BASE_URL` の直接文字列連結は**禁止**。URLは `src/consts.ts` の `BASE_PATH` 定数から組み立てる。
- サイト絶対URLは `Astro.site`（`astro.config.mjs` で `https://takuyaasaoka.github.io`・`base: "/homepage"` に設定済み）を用いる。

| URL | 生成式 | 例 |
|-----|--------|-----|
| サイトルート絶対URL | `new URL(BASE_PATH, Astro.site).href` | `https://takuyaasaoka.github.io/homepage/` |
| canonical URL | `new URL(Astro.url.pathname, Astro.site).href` | BaseHead 既存の `canonicalURL` と同流儀 |
| BreadcrumbList 各項目URL | `new URL(item.href, Astro.site).href` | `item.href` は既に `/homepage/...` を含む |

- **注意**: `Astro.site` はオリジンのみなので、真のサイトルートは `BASE_PATH` と合成して得る。
- `Astro.site` が未設定の場合のフォールバックも、既存 BaseHead（`Astro.site ? ... : ...`）に倣い考慮する。

## 7. コーディング規約

- Astroコンポーネントのフロントマターは「インポート → Props型定義 → ロジック」の順（`docs/coding-standards.md`）。
- コメントは日本語。
- パンくず階層を新たに組み立て直さず、既存 `BreadcrumbItem` を再利用する。

## 8. 受け入れ条件（Issue #13）

- [ ] `BaseHead.astro` または専用コンポーネントで JSON-LD スクリプトタグが出力される
- [ ] トップページに WebSite スキーマ（name, url）
- [ ] プロジェクト詳細ページに Article スキーマ（headline, description, datePublished, keywords）＋今回は author / image / mainEntityOfPage も付与
- [ ] `Astro.site` と `BASE_PATH` で正しいURLが生成される
- [ ] JSON-LD の内容がページのメタ情報と一致
- [ ] `npm run build` が成功する（＋ `npm run check` の型チェックも通る）

## 9. 検証手順（品質ゲート）

このプロジェクトは npm 管理で、テスト / lint のスクリプトは無い（scripts: dev / build / preview / check / astro）。

1. `npm run build && npm run check` を実行し、全パスを確認する（warning も 0 件にする）。
2. ビルド出力 `dist/` の生成HTMLに JSON-LD が期待どおり埋め込まれていることを目視確認する（トップ = WebSite のみ、下層 = WebSite + BreadcrumbList、プロジェクト詳細 = WebSite + BreadcrumbList + Article）。

## 10. 対象外（YAGNI）

| 項目 | 理由 |
|------|------|
| WebSite の SearchAction | サイト内検索が無いため不要 |
| dateModified | 更新日データが無い |
| DBスキーマ・実行時エラーハンドリング | 静的生成・外部入力なしのため不要 |

## 11. 関連

- Issue #13（JSON-LD 構造化データ・本spec）
- Issue #15（視覚的パンくずUI・実装済み。JSON-LD の管轄は #13 に一元化）
- `docs/coding-standards.md`
