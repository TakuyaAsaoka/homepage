# 検索エンジンへのサイトマップ登録

サイトマップ（`sitemap-index.xml`）を Google Search Console に登録し、検索エンジンにサイトの全公開ページを伝えるための手順です。

---

## 目次

1. [前提条件](#1-前提条件)
2. [なぜ Search Console への直接登録が必要か](#2-なぜ-search-console-への直接登録が必要か)
3. [Google Search Console への登録手順](#3-google-search-console-への登録手順)
4. [独自ドメイン移行時の注意](#4-独自ドメイン移行時の注意)

---

## 1. 前提条件

- サイトマップがデプロイ済みであること（`@astrojs/sitemap` によりビルド時に自動生成される。Issue #2 / PR #74）
- サイトマップURL: **`https://takuyaasaoka.github.io/homepage/sitemap-index.xml`**

ブラウザで上記URLを開き、XMLが表示されることを確認してから登録に進んでください。

---

## 2. なぜ Search Console への直接登録が必要か

通常、サイトマップは `robots.txt` に記載してクローラーに伝えますが、**このサイトでは robots.txt を配置していません**。

- robots.txt の仕様上、クローラーは**ドメインルート**（`https://takuyaasaoka.github.io/robots.txt`）しか読まない
- 本サイトは GitHub Pages のプロジェクトページ（`/homepage/` 配下）で公開されているため、このリポジトリの `public/robots.txt` は `/homepage/robots.txt` に配置され、クローラーに無視される

そのため、Search Console への直接登録がサイトマップを検索エンジンに伝える唯一の手段です。設計判断の詳細は [`docs/records/specs/2026-07-16-2-sitemap-generation-design.md`](records/specs/2026-07-16-2-sitemap-generation-design.md) を参照してください。

---

## 3. Google Search Console への登録手順

1. [Google Search Console](https://search.google.com/search-console) にGoogleアカウントでログインする
2. 「プロパティを追加」で **URLプレフィックス** を選択し、`https://takuyaasaoka.github.io/homepage/` を入力する
   > プロジェクトページはドメイン全体を所有していないため、「ドメイン」プロパティではなく「URLプレフィックス」を使う
3. 所有権を確認する（いずれかの方法）
   - **HTMLファイル**: 指定されたファイルを `public/` に配置してデプロイする
   - **HTMLタグ**: 指定されたmetaタグをレイアウト（`src/layouts/`）の `<head>` に追加してデプロイする
4. 左メニューの「サイトマップ」を開き、`sitemap-index.xml` を入力して送信する
5. ステータスが「成功しました」になることを確認する（反映まで数日かかる場合がある）

---

## 4. 独自ドメイン移行時の注意

[`docs/custom-domain-ssl.md`](custom-domain-ssl.md) の手順で独自ドメインへ移行した場合、このドキュメントの前提が変わります。以下を忘れずに実施してください。

| 項目 | 内容 |
|------|------|
| Search Console の再登録 | URLが変わるため、新ドメインでプロパティを作り直し、サイトマップを再送信する |
| robots.txt の配置 | 独自ドメインではサイトがドメインルートで配信されるため、robots.txt が機能するようになる。`public/robots.txt` を作成し `Sitemap: https://<新ドメイン>/sitemap-index.xml` を記載する |
| 旧URLからの移転通知 | Search Console の「アドレス変更」ツールで新ドメインへの移転を通知する |
