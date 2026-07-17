# パンくずリストナビゲーション 実装プラン（Issue #15）

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 下層4ページ（About / Blog / Projects一覧 / プロジェクト詳細）に、アクセシブルなパンくずリストを表示する（Issue #15）。

**Architecture:** 案A（`breadcrumb?` プロップ方式）。描画・a11y・スタイルは新規コンポーネント `src/components/Breadcrumb.astro` が担い、先頭の「Home」（href=`BASE_PATH`）はコンポーネントが自動付与する。`BaseLayout` は `breadcrumb?: BreadcrumbItem[]` プロップを受け取り、`.main-inner` 内・本文スロット直前で描画する。各ページは自分の階層（Home を除く。末尾＝現在ページは `href` なし）を渡すだけ。`index.astro`（Home）と `404.astro` はプロップを渡さない＝非表示。JSON-LD（`BreadcrumbList`）は Issue #13 の管轄でスコープ外。

**Tech Stack:** Astro v6（スコープドスタイル）、素の CSS。テストフレームワークは無いため TDD は適用不可。検証は `npm run build` / `npm run check` / ビルド成果物（`dist/`）の HTML 検査 / `npm run preview` + ブラウザ目視で行う（`package.json` の scripts は `dev` / `build` / `preview` / `check` / `astro` のみ）。

**Spec:** `docs/records/specs/2026-07-17-15-breadcrumb-navigation-design.md`

**作業ディレクトリ:** worktree `.claude/worktrees/feature-15`（ブランチ `feature/15-breadcrumb`）。以下のパスはすべて worktree ルートからの相対パス。

**規約上の注意:**

- Astro フロントマターは「インポート → Props型定義 → ロジック」の順（`docs/coding-standards.md`）
- URL は必ず `src/consts.ts` の `BASE_PATH` から組み立てる。`import.meta.env.BASE_URL` の直接連結は禁止（本番 `base: "/homepage"` でリンクが壊れる）

---

### Task 1: Breadcrumb.astro の新規作成

パンくずの描画・アクセシビリティ・スタイルを担うコンポーネントを作る。データ組み立て責務は各ページに置くが、先頭「Home」だけは全ページ共通仕様のためコンポーネント側で付与する。

**Files:**
- Create: `src/components/Breadcrumb.astro`

- [ ] **Step 1: コンポーネントを作成**

`src/components/Breadcrumb.astro` を以下の内容で新規作成する:

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

<nav class="breadcrumb" aria-label="パンくずリスト">
  <ol>
    {allItems.map((item) =>
      item.href ? (
        <li><a href={item.href}>{item.label}</a></li>
      ) : (
        <li><span aria-current="page">{item.label}</span></li>
      )
    )}
  </ol>
</nav>

<style>
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
</style>
```

設計上のポイント（レビュー観点）:

- `BreadcrumbItem` 型を `export` する（Task 2 で BaseLayout がインポート。型定義ファイルは新設しない）
- `ol` / `li` による順序リスト。`href` あり＝ `a`、なし（現在ページ）＝ `span aria-current="page"`
- 区切り文字は DOM に含めず `li + li::before` で描く（既存 `.skill-list li + li::before` と同じ流儀）
- リンクの見た目はグローバルの `a` スタイル（墨色文字＋季節色下線）をそのまま使い、上書きしない
- `white-space: nowrap` は付けない（長いタイトルは `li` 内の通常折り返しに任せる）
- `margin-block: 1.5rem`: `page-heading`（`margin-block: 2.5rem 2rem`）とのマージン相殺で見出し上 2.5rem を維持しつつ、`page-heading` 非使用のプロジェクト詳細では 1.5rem を確保する

Expected: ファイルが作成される。この時点ではどこからも参照されないため表示は変わらない

- [ ] **Step 2: ビルド・型チェックが通ることを確認してコミット**

```bash
npm run build && npm run check
```

Expected: 両方成功（エラー・警告0件）

```bash
git add src/components/Breadcrumb.astro
git commit -m "feat: パンくずリストコンポーネントを追加する (#15)"
```

---

### Task 2: BaseLayout への統合

`breadcrumb?` プロップを追加し、`.main-inner` の内側・本文スロットの直前（`hero` スロットより後）で描画する。プロップ省略時は非表示（Home・404 が自然に除外される）。

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: フロントマターにインポート・プロップを追加**

`src/layouts/BaseLayout.astro` のフロントマターを変更する:

インポート部（`Footer` のインポートの後ろに追加）:

```astro
import Breadcrumb, { type BreadcrumbItem } from "../components/Breadcrumb.astro";
```

`Props` と分割代入を変更:

```astro
interface Props {
  title: string;
  description: string;
  image?: string;
  noindex?: boolean;
  // Home を除くパンくず階層。省略時はパンくず非表示（Home・404 は渡さない）
  breadcrumb?: BreadcrumbItem[];
}

const { title, description, image, noindex, breadcrumb } = Astro.props;
```

- [ ] **Step 2: `.main-inner` 内・本文スロット直前で描画**

`<main>` ブロックを変更する:

```astro
<!-- 変更前 -->
    <main>
      <slot name="hero" />
      <div class="main-inner">
        <slot />
      </div>
    </main>
```

```astro
<!-- 変更後 -->
    <main>
      <slot name="hero" />
      <div class="main-inner">
        {breadcrumb && <Breadcrumb items={breadcrumb} />}
        <slot />
      </div>
    </main>
```

配置の根拠（specより）: `.main-inner` の内側＝本文と同じ幅制限・左端ライン（#67 で確立した設計を崩さない）、本文スロット直前＝ページ h1 より上のメタナビゲーション位置をレイアウトが一元保証。

- [ ] **Step 3: ビルド・型チェックが通ることを確認してコミット**

```bash
npm run build && npm run check
```

Expected: 両方成功。プロップを渡すページがまだ無いため、全ページの表示は変わらない（`dist/` にパンくずが出力されないこと）

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: BaseLayoutにbreadcrumbプロップを追加する (#15)"
```

---

### Task 3: 対象4ページへの breadcrumb プロップ追加

各ページが自分の階層（Home を除く。末尾＝現在ページは `href` なし）を渡す。ラベルは Header のナビゲーション表記（`About` / `Blog` / `Projects`）に合わせる。`index.astro`・`404.astro` は変更しない。

**Files:**
- Modify: `src/pages/about.astro`
- Modify: `src/pages/blog.astro`
- Modify: `src/pages/projects/index.astro`
- Modify: `src/pages/projects/[...slug].astro`

- [ ] **Step 1: about.astro**

`<BaseLayout>` タグに `breadcrumb` を追加:

```astro
<BaseLayout title="About" description="アサオカの自己紹介 — 経歴・仕事観・人となり" breadcrumb={[{ label: "About" }]}>
```

- [ ] **Step 2: blog.astro**

```astro
<BaseLayout title="Blog" description="noteに書いた記事の一覧" breadcrumb={[{ label: "Blog" }]}>
```

- [ ] **Step 3: projects/index.astro**

```astro
<BaseLayout title="Projects" description="アサオカの制作物一覧" breadcrumb={[{ label: "Projects" }]}>
```

- [ ] **Step 4: projects/[...slug].astro**

フロントマターの `consts` インポートに `BASE_PATH` を追加する:

```astro
import { BASE_PATH, SITE_LOCALE } from "../../consts";
```

`<BaseLayout>` タグに `breadcrumb` を追加（中間階層 Projects はリンク付き、末尾＝動的タイトルは `href` なし）:

```astro
<BaseLayout
  title={project.data.title}
  description={project.data.description}
  breadcrumb={[
    { label: "Projects", href: `${BASE_PATH}projects/` },
    { label: project.data.title },
  ]}
>
```

- [ ] **Step 5: ビルド・型チェックが通ることを確認してコミット**

```bash
npm run build && npm run check
```

Expected: 両方成功（エラー・警告0件）

```bash
git add src/pages/about.astro src/pages/blog.astro src/pages/projects/index.astro "src/pages/projects/[...slug].astro"
git commit -m "feat: 下層4ページにパンくずリストを表示する (#15)"
```

---

### Task 4: ビルド成果物の検証（specの「検証方法」1〜3）

テストフレームワークが無いため、`dist/` の HTML 検査を機械的な検証手段とする。

**Files:**
- （検証のみ。変更なし）

- [ ] **Step 1: ビルドと型チェック**

```bash
npm run build
```

Expected: ビルド成功（失敗した場合はここで止まる。`&&` で後続と繋がない）

```bash
npm run check
```

Expected: エラー0件・警告0件

- [ ] **Step 2: 対象4ページにパンくずが出力されていることを確認**

```bash
grep -l 'aria-label="パンくずリスト"' dist/about/index.html dist/blog/index.html dist/projects/index.html dist/projects/*/index.html
```

Expected: `about/` `blog/` `projects/` および全プロジェクト詳細（現状 `projects/homepage/` `projects/sales-to-invoice/`）の HTML がすべて列挙される

- [ ] **Step 3: マークアップ構造と BASE_PATH 反映を確認**

```bash
grep -o '<nav class="breadcrumb[^>]*>.*</nav>' dist/projects/homepage/index.html
```

Expected（プロジェクト詳細＝3階層のケースで以下をすべて満たす）:

- `nav` に `aria-label="パンくずリスト"` があり、内部が `ol` / `li` 構造
- `Home` リンクの href が `/homepage/`、`Projects` リンクの href が `/homepage/projects/`（`BASE_PATH` 反映）
- 末尾項目が `<span aria-current="page">`（プロジェクトタイトル）でリンクになっていない
- 区切り文字 `/` が HTML 内に含まれない（CSS 擬似要素のため）

2階層のケースも1ページ確認する:

```bash
grep -o '<nav class="breadcrumb[^>]*>.*</nav>' dist/about/index.html
```

Expected: `Home`（リンク）→ `About`（`span aria-current="page"`）の2項目

- [ ] **Step 4: Home・404 に出力されていないことを確認**

```bash
grep -c "パンくずリスト" dist/index.html dist/404.html || echo "Home/404への非出力: OK"
```

Expected: `Home/404への非出力: OK`（両ファイルとも0件）

---

### Task 5: ブラウザ目視確認（specの「検証方法」4）

**Files:**
- （検証のみ。変更なし）

- [ ] **Step 1: preview サーバーを起動**

```bash
npm run preview
```

Expected: ビルド済み成果物が配信される（base 設定により `http://localhost:4321/homepage/` 配下）

- [ ] **Step 2: 4ページの表示を目視確認**

`/homepage/about/`・`/homepage/blog/`・`/homepage/projects/`・`/homepage/projects/homepage/` で以下を確認する（chrome-devtools が使えればスクリーンショットで確認）:

- パンくずが本文見出しの上・本文と左端ライン揃いで表示される
- 区切り文字 `/` が項目間に季節アクセント色で表示される（ライト/ダーク両モード）
- 現在ページがミュート色のテキスト（リンクでない）、上位階層が既存リンクと同じ見た目
- Home / Projects リンクをクリックして正しく遷移する

- [ ] **Step 3: 狭幅ビューポートでの折り返しを確認**

375px 相当のビューポートでプロジェクト詳細ページ（タイトルが最長のもの）を表示し、パンくずが項目単位で折り返してもレイアウトが崩れない（区切り文字が行頭に取り残されない・横スクロールが発生しない）ことを確認する。

Expected: 折り返し表示が崩れない

---

### Task 6: 最終検証とPR作成

- [ ] **Step 1: 最新mainを取り込む**

```bash
git fetch origin main && git merge origin/main
```

Expected: コンフリクトなし（あれば解消し、Task 4 の検証を再実行する）

- [ ] **Step 2: 最終検証**

依存関係の変更は無いためクリーンインストールは不要。以下を実行する:

```bash
npm run build && npm run check
```

Expected: すべて成功。エラー・警告0件

- [ ] **Step 3: PRを作成**

```bash
git push -u origin feature/15-breadcrumb
gh pr create --title "feat: パンくずリストナビゲーションを追加する (#15)" --body "..."
```

PR本文には以下を含める:

- Issue #15 への参照（`Closes #15`）
- 採用方式（案A: `breadcrumb?` プロップ方式）と spec へのリンク
- JSON-LD（`BreadcrumbList`）は #13 管轄でスコープ外である旨
- 検証結果（Task 4 の HTML 検査結果、Task 5 の目視確認結果・スクリーンショット）
