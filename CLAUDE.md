# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際のAIコーディングエージェント向けガイダンスを提供します。

> **Note**: 開発プロセス、ローカライゼーション、コミットメッセージ、テストケース記述ルール等の共通ルールは `~/.claude/CLAUDE.md`（[claude-shared-config](https://github.com/TakuyaAsaoka/claude-shared-config)）で管理されています。

## プロジェクト概要

ASAOKA Homepage — アサオカの個人ホームページ。Astro + Sveltia CMS で構築し、GitHub Pages にデプロイ。

## ディレクトリ構成

```
homepage/
├── .github/workflows/      # GitHub Actions（自動デプロイ）
├── docs/                   # ドキュメント
├── public/
│   ├── admin/              # Sveltia CMS 管理画面
│   ├── images/             # 画像ファイル
│   └── favicon.svg
├── src/
│   ├── components/         # 再利用可能なAstroコンポーネント
│   ├── content/            # コンテンツコレクション（Markdown）
│   ├── layouts/            # ページレイアウト
│   ├── pages/              # ページ（ファイルベースルーティング）
│   ├── styles/             # グローバルスタイル
│   ├── consts.ts           # サイト定数
│   └── content.config.ts   # コンテンツスキーマ定義
├── astro.config.mjs        # Astro設定
└── tsconfig.json           # TypeScript設定（astro/tsconfigs/strict 継承）
```

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Astro v6 |
| CMS | Sveltia CMS |
| 言語 | TypeScript（strict モード） |
| デプロイ | GitHub Pages + GitHub Actions |
| Node.js | >= 22.12.0 |

## 共通コマンド

```bash
# 開発
npm run dev           # 開発サーバー（localhost:4321）
npm run build         # プロダクションビルド
npm run preview       # ビルド結果のプレビュー
```

## プロジェクト固有のルール

- コーディング規約は [`docs/coding-standards.md`](docs/coding-standards.md) を参照
- コンテンツは `src/content/` 配下にMarkdownで管理し、スキーマは `content.config.ts` で定義
- Astroコンポーネントのフロントマターはインポート → Props型定義 → ロジックの順で記述
