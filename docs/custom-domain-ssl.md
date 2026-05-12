# 独自ドメインの設定とSSL化

GitHub Pages で独自ドメインを使用し、HTTPS（SSL）で公開するための手順です。
ドメインの取得先はお名前.comを例に説明します。

---

## 目次

1. [前提条件](#1-前提条件)
2. [お名前.comでドメインを取得](#2-お名前comでドメインを取得)
3. [DNSレコードの設定](#3-dnsレコードの設定)
4. [GitHub Pages で独自ドメインを設定](#4-github-pages-で独自ドメインを設定)
5. [SSL（HTTPS）の有効化](#5-sslhttpsの有効化)
6. [Astro設定の更新](#6-astro設定の更新)
7. [確認とトラブルシューティング](#7-確認とトラブルシューティング)

---

## 1. 前提条件

- GitHub Pages へのデプロイが完了していること
- お名前.comのアカウントを持っていること
- 使用したいドメインを取得済み、または取得予定であること

---

## 2. お名前.comでドメインを取得

1. [お名前.com](https://www.onamae.com/) にログイン
2. 希望のドメイン名を検索（例: `example.com`）
3. ドメインを選択して購入手続きを完了

---

## 3. DNSレコードの設定

お名前.comの管理画面でDNSレコードを設定します。

### Apex ドメイン（`example.com`）の場合

1. お名前.com Navi にログイン
2. 「ドメイン設定」→「DNS設定/転送設定」→ 対象ドメインを選択
3. 「DNSレコード設定を利用する」を選択
4. 以下の **Aレコード** を4つ追加する

| ホスト名 | TYPE | VALUE | TTL |
|---------|------|-------|-----|
| （空欄） | A | 185.199.108.153 | 3600 |
| （空欄） | A | 185.199.109.153 | 3600 |
| （空欄） | A | 185.199.110.153 | 3600 |
| （空欄） | A | 185.199.111.153 | 3600 |

5. `www` サブドメインからのリダイレクト用に **CNAMEレコード** も追加

| ホスト名 | TYPE | VALUE | TTL |
|---------|------|-------|-----|
| www | CNAME | `<ユーザー名>.github.io` | 3600 |

### サブドメイン（`www.example.com`）の場合

Apexドメインの代わりにサブドメインを使用する場合は、CNAMEレコードのみ設定します。

| ホスト名 | TYPE | VALUE | TTL |
|---------|------|-------|-----|
| www | CNAME | `<ユーザー名>.github.io` | 3600 |

> **注意**: DNS設定の反映には最大24〜48時間かかる場合があります。通常は数分〜数時間で反映されます。

---

## 4. GitHub Pages で独自ドメインを設定

### CNAME ファイルの作成

プロジェクトの `public/` ディレクトリに `CNAME` ファイルを作成します。

```
example.com
```

> `public/CNAME` に配置すると、Astroのビルド時に `dist/` へコピーされます。

### GitHub リポジトリでの設定

1. GitHubのリポジトリページを開く
2. **Settings** → **Pages** に移動
3. 「Custom domain」に独自ドメインを入力（例: `example.com`）
4. 「Save」をクリック
5. DNSチェックが通るまで待つ

---

## 5. SSL（HTTPS）の有効化

GitHub Pages は独自ドメインに対して無料でSSL証明書（Let's Encrypt）を提供しています。

1. **Settings** → **Pages** に移動
2. DNSチェックが完了していることを確認
3. 「**Enforce HTTPS**」にチェックを入れる

> **注意**: DNSの反映が完了していない場合、「Enforce HTTPS」のチェックボックスがグレーアウトされます。DNS設定後しばらく待ってからページを再読み込みしてください。

### SSL証明書の発行タイミング

- 初回は証明書の発行に最大1時間程度かかる場合があります
- 証明書は自動更新されるため、手動での更新は不要です

---

## 6. Astro設定の更新

独自ドメインを設定した場合、Astroの設定を更新します。

### `astro.config.mjs`

```javascript
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://example.com",
  // 独自ドメインの場合、base は不要（ルートで配信されるため）
});
```

> **ポイント**: GitHub Pages のサブディレクトリ配信（`username.github.io/repo-name`）から独自ドメインに変更する場合、`base` の設定を削除してください。

### `src/consts.ts`

```typescript
export const SITE_URL = "https://example.com";
```

### `public/admin/config.yml`（CMS使用時）

```yaml
site_url: https://example.com
```

---

## 7. 確認とトラブルシューティング

### DNS設定の確認

ターミナルで以下のコマンドを実行して、DNSレコードが正しく設定されているか確認できます。

```bash
# Aレコードの確認
dig example.com +short

# 期待される出力:
# 185.199.108.153
# 185.199.109.153
# 185.199.110.153
# 185.199.111.153

# CNAMEレコードの確認
dig www.example.com +short
```

### よくある問題と対処法

| 問題 | 原因 | 対処法 |
|------|------|--------|
| サイトが表示されない | DNS未反映 | 設定後24〜48時間待つ |
| 「Enforce HTTPS」が押せない | DNS未反映またはレコード誤り | DNSレコードを再確認し、反映を待つ |
| CSSやリンクが崩れる | `base` 設定が残っている | `astro.config.mjs` から `base` を削除 |
| 証明書エラーが出る | SSL証明書未発行 | 最大1時間待つ。解消しない場合はカスタムドメインを一度削除して再設定 |
| `www` でアクセスできない | CNAMEレコード未設定 | `www` のCNAMEレコードを追加 |

### 参考リンク

- [GitHub Pages で独自ドメインを設定する（GitHub公式）](https://docs.github.com/ja/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [お名前.com DNS設定ヘルプ](https://help.onamae.com/answer/7883)
