# 制作の画像を astro:assets に載せ、読み込み時のレイアウト移動をなくす

- Issue: #133
- 作成日: 2026-08-10
- ステータス: 設計完了

## 背景と課題

制作詳細ページ（`src/pages/works/[...slug].astro`）の `<img>` に `width` / `height` が無い。ブラウザは画像を読み終わるまで高さを 0 と見なすため、読み込み完了と同時に公開日・タグ・本文が下へ押し出される。読み始めた文章が動き、リンクの誤タップも起きる。

原因は画像の置き場所にある。画像は `public/images/` にあり、CMS（`public/admin/config.yml` の `media_folder`）もそこへ保存する。`public/` のファイルはビルド時にそのままコピーされるだけで Astro は中身を読まないため、寸法が分からない。

この置き場所は寸法以外にも問題を生んでいる。

| 問題 | 現れ方 |
|---|---|
| 寸法が分からない | `width` / `height` を出せない（本Issue） |
| 最適化されない | WebP変換・リサイズが一切かからない |
| 参照切れを検出できない | 画像ファイルを消してもビルドは通り、公開後に404になる |
| コンテンツにデプロイ先が混入する | フロントマターに `/homepage/images/foo.png` と `BASE_PATH` がそのまま入る。`WorkCard.astro` と `StructuredData.astro` に「`BASE_PATH` を連結してはならない」という同じ注意書きが2箇所ある |

### あるべき姿

画像を `src/` 配下に置き、Content Collections の `image()` ヘルパーでスキーマを定義する（astro:assets）。Astro が画像を読むようになるため、上の4つが同時に解消する。

制作詳細ページの `<img>` には画像の実寸が属性として出力される。

```html
<img src="/homepage/_astro/foo.<hash>.webp" alt="…" width="1200" height="630" class="hero-image">
```

## 検証で確定した事実

Issue の「残る判断（未検証・実装者に委ねる）」を、着手時にすべて実測で確定した。

| 確認したこと | 結果 |
|---|---|
| `image()` が受け付ける相対パスの書き方 | `./images/foo.png` と `../../assets/images/foo.png` の両方を解決する。さらに `./` が無い `images/foo.png` も、Markdownからの相対で実在すれば Astro が `./` を補う（`node_modules/astro/dist/content/utils.js:129-134`） |
| CMSで画像を消したときに残る `image: ""` の扱い | `image()` の実体は「値の先頭に `__ASTRO_IMAGE_` を付けた文字列に変換し、読み出し時に画像へ差し替える」もの（同 `utils.js:124-137`）。空文字も `"__ASTRO_IMAGE_"` という空でない文字列になるため、後段の `.transform()` では「未設定」に正規化できない |
| 上記への対処 | `z.union([z.literal(""), image()])` で空文字を先に受ければ正規化できる（ビルドして `undefined` になることを確認） |
| Sveltia CMS が `public_folder` に相対パスを書けるか | 書ける。配信中の `@sveltia/cms` 本体を読むと、`public_folder` の値が `.` または `@` で始まるとき（および空文字のとき）だけそのまま使い、それ以外は先頭に `/` を付ける（`publicPath: /^($|[.@])/.test(o) ? o : "/" + HD(o)`）。`"./images"` と書けば意図どおり相対で保存される |
| Sveltia CMS の `media_folder` が相対のときの保存先 | 先頭が `/` でなければエントリ相対になり、コレクションの `folder` を基準に保存される（同ソース `entryRelative` の判定） |
| 参照切れの検出 | 存在しない画像を指すとビルドが `ImageNotFound` で失敗する |

## スコープ

### 画像の置き場所

`src/content/works/images/` とする。判断基準は「その画像は制作に属するか、サイト共通の資材か」。CMS は制作単位でしか画像を登録しないため、制作に属する。Sveltia の相対保存とも噛み合う。

サイト共通の資材である OGP のデフォルト画像（`og.png`）だけは `src/assets/og.png` に置く。

### 対象

| ファイル | 変更 |
|---|---|
| `public/admin/config.yml` | works コレクションに `media_folder: "images"` と `public_folder: "./images"` を追加 |
| `src/content.config.ts` | works の `image` を `z.string()` から `z.union([z.literal(""), image()])` へ |
| `src/consts.ts` | `DEFAULT_OG_IMAGE`（URL文字列）を `DEFAULT_IMAGE`（`src/assets/og.png` の import）へ |
| `src/components/WorkCard.astro` | Props の `image` を `ImageMetadata` に変え、`<img>` を `<Image>` に |
| `src/pages/works/[...slug].astro` | `<img>` を `<Image>` に。OGP・JSON-LD へは `image.src` を渡す |
| `src/components/BaseHead.astro` | `DEFAULT_OG_IMAGE` → `DEFAULT_IMAGE.src` |
| `src/components/StructuredData.astro` | 実態に合わなくなるコメントの修正のみ |
| `public/images/og.png` | `src/assets/og.png` へ移動 |

### やらないこと

- `BaseLayout` / `BaseHead` / `StructuredData` の `image?: string` は変えない。これらが必要とするのは画像そのものではなく画像のURLなので、文字列が正しい型。Issue が想定していた「オブジェクトに変える」は不要だった
- `public/admin/config.yml` のグローバル `media_folder` / `public_folder` は変えない。works の設定が上書きするため使われないが、他のコレクションに画像欄が無い現状で先回りして変える理由がない
- 一覧カードの見た目は変えない。`aspect-ratio: 16 / 9` と `object-fit: cover` をそのまま使う

## 設計

### スキーマ（`src/content.config.ts`）

```ts
schema: ({ image }) =>
  z.object({
    // …
    image: z
      .union([z.literal(""), image()])
      .optional()
      .transform((v) => v || undefined),
  }),
```

`image()` を使うには `schema` を関数形式にする必要がある。空文字を `z.literal("")` で先に受けるのは、上の「検証で確定した事実」のとおり `image()` が空文字を素通りさせるため。#132 で入れた「空文字を未設定に正規化する」意図はそのまま保つ。

### デフォルト画像（`src/consts.ts`）

```ts
export { default as DEFAULT_IMAGE } from "./assets/og.png";
```

URL文字列ではなく import で持つと、寸法が分かるため一覧カードでも `<Image>` が使え、ファイルを消せばビルドが失敗する。名前を `DEFAULT_OG_IMAGE` から `DEFAULT_IMAGE` に変えるのは、OGPだけでなく一覧カードのサムネイルにも使われているため（用途は変更前から2つある）。

参照元は `BaseHead.astro`（`DEFAULT_IMAGE.src`）と `WorkCard.astro`（`DEFAULT_IMAGE` をそのまま）の2箇所。

### 詳細ページ（`src/pages/works/[...slug].astro`）

`<Image>` は既定で `loading="lazy"` を付ける。ヒーロー画像はページ最上部に出るため `loading="eager"` で打ち消す。

OGP と JSON-LD には `work.data.image?.src` を渡す。`src` は元画像（PNG/JPEG）の配信URLで、`<Image>` が生成するWebPとは別。SNS側の対応形式を考えると元画像のままが安全。

### 一覧カード（`src/components/WorkCard.astro`）

`<Image>` に幅を指定せず、元画像の寸法のまま出す。カードの表示幅は2カラム時で約350px、1カラム時で約736pxと幅があり、固定幅を決めると片方で粗くなる。枠は従来どおりCSSの `aspect-ratio` が確保するので、属性の寸法は表示に影響しない。

`src/styles/global.css:139-142` に `img { max-width: 100%; height: auto }` があるため、`width` / `height` 属性が付いても縮小時に縦横比は崩れない。

## 棄却した案

| 案 | 棄却理由 |
|---|---|
| CSSで `aspect-ratio` を決め打ちする | 枠は確保できるが、画像ごとに縦横比が違うため余白か切り取りが出る。詳細ページは画像を丸ごと見せたい場所 |
| `<img>` に固定の width / height を書く | 実寸と違えば表示が歪む。CMSから任意の画像が入る以上、固定値は置けない |
| `public/` に置いたまま、ビルド時に sharp で寸法だけ読む | 変更は数行で済むが、直るのは寸法だけ。最適化・参照切れ検出・`BASE_PATH` の混入は残る。さらに「`BASE_PATH` を剥がして `public/` のパスを組み立てる」処理が増え、混入の問題はむしろ深まる |
| 画像を `src/assets/images/` に置く | 動作はする（検証済み）。ただしCMSは制作単位でしか画像を登録しないため、制作と同じ場所に置くほうが実態に合う |

## 検証方針

Issue の「検証」手順を新しい配置に合わせて再実行する。画像の置き場所が変わるため、コピー先を `src/content/works/images/` に、差し込むパスを `./images/_verify.png` に読み替える。

```bash
mkdir -p src/content/works/images \
  && cp src/assets/og.png src/content/works/images/_verify.png \
  && sed -i '' 's|^tags: |image: "./images/_verify.png"\ntags: |' src/content/works/homepage.md \
  && rm -rf .astro && npm run build >/dev/null 2>&1 \
  && grep -oE '<img[^>]*hero-image[^>]*>' dist/works/homepage/index.html \
  ; git checkout src/content/works/homepage.md && rm -rf src/content/works/images
```

`width="1200" height="630"` が出力されることを確認する。あわせて次も確認する。

- 画像を設定した制作・していない制作の両方で `og:image` が絶対URLで出ること、未設定時は `og.png` にフォールバックすること
- 一覧カードの `<img>` が従来どおり `class="thumbnail"` で出ること
- `image: ""` のエントリでビルドが通り、ヒーロー画像が出ないこと

CMS の管理画面での保存・変更・削除は、GitHubバックエンドに接続した実機確認になるためマージ後に行う。保存パスの仕様はCMS本体のソースで確定済み。

## 受け入れ条件（Issue #133）

- [ ] 「検証」の手順を再実行すると「あるべき姿の出力」と一致する（`width` / `height` が実寸で出力される）
- [ ] 一覧カードの表示が現状から変わらない（`aspect-ratio: 16 / 9` の枠、未設定時のデフォルト画像）
- [ ] og:image が引き続き絶対URLで出力され、画像未設定時は `og.png` にフォールバックする
- [ ] CMS の管理画面から画像を設定・変更・削除でき、保存されたパスがサイトで解決できる
- [ ] `npm run build && npm run check && npm run test:run` が warning 0件で全パスする

## 依存関係

#7（PR #132）のマージが前提。`hero-image` の `<img>` はそのPRで追加されたもの。マージ済みであることを着手時に確認した。
