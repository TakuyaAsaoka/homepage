# CMS管理画面のログイン設定（GitHub OAuth）

Sveltia CMS 管理画面（`/admin/`）で「GitHubにログイン」ボタンからログインできるようにするための手順です。非技術者でもトークンを手動発行せずにログインできるようになります。

> **どの方式を選ぶべきか**
> - **OAuth（本ドキュメント）**: ボタン1つでログイン。非技術者・第三者に渡す運用に必須。第三者へ提供・販売するならこちら。
> - **アクセストークン（PAT）**: セットアップ不要だが、ログインのたびにGitHubトークンを手動発行・貼り付けが必要。開発者本人だけが使う場合の簡易手段。→ [8. 補足: PAT方式](#8-補足-pat方式開発者本人向けの簡易ログイン)

---

## 目次

1. [前提条件](#1-前提条件)
2. [全体像と作業分担](#2-全体像と作業分担)
3. [Step 1: OAuth仲介Worker（sveltia-cms-auth）をデプロイ](#step-1-oauth仲介workersveltia-cms-authをデプロイ)
4. [Step 2: GitHub OAuth App を登録](#step-2-github-oauth-app-を登録)
5. [Step 3: Worker に環境変数を設定](#step-3-worker-に環境変数を設定)
6. [Step 4: config.yml に base_url を追記](#step-4-configyml-に-base_url-を追記)
7. [Step 5: 動作確認](#step-5-動作確認)
8. [補足: PAT方式](#8-補足-pat方式開発者本人向けの簡易ログイン)
9. [トラブルシューティング](#9-トラブルシューティング)

---

## 1. 前提条件

- **GitHubアカウント**: ログインするユーザーは、このリポジトリ（`TakuyaAsaoka/homepage`）への**書き込み権限**を持つGitHubアカウントが必要です。Sveltia CMS はGitリポジトリに直接コミットする方式のためです。
- **Cloudflareアカウント**: OAuth仲介Workerのデプロイに使います（無料枠で十分）。

> ⚠️ 「GitHubを一切使わせずに運用したい」場合は、OAuth/PATどちらでも要件を満たせません。その場合はgitベースCMS（Sveltia）の採用可否そのものを再検討する必要があります。

---

## 2. 全体像と作業分担

OAuthログインは、CMS（ブラウザ）とGitHubの間に**仲介Worker**を挟む仕組みです。Client Secret をブラウザに晒さずにOAuthフローを完結させます。

```
[ブラウザのCMS] --(1)--> [sveltia-cms-auth Worker] --(2)--> [GitHub]
      ^                          (Client Secretを保持)          |
      |________________________(3) アクセストークン発行 _________|
```

必要な設定は3か所です。

| # | 設定対象 | 何をするか | 担当 |
|---|---------|-----------|------|
| A | Cloudflare Workers | 仲介Workerをデプロイ（Step 1） | サイト管理者 |
| B | GitHub OAuth App | OAuthアプリを登録し Client ID/Secret を発行（Step 2） | サイト管理者 |
| C | `public/admin/config.yml` | `base_url` にWorker URLを追記（Step 4） | リポジトリ側（コード変更） |

> **順番が重要**: Worker URL が決まらないと OAuth App のコールバックURLも `config.yml` の `base_url` も書けません。必ず **Step 1 → 2 → 3 → 4** の順で進めてください。

---

## Step 1: OAuth仲介Worker（sveltia-cms-auth）をデプロイ

1. [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) を開く
2. README の **「Deploy to Cloudflare Workers」** ボタンからデプロイする（または手元で `wrangler deploy`）
3. デプロイ後に発行される **Worker URL** を控える
   - 形式: `https://sveltia-cms-auth.<あなたのサブドメイン>.workers.dev`

> この **Worker URL** を Step 2・Step 4 の両方で使います。

---

## Step 2: GitHub OAuth App を登録

1. GitHub → **Settings** → **Developer settings** → **OAuth Apps** → **New OAuth App** を開く
2. 以下を入力する

   | 項目 | 値 |
   |------|-----|
   | Application name | 任意（例: `ASAOKA Homepage CMS`） |
   | Homepage URL | `https://takuyaasaoka.github.io/homepage/` |
   | Authorization callback URL | **`<Worker URL>/callback`**（Step 1のURL + `/callback`） |

3. 登録後、**Client ID** を控える
4. **「Generate a new client secret」** で **Client Secret** を発行し、控える（画面を離れると二度と表示されないので注意）

> ⚠️ **Client Secret はリポジトリに絶対に含めないでください**。次のStep 3でCloudflare側にのみ設定します。

---

## Step 3: Worker に環境変数を設定

Cloudflare ダッシュボード → 対象Worker → **Settings** → **Variables** で以下を追加します。

| 変数名 | 値 | 備考 |
|--------|-----|------|
| `GITHUB_CLIENT_ID` | Step 2 の Client ID | |
| `GITHUB_CLIENT_SECRET` | Step 2 の Client Secret | **Encrypt（暗号化）を推奨** |
| `ALLOWED_DOMAINS` | `takuyaasaoka.github.io` | このドメインからのみOAuthを許可。複数はカンマ区切り |

設定後、Workerを再デプロイ（保存で自動反映される場合もあり）します。

---

## Step 4: config.yml に base_url を追記

ここはリポジトリのコード変更です。`public/admin/config.yml` の `backend` に `base_url` を1行追加します。

```yaml
backend:
  name: github
  repo: "TakuyaAsaoka/homepage"
  branch: main
  base_url: "https://sveltia-cms-auth.<あなたのサブドメイン>.workers.dev"  # ← Step 1 のWorker URL
```

変更をコミットして `main` にマージすると、GitHub Actions で本番へ自動デプロイされます。

> Worker URL が確定してから実施してください。開発担当（Claude等）に依頼する場合は、**Worker URLだけ**を伝えれば足ります（Client Secret は渡さない）。

---

## Step 5: 動作確認

1. デプロイ反映後、`https://takuyaasaoka.github.io/homepage/admin/` を開く
2. **「GitHubにログイン」** ボタンを押す
3. GitHubの認可画面に遷移 → 認可する
4. CMSに戻り、コレクション（Projects等）の編集画面が表示されればOK

---

## 8. 補足: PAT方式（開発者本人向けの簡易ログイン）

OAuthをセットアップせずに、今すぐログインしたい場合の方法です。**開発者本人だけが使う場合に限り**推奨します。

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** でトークンを発行する
   - このリポジトリへの**リポジトリ書き込み権限**を付与する
2. 管理画面で **「アクセストークンを使用してログイン」** を押す
3. 発行したトークンを貼り付ける

> トークンはブラウザのローカルストレージに保存されます。有効期限が切れたら再発行が必要です。第三者に渡す運用には向きません。

---

## 9. トラブルシューティング

| 症状 | 原因・対処 |
|------|-----------|
| 「設定に問題が見つかりました」「レポジトリが正しくありません」 | `config.yml` の `repo` が空、または `owner/repo` 形式でない。`TakuyaAsaoka/homepage` になっているか確認 |
| 「GitHubにログイン」を押しても認可画面に進まない/エラー | `base_url` が未設定、またはWorker URLが誤り。Step 1 のURLと一致しているか確認 |
| 認可後に「redirect_uri mismatch」等のエラー | OAuth App のコールバックURLが `<Worker URL>/callback` と一致していない（Step 2） |
| 認可後もログインできない/拒否される | Worker の `ALLOWED_DOMAINS` にアクセス元ドメインが含まれているか確認（Step 3） |
| favicon がサイトのものと違う（オレンジのロゴ） | 仕様です。Sveltia CMS は `/admin/` で自身のロゴをfaviconとして注入するため、サイトのfaviconは上書きされます |

---

## 参考リンク

- [sveltia-cms-auth（OAuth仲介Worker）](https://github.com/sveltia/sveltia-cms-auth)
- [Sveltia CMS 公式: GitHub Backend](https://sveltiacms.app/en/docs/backends/github)
