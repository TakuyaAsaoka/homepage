# ASAOKA Homepage

アサオカのホームページです。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | [Astro](https://astro.build) v6 |
| CMS | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) |
| 言語 | TypeScript（strict モード） |
| デプロイ | GitHub Pages + GitHub Actions |
| Node.js | >= 22.12.0 |

## プロジェクト構成

```text
/
├── .github/workflows/      # GitHub Actions（自動デプロイ）
├── docs/                   # ドキュメント
├── public/
│   ├── admin/              # Sveltia CMS 管理画面
│   │   └── config.yml      # CMS設定
│   ├── images/             # 画像ファイル
│   └── favicon.svg
├── src/
│   ├── components/         # 再利用可能なコンポーネント
│   ├── content/            # コンテンツコレクション（Markdown）
│   ├── layouts/            # ページレイアウト
│   ├── pages/              # ページ（ファイルベースルーティング）
│   ├── styles/             # グローバルスタイル
│   ├── consts.ts           # サイト定数
│   └── content.config.ts   # コンテンツスキーマ定義
├── .gitignore
├── astro.config.mjs        # Astro設定
├── CLAUDE.md               # AI開発ルール
├── package.json
└── tsconfig.json           # TypeScript設定
```

## ページ構成

| ページ | パス | 説明 |
|-------|------|------|
| ホーム | `/` | トップページ |
| About | `/about` | 自己紹介 |
| Blog | `/blog` | ブログ記事一覧 |
| Projects | `/projects` | プロジェクト一覧・詳細 |

## コマンド

```bash
npm install       # 依存関係のインストール
npm run dev       # 開発サーバーを起動（localhost:4321）
npm run build     # プロダクションビルド（./dist/ に出力）
npm run preview   # ビルド結果をローカルでプレビュー
```

## デプロイ

`main` ブランチにpushすると、GitHub Actions により自動的に GitHub Pages へデプロイされます。

### 独自ドメイン・SSL化

独自ドメインの設定とHTTPS化の手順は [`docs/custom-domain-ssl.md`](docs/custom-domain-ssl.md) を参照してください。

### 検索エンジンへのサイトマップ登録

Google Search Console への登録手順と robots.txt を置かない理由は [`docs/search-console.md`](docs/search-console.md) を参照してください。

## CMS（管理画面）

コンテンツは管理画面 `/admin/`（[Sveltia CMS](https://github.com/sveltia/sveltia-cms)）から編集できます。

### ログイン設定（GitHub OAuth）

「GitHubにログイン」ボタンでログインできるようにする手順（OAuth仲介Workerのデプロイ、GitHub OAuth App登録、`config.yml` 設定）は [`docs/cms-oauth-setup.md`](docs/cms-oauth-setup.md) を参照してください。開発者本人向けのアクセストークン（PAT）方式も同ドキュメントに記載しています。
