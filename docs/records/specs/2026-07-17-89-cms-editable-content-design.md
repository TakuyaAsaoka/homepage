# サイト文言のCMS管理化 設計書

- Issue: [#89](https://github.com/TakuyaAsaoka/homepage/issues/89)
- 作成日: 2026-07-17
- ステータス: 承認済み

## 目的

現在Sveltia CMSで編集できるのはProjects（制作物）のみで、Home・About・サイト設定の文言はすべてコードに埋め込まれている。これらをCMS管理画面から編集できるようにし、エンジニアの手を借りずにサイトの内容を更新できる状態にする。

## スコープ

### やること

- Home・About・サイト設定の文言をYAMLデータファイルに切り出し、Sveltia CMSのファイルコレクションで編集可能にする
- CMS管理画面の全フィールドに日本語ラベルと入力ヒントを付与する（既存のProjectsコレクション含む）

### やらないこと

- ページ構造（セクション構成・デザイン）のCMSからの変更 — 文言の差し替えのみを対象とする
- 新規ページのCMSからの作成 — 現在のサイト規模に対して過剰
- ブログ（note RSS連携）の仕組み変更 — RSS URLの差し替えのみ対象

## 全体像

```
Sveltia CMS 管理画面
├── Projects（既存・日本語ラベル化のみ）
├── ページ（新規ファイルコレクション）
│   ├── Home   → src/content/pages/home.yaml
│   └── About  → src/content/pages/about.yaml
└── サイト設定（新規ファイルコレクション）
    └── サイト設定 → src/content/settings/site.yaml

Astro
├── content.config.ts   … pages / settings コレクションをzodスキーマ付きで定義
├── consts.ts           … 技術的な定数のみ残す（BASE_PATH, SITE_LANG 等）
└── 各ページ・コンポーネント … getEntry() でCMS管理の値を取得
```

## データ設計

### src/content/pages/home.yaml

```yaml
hero:
  role: SOFTWARE ENGINEER / SRE      # 肩書き（英字表示）
  tagline: つくることと、動かし続けること。  # キャッチコピー
intro:
  text: 自動車業界で、つくって動かし続ける仕事をしています。
  linkLabel: わたしについて
skills:
  - TypeScript
  - React
  # ...（文字列リスト）
```

ヒーローの表示名はサイト設定の `author` を使う（現状の `SITE_AUTHOR` と同じ値のため二重管理しない）。

### src/content/pages/about.yaml

```yaml
lead: ソフトウェアエンジニア / SRE。自動車業界で、...
sections:
  - title: 歩み
    label: CAREER
    body: |
      ローコードツールによる業務のデジタル化から...
  - title: 得意なこと
    label: STRENGTHS
    body: |
      ...
  # 以下同様
```

- セクションは `{title, label, body}` のリスト。デザイン構造（見出し+英字ラベル+本文）は固定のまま、CMSからセクションの追加・削除・並び替えが可能になる
- `body` は複数段落に対応するため、空行区切りで `<p>` に分割して描画する

### src/content/settings/site.yaml

```yaml
title: ASAOKA Homepage
description: アサオカのホームページ
author: アサオカ            # Homeヒーローの表示名
copyrightHolder: ASAOKA    # フッターの著作権表記（欧文）
email: asaoka.biz@gmail.com
social:
  github: https://github.com/TakuyaAsaoka
  twitter: ""              # 空文字で非表示
  youtube: ""
noteRssUrl: https://note.com/limber_iguana638/rss  # 空文字でRSS連携無効
```

## Astro側の設計

### content.config.ts

`glob` loaderで `pages` / `settings` コレクションを定義し、zodスキーマで検証する。

- URL系フィールドは `z.url()`（空文字許容が必要なものは `z.union([z.url(), z.literal("")])`）
- `email` は `z.email()`
- 必須フィールドの欠落・形式違反はビルドエラーになり、CMSで不正な値を保存してもデプロイ前に検出できる

### consts.ts の整理

| 定数 | 扱い |
|------|------|
| `BASE_PATH` / `SITE_LANG` / `SITE_LOCALE` / `DEFAULT_OG_IMAGE` | 技術的な値のため残す |
| `SITE_TITLE` / `SITE_DESCRIPTION` / `SITE_AUTHOR` / `COPYRIGHT_HOLDER` / `EMAIL` / `SOCIAL_LINKS` / `NOTE_RSS_URL` | 削除し、`site.yaml` に移行。利用箇所は `getEntry("settings", "site")` に置換 |

### 利用箇所の置換

| ファイル | 変更内容 |
|---------|---------|
| `src/pages/index.astro` | ヒーロー・紹介文・スキルを `home.yaml` から、連絡先を `site.yaml` から取得 |
| `src/pages/about.astro` | 全文言を `about.yaml` から取得し、セクションをループ描画 |
| `src/components/BaseHead.astro` | サイト名・説明を `site.yaml` から取得 |
| `src/components/Footer.astro` | 著作権表記・SNSリンクを `site.yaml` から取得 |
| `src/pages/rss.xml.ts` | サイト名・説明を `site.yaml` から取得 |
| `src/pages/blog.astro` | note RSS URLを `site.yaml` から取得 |
| `src/components/Header.astro` | サイト名を `site.yaml` から取得 |
| `src/components/StructuredData.astro` | サイト名・表示名を `site.yaml` から取得 |

※ 実装時に `consts.ts` の各定数のimport箇所をgrepで洗い出し、上記に漏れがないか最終確認する。

### Home連絡先のGitHubリンク

現状、GitHubリンクの表示テキスト（`github.com/TakuyaAsaoka`）はURLとは別にハードコードされている。CMSでURLを変更すると表示テキストだけ古いまま残るため、**表示テキストはURLから導出する**（プロトコル部を除いた文字列を表示）。また、フッターと同様に**空文字なら行ごと非表示**にし、挙動を統一する。

## CMS設定（public/admin/config.yml）

- `files` 型コレクション「ページ」（Home / About）と「サイト設定」を追加
- 全フィールドに日本語 `label` と `hint`（入力ヒント）を付与する。例:
  - `label: "キャッチコピー"` / `hint: "ヒーローに大きく表示される一文"`
  - `label: "note RSS URL"` / `hint: "空にするとブログページのRSS連携が無効になります"`
- 既存のProjectsコレクションも同様に日本語化（`Title` → `タイトル`、`Publish Date` → `公開日` 等）
- Aboutのセクションは `list` widget + `title` / `label` / `body` のサブフィールドで定義

## エラー処理

- CMSでの入力ミス（URL・メール形式違反、必須欠落）→ zodスキーマによりビルド失敗。エラーメッセージに対象フィールドが表示される
- SNSリンク・note RSS URLの空文字 → 該当リンク・機能を非表示にする（現状の挙動を維持）
- Aboutセクション0件・スキル0件 → 表示が崩れないことを確認する（空リストは許容）

## テスト・検証

このリポジトリにテスト基盤はないため、以下を品質ゲートとする。

1. `npm run build && npm run check` の全パス
2. `npm run dev` での目視確認（Home / About / Blog / フッター / RSS）
3. YAMLに不正値（メール形式違反等）を一時的に入れ、ビルドが失敗することの確認
