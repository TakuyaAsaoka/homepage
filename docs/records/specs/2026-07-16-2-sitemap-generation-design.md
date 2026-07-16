# サイトマップ自動生成の導入 設計ドキュメント

- Issue: #2
- 作成日: 2026-07-16
- ステータス: 承認済み

## 目的

検索エンジンがサイトの全公開ページを効率的にクロール・インデックスできるよう、ビルド時にサイトマップ（`sitemap-index.xml`）を自動生成する。

## 背景

- `astro.config.mjs` には `site: "https://TakuyaAsaoka.github.io"` と `base: "/homepage"` が設定済み。
- draftプロジェクト（`draft: true`）は `src/pages/projects/[...slug].astro` の `getStaticPaths` で除外済みのため、そもそもビルドされない。
- `robots.txt` は存在しない。

## 採用アプローチ

`@astrojs/sitemap` 公式インテグレーションを導入する。

| 検討した案 | 判断 |
|-----------|------|
| A. `@astrojs/sitemap` 公式インテグレーション | **採用**。config 1行でビルド済み全ルートから自動生成。保守コストほぼゼロ |
| B. 自作エンドポイント（`rss.xml.ts` 方式） | 不採用。ページ追加のたびに更新漏れリスクがあり、自作する理由がない |

## 設計

1. **依存追加**: `npm install @astrojs/sitemap`
2. **`astro.config.mjs`**: `integrations: [sitemap()]` を追加
3. **draft除外**: 追加実装不要。サイトマップはビルド済みルートから生成されるため、ビルドされないdraftページは自動的に除外される
4. **404ページ**: ビルド後の `sitemap-0.xml` を確認し、`/404/` が含まれる場合のみ `filter` オプションで除外する

## スコープ外: robots.txt

Issueのシナリオには「robots.txtからのサイトマップ参照」があるが、**今回は実装しない**。

- **理由**: robots.txtの仕様上、クローラーはドメインルート（`https://TakuyaAsaoka.github.io/robots.txt`）しか読まない。本サイトはプロジェクトページ（`/homepage/` 配下）のため、このリポジトリの `public/robots.txt` は `/homepage/robots.txt` に配置され、クローラーに無視される。
- **代替運用**: サイトマップURL（`https://TakuyaAsaoka.github.io/homepage/sitemap-index.xml`）を Google Search Console に直接登録して検索エンジンに伝える。

## 検証方法

1. `npm run build` が成功し、`dist/sitemap-index.xml` が生成される
2. サイトマップに全公開ページ（Home / About / Blog / Projects一覧 / プロジェクト詳細）のURLが含まれる
3. draftプロジェクトのURLが含まれない
4. `/404/` のURLが含まれない
5. `npm run check` がパスする
