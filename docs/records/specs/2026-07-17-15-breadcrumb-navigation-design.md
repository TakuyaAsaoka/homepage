# パンくずリストナビゲーションの追加 設計ドキュメント（Issue #15）

- Issue: #15
- 作成日: 2026-07-17
- ステータス: 承認済み

## 概要 / 背景

下層ページに現在地を示すパンくずリストを追加する。Issue #15 の発端はプロジェクト詳細ページだが、パンくずは「サイト階層の現在地表示」というサイト共通の関心事であり、Projects 独自機能として実装すると About / Blog へ展開する際に二重実装になる。そこで **Projects 限定ではなく、全下層ページ共通の仕組みとしてレイアウト（`BaseLayout`）に組み込む**。

要件（Issue #15 より）:

- `nav` 要素 + `aria-label="パンくずリスト"` で表示する
- 現在ページは `aria-current="page"` を設定し、リンクではなくテキスト表示にする
- 上位ページはクリック可能なリンクにする
- 区切り文字は CSS 擬似要素で視覚表現する（マークアップに含めない）
- レスポンシブ対応（長いパンくずが折り返しても崩れない）
- `npm run build` が成功する

## 対象ページ一覧

| ページ | ファイル | パンくず |
|--------|---------|---------|
| `/about/` | `src/pages/about.astro` | Home > About |
| `/blog/` | `src/pages/blog.astro` | Home > Blog |
| `/projects/` | `src/pages/projects/index.astro` | Home > Projects |
| `/projects/[slug]/` | `src/pages/projects/[...slug].astro` | Home > Projects > {プロジェクトタイトル} |

対象外: `/`（`index.astro`。ルートのため現在地表示が不要）、`404.astro`（エラーページ。正規の階層に属さない）。

「Home」は各パンくずの先頭リンクで、href は `src/consts.ts` の `BASE_PATH` を使う。
ラベル表記は Header のナビゲーション（`Home` / `About` / `Blog` / `Projects` の欧文表記）に合わせる。パンくずは Header と同じ「ナビゲーション」であり、同一の行き先に同一のラベルを使うことで認知負荷を下げる。プロジェクト詳細のみコンテンツ由来の日本語タイトルになるが、これはコンテンツ固有名のため問題ない。

## アーキテクチャ: 共通化方式の比較

「BaseLayout にパンくずをどう組み込むか」について 2 案を比較した。

| 判断軸 | 案A: `breadcrumb?` プロップ方式<br>（各ページが items を明示的に渡す） | 案B: `Astro.url.pathname` からの自動導出方式<br>（パス→ラベルのマッピングを集中管理） |
|--------|----------------------------------------------------|----------------------------------------------------|
| 動的タイトル（`/projects/[slug]/`） | ページが既に持つ `project.data.title` をそのまま渡すだけ | pathname からは slug しか得られず、レイアウト側でコレクション再取得か「タイトル上書きプロップ」が必要 → 結局プロップ併用のハイブリッドに崩れる |
| ラベル表記の管理 | 各ページに記述（渡す値がそのまま表示） | 中央のマッピング表で管理（一元化）だがページ本体と定義場所が離れる |
| 新ページ追加時の手間 | そのページに 1 プロップ追加するだけ。渡さなければ表示されない（安全側に倒れる） | マッピング表の更新を忘れるとラベル欠落・slug 生表示等の壊れ方をする |
| Home / 404 の除外 | プロップを渡さないだけで自然に除外 | 除外リストの特別扱いが必要 |
| `base: "/homepage"` への対応 | 不要（pathname を解析しない） | pathname から `BASE_PATH` を剥がす処理が必要 |
| 型安全性 | `Props` の型で構造を保証 | 文字列パースのため型で守れない |

**採用: 案A（`breadcrumb?` プロップ方式）**

決め手は動的タイトルの扱い。案B は本 Issue の主対象であるプロジェクト詳細ページで自動導出が成立せず、プロップ併用が避けられない。「自動導出＋上書き」の二重機構を持つくらいなら、最初から明示的なプロップ 1 本に統一したほうが単純で追いやすい。ページ数 4 の本サイトでは案B の「一元管理」の利得はほぼなく、マッピング更新漏れという新しい壊れ方を持ち込むデメリットが上回る。

## コンポーネント設計: `Breadcrumb.astro`

`src/components/Breadcrumb.astro` を新規作成する。責務は **描画・アクセシビリティ・スタイル** のみ。パンくずデータ（ラベル・リンク先）の組み立て責務は各ページに置く（各ページだけが自分の階層と動的タイトルを知っているため）。

例外として「先頭の Home」だけは Breadcrumb.astro が自動付与する。全ページで先頭が `Home`（href=`BASE_PATH`）固定という仕様をコンポーネント側で保証でき、各ページの記述量と `BASE_PATH` 参照の重複が減る。

### Props

```astro
---
import { BASE_PATH } from "../consts";

// パンくずの1項目。href省略時は現在ページ（リンクなし・aria-current="page"）として描画する
export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface Props {
  // Home を除く階層。末尾要素が現在ページ（href なし）
  items: BreadcrumbItem[];
}

const { items } = Astro.props;
// 先頭の Home は全ページ共通のためコンポーネント側で付与する
const allItems: BreadcrumbItem[] = [{ label: "Home", href: BASE_PATH }, ...items];
---
```

- `BreadcrumbItem` 型は Breadcrumb.astro から `export` し、BaseLayout がインポートして `Props` に使う（型定義ファイルの新設はしない）。
- フロントマターは規約どおり「インポート → Props型定義 → ロジック」の順。

### 出力構造

```html
<nav class="breadcrumb" aria-label="パンくずリスト">
  <ol>
    <li><a href="/homepage/">Home</a></li>
    <li><a href="/homepage/projects/">Projects</a></li>
    <li><span aria-current="page">サンプルプロジェクト</span></li>
  </ol>
</nav>
```

- 順序付き階層なので `ol` / `li` を使う。
- `href` がある項目は `a`、ない項目（現在ページ）は `span aria-current="page"`。
- 区切り文字は DOM に含めず CSS 擬似要素で描く（後述）。

### スタイル（スコープドスタイル）

既存の流儀（TagList の `list-style: none` + `flex`、`font-size: 0.85rem`、`--color-muted`、skill-list の `li + li::before` 区切り）に合わせる。

```css
.breadcrumb {
  margin-block: 1.5rem;
  font-size: 0.85rem;
}
.breadcrumb ol {
  display: flex;
  flex-wrap: wrap; /* 長いパンくずは折り返す（レスポンシブ対応） */
  list-style: none;
}
/* 区切り文字。alt テキスト空文字構文でスクリーンリーダーに読ませない。
   旧ブラウザ向けに通常構文を先に書き、対応ブラウザでは後の宣言で上書きする */
.breadcrumb li + li::before {
  content: "/";
  content: "/" / "";
  margin-inline: 0.5em;
  color: var(--season-accent); /* 区切り記号は季節アクセント（global.css の変数コメントの用途どおり） */
}
.breadcrumb [aria-current="page"] {
  color: var(--color-muted);
}
```

- **リンクの見た目はグローバルの `a` スタイル（墨色文字＋季節色下線）をそのまま使う**。上書きしないことで全ページのリンクと統一される。
- **折り返し**: `flex-wrap: wrap` により項目単位で折り返す。区切り文字は `li` の内側（`::before`）にあるため、折り返し行の先頭に区切りが来ても項目と一緒に移動し、崩れない。長いプロジェクトタイトル自体も `li` 内で通常の折り返しに任せる（`white-space: nowrap` は付けない）。
- **上下マージン**: `1.5rem` とする。見出しに `page-heading`（`margin-block: 2.5rem 2rem`）を使うページではマージン相殺により従来どおり見出し上 2.5rem が保たれ、`page-heading` を使わないプロジェクト詳細ページでは 1.5rem の間隔が確保される。

## BaseLayout への統合

`src/layouts/BaseLayout.astro` に `breadcrumb?` プロップを追加し、`.main-inner` の内側・本文スロットの直前で描画する。

```astro
---
import Breadcrumb, { type BreadcrumbItem } from "../components/Breadcrumb.astro";
// （既存インポートは省略）

interface Props {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  // Home を除くパンくず階層。省略時はパンくず非表示（Home・404 は渡さない）
  breadcrumb?: BreadcrumbItem[];
}

const { title, description, image, noindex, breadcrumb } = Astro.props;
---
```

```astro
<main>
  <slot name="hero" />
  <div class="main-inner">
    {breadcrumb && <Breadcrumb items={breadcrumb} />}
    <slot />
  </div>
</main>
```

配置の根拠:

- **`.main-inner` の内側**: パンくずも本文と同じ幅制限・左端ライン（`--content-max-width` + `--content-pad`）に載せる。Header / 本文 / Footer の左端が一直線という #67 で確立した設計を崩さない。
- **本文スロットの直前（＝ページ h1 より上）**: パンくずは「本文より上のメタナビゲーション」であり、視覚順・DOM 順ともに見出しより先が慣例。各ページに配置コードを書かせず、レイアウトが位置を一元的に保証する。
- **`hero` スロットより後**: hero を使うのは Home のみで、Home はパンくず対象外のため実質干渉しないが、仮に将来 hero 付き下層ページができてもヒーローの下・本文の上という自然な位置になる。

## 各ページでの利用方法

各ページは `BaseLayout` に `breadcrumb` を渡すだけ（Home を除く階層。末尾＝現在ページは `href` なし）。

```astro
<!-- src/pages/about.astro -->
<BaseLayout title="About" description="..." breadcrumb={[{ label: "About" }]}>
```

```astro
<!-- src/pages/blog.astro -->
<BaseLayout title="Blog" description="..." breadcrumb={[{ label: "Blog" }]}>
```

```astro
<!-- src/pages/projects/index.astro -->
<BaseLayout title="Projects" description="..." breadcrumb={[{ label: "Projects" }]}>
```

```astro
<!-- src/pages/projects/[...slug].astro -->
<BaseLayout
  title={project.data.title}
  description={project.data.description}
  breadcrumb={[
    { label: "Projects", href: `${BASE_PATH}projects/` },
    { label: project.data.title },
  ]}
>
```

- `[...slug].astro` には `BASE_PATH` のインポートを追加する。URL は必ず `BASE_PATH` 定数から組み立て、`import.meta.env.BASE_URL` の直接連結はしない（本番 `base: "/homepage"` でリンクが壊れるため。`consts.ts` のコメント参照）。
- `index.astro`・`404.astro` は変更しない（プロップを渡さない＝非表示）。

## アクセシビリティ

| 項目 | 対応 |
|------|------|
| ランドマーク | `nav` + `aria-label="パンくずリスト"`。Header の `nav` と区別できる一意なラベルになる（Header 側はラベルなしの汎用 nav のため衝突しない） |
| 階層の意味付け | `ol` / `li` で順序リストとして構造化。スクリーンリーダーが項目数・順序を読み上げられる |
| リストセマンティクスの復元 | `list-style: none` を指定すると Safari/VoiceOver でリストとして読み上げられなくなるため、`ol` に `role="list"` を付す（既存の `index.astro` の各リストと同じ慣行） |
| 現在ページ | `aria-current="page"` を付けた `span`。リンクにしない（自分自身へのリンクは操作の無駄とフォーカス混乱を生む） |
| 区切り文字 | CSS 擬似要素 `content: "/" / ""`（alt テキスト空文字）で読み上げ対象から除外。未対応の旧ブラウザは直前の通常宣言 `content: "/"` にフォールバックし、読み上げられても装飾記号 1 文字で実害が小さい |
| キーボード操作 | 通常のリンクのみで構成されるため追加対応不要 |
| コントラスト | リンクは `--color-text`（本文と同等）、現在ページは `--color-muted`。ライト/ダークとも既存本文で使用済みの配色のため新規のコントラスト検証は不要 |

## 検証方法

このプロジェクトの品質ゲートはローカル検証（CI なし）のため、以下を実施する。

1. `npm run build` が成功する
2. `npm run check`（astro check）がパスする
3. ビルド成果物（`dist/`）の確認:
   - `about/`, `blog/`, `projects/`, `projects/<slug>/` の HTML に `nav aria-label="パンくずリスト"` と `ol` 構造が出力されている
   - リンク href が `/homepage/` プレフィックス付きで出力されている（`BASE_PATH` 反映の確認）
   - 末尾項目が `span aria-current="page"` でリンクになっていない
   - `index.html`, `404.html` にパンくずが出力されていない
4. `npm run preview` + ブラウザで目視確認:
   - 4 ページでパンくずが本文見出しの上・左端ライン揃いで表示される
   - 狭幅ビューポート（375px 相当）で長いパンくずが折り返しても崩れない
   - 区切り文字が項目間に表示される（ライト/ダーク両モード）
   - Home / Projects リンクをクリックして正しく遷移する

## スコープ外

| 項目 | 理由 |
|------|------|
| 構造化データ（JSON-LD `BreadcrumbList`） | JSON-LD 全般は Issue #13 が一元管轄するため、本 Issue では実装しない。本設計の `BreadcrumbItem[]`（label + href）は BreadcrumbList の `itemListElement` に必要な情報と一致しており、#13 実装時に BaseLayout の `breadcrumb` プロップをそのまま流用できる |
| Home（`/`）への適用 | ルートページは現在地表示が不要 |
| 404 ページへの適用 | エラーページは正規の階層に属さない |
