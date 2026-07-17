# 「制作/Works」呼称の完全統一 設計書

- Issue: [#91](https://github.com/TakuyaAsaoka/homepage/issues/91)
- 作成日: 2026-07-18
- ステータス: 承認待ち

## 目的

1つの概念（旧「制作物」）が、サイトの見える文字・URL・コード識別子・コメント・ドキュメントにわたって不統一（Projects / 制作 / WORKS / PROJECTS / 制作物 / プロジェクト）になっている。**一切の乖離がない完全統一**を実現する。

## canonical（正）

| 用途 | 統一後の表記 |
|------|-------------|
| 日本語見出し・項目名 | **制作** |
| 英字サブラベル | **WORKS** |
| ナビ・ページタイトル・パンくず | **Works** |
| URL・コード識別子・フォルダ | **works** |

**全廃する語（works概念）**: `制作物`、`Projects`、`projects`（コード識別子含む）、`ProjectCard`、`project-card`、および **works概念を指す「プロジェクト」**（例: プロジェクトを見る／プロジェクト記事／プロジェクト詳細ページ／プロジェクトコレクション／最新プロジェクト／プロジェクト名／プロジェクトの概要）。

日本語は「制作」に一本化する（`制作物`は使わない）。個別項目を指す文（例「プロジェクトを見る」）も「制作を見る」に統一する。

### 「プロジェクト」の二義性（重要）

`プロジェクト` は本リポジトリで**2つの意味**で使われている。canonical統一の対象は前者のみ。

| 意味 | 例 | 扱い |
|------|-----|------|
| **works概念**（制作物） | プロジェクトを見る／プロジェクト記事／プロジェクト詳細ページ／プロジェクトコレクション／最新プロジェクト／プロジェクト名／プロジェクトの概要 | **全廃 → 制作へ** |
| **リポジトリ／プロダクト** | `homepage プロジェクト`／`プロジェクト構成`／`プロジェクトルート`／`## プロジェクト概要`(CLAUDE.md) | **正当な語として残す** |

したがって検証は「`プロジェクト` を機械的に0件」にはしない。works概念の語のみを対象とし、リポジトリを指す語は残す（下記「検証」参照）。なお `CLAUDE.md` には works概念の識別子（projects/ProjectCard/制作物）は無く、残る「プロジェクト概要／固有のルール」はいずれもリポジトリ意味のため**変更しない**。

## スコープ

### やること（5層すべて）

**層1: 見える文字（サイト・CMS）**

| 箇所 | 現在 | 統一後 |
|------|------|--------|
| `Header.astro` ナビ | `Projects` | `Works` |
| `pages/projects/index.astro` タイトル | `Projects` | `Works` |
| 同 パンくず | `Projects` | `Works` |
| 同 サブラベル | `PROJECTS` | `WORKS` |
| 同 説明 | `アサオカの制作物一覧` | `アサオカの制作一覧` |
| 同 空表示 | `公開できる制作物を準備中です。` | `公開できる制作を準備中です。` |
| `pages/projects/[...slug].astro` パンくず | `Projects` | `Works` |
| 同 ボタン | `プロジェクトを見る` | `制作を見る` |
| `index.astro` 空表示 | `公開できる制作物を準備中です。` | `公開できる制作を準備中です。` |
| `config.yml` コレクション名 | `制作物` | `制作` |
| 同 ヒント文 | `制作物の名前` / `制作物の公開URL（あれば）` | `制作の名前` / `制作の公開URL（あれば）` |

Homeのセクション見出し（`制作` / `WORKS`）は既に正しいため変更なし。

**層2: URL**

- ルートディレクトリ `src/pages/projects/` → `src/pages/works/`（`index.astro` と `[...slug].astro` を移動）
- 内部リンクを `/works/` に更新（`Header.astro` / `index.astro` の works-link・section-more / 両 breadcrumb href）
- `pages/rss.xml.ts` の item link を `works/${...}/` に更新
- **リダイレクトは行わない**。旧 `/projects/` は404になる（公開間もない・制作コンテンツ2件・外部リンクほぼ無しのため許容）

**層3: コード識別子**

- `content.config.ts`: コレクション定義 `const projects` → `const works`、`base: "./src/content/works"`、`export const collections` のキー
- `getCollection("projects")` → `getCollection("works")`（`index.astro` / `projects/index.astro` / `[...slug].astro` / `rss.xml.ts`）
- ローカル変数 `project` / `projects` / `recentProjects` → `work` / `works` / `recentWorks`
- コンポーネント `ProjectCard.astro` → `WorkCard.astro`（ファイル名 + `projects/index.astro` のインポート・利用箇所）
- CSSクラス `.project-card` → `.work-card`（`WorkCard.astro` 内。Astroスコープドスタイルなので影響は同ファイル内に閉じる）
- `config.yml`: `name: "projects"` → `"works"`、`folder: "src/content/works"`
- コンテンツフォルダ `src/content/projects/` → `src/content/works/`（既存 `homepage.md` / `sales-to-invoice.md` を `git mv` で移動。ファイル名＝slugは不変）

**層4: コメント（works概念を指すlive コメント全件）**

- `global.css`: `/* ===== Homeページ: 制作（Projects抜粋） ===== */` → `制作（WORKS抜粋）`
- `index.astro`: `// 制作セクションに抜粋する最新プロジェクト（...）` → `最新の制作`
- `layouts/BaseLayout.astro:19`: `// JSON-LD（Article）用の記事情報。プロジェクト詳細ページのみ渡す` → `制作詳細ページのみ渡す`
- `pages/rss.xml.ts:7`: `// プロジェクトコレクションからRSSフィードを生成する。` → `制作コレクションから…`

（`BaseLayout.astro` は層4でのみ触れる。表示・URL・識別子の変更は無い）

**層5: 生きたガイド文書（`docs/coding-standards.md` のworks概念参照を全件）**

grep で洗い出した works概念の参照をすべて works 系に更新する（下記は現時点の全件。実装時は再grepで最終確認）。

| 行 | 現在 | 統一後 |
|----|------|--------|
| :66 | `ProjectCard.astro`（ツリー） | `WorkCard.astro` |
| :68 | `projects/ # プロジェクト記事（Markdown）` | `works/ # 制作記事（Markdown）` |
| :75 | `projects/`（ツリー） | `works/` |
| :91 | `ProjectCard.astro`（命名例） | `WorkCard.astro` |
| :94 | `sample-project.md`（Markdown命名例） | `sample-work.md` |
| :95 | `projects/`（ディレクトリ命名例） | `works/` |
| :127 | `PageType = ... | "projects"` | `... | "works"` |
| :135 | `ProjectEntry`（型命名例） | `WorkEntry` |
| :138 | `ProjectCard.astro`（コンポーネント例） | `WorkCard.astro` |
| :151 | `getPublishedProjects(): Promise<ProjectEntry[]>` | `getPublishedWorks(): Promise<WorkEntry[]>` |
| :270-278, :298, :348, :362-363, :418-419 | `getCollection("projects")` 等のコード例・`project` 変数 | works 系へ |
| :438-439 | フロントマター例 `title: プロジェクト名` / `description: プロジェクトの概要` | `制作名` / `制作の概要` |
| :482 | CSSクラス例 `` `project-card` `` | `` `work-card` `` |

**残す（リポジトリ意味なので変更しない）**: :3 `homepage プロジェクト`、:11 `プロジェクト構成`(目次)、:33 `プロジェクトルート`、:50 `## 2. プロジェクト構成`。

### あわせて実施: CMSコレクションの並び替え

`config.yml` のコレクション記述順を `projects(→works) → pages → settings` から **`pages → works → settings`** に変更する（訪問者が見る順: ページ → 制作 → サイト設定）。

グループ見出しでの仕切り（「コンテンツ」「設定」等）は、Sveltia CMSが単純な設定で対応していれば追加する。**未対応または設定が非自明な場合は並び替えのみとし、無理に実装しない**（YAGNI）。実装計画フェーズでSveltia CMSのドキュメント/挙動を確認して判断する。

### やらないこと（意図的にスコープ外）

- `docs/records/specs/`・`docs/records/plans/`（#89等の日付付き作業記録）は**過去の事実の記録**のため書き換えない。ここに残る `projects` は当時の実装を正しく記述したものであり「乖離」ではない。
- リダイレクトの仕組み（旧URL延命）は行わない（上記の通り）。

## 検証

このリポジトリにテスト基盤はないため、品質ゲートは `npm run build && npm run check`（0 errors / 0 warnings / 0 hints）。加えて以下で「一切の乖離なし」を実証する。

1. **残存ゼロの確認（works概念）**: 2段階で確認する。
   - 明確にworks概念のみを指すトークンは**完全に0件**であること:
     `grep -rniE "projects|projectcard|project-card|制作物" src public docs/coding-standards.md` → 0件
     （`-i` で `Projects`/`PROJECTS`/`ProjectCard` も捕捉。`projects` は本リポジトリで他の正当な用途を持たない）
   - 二義的な `プロジェクト` は**リポジトリ意味の4箇所だけが残る**こと:
     `grep -rn "プロジェクト" src public docs/coding-standards.md` の結果が、`docs/coding-standards.md` の :3 / :11 / :33 / :50（構成・ルート）**のみ**で、`src/` `public/` には0件であること。works概念の「プロジェクト◯◯」が1つでも残っていれば不合格。
2. **URL統一**: 生成物 `dist/works/index.html`・`dist/works/<slug>/index.html` が存在し、`dist/projects/` が存在しないこと。生成HTML内のリンクがすべて `/homepage/works/...`
3. **サブラベル統一**: Home・一覧ページの生成HTMLがともに `WORKS`
4. **コンテンツ維持**: 既存2件（homepage / sales-to-invoice）のslug・タイトル・本文が維持される
5. **RSS**: `dist/rss.xml` の item link が `works/<slug>/`
6. **CMS**: `config.yml` の並びが `pages → works → settings`、コレクション名 `制作`

## リスクと注意

- **URL 404**: 旧 `/projects/` は意図的に404。受け入れ済み。
- **`git mv` の追跡**: コンテンツ2ファイル・`ProjectCard.astro` はリネーム扱いになるよう `git mv` を使う（履歴を保つ）。
- **CSSクラスのグローバル影響**: `.project-card` は `WorkCard.astro` のスコープドスタイル内のみ。`global.css` 側に `.project-card` は無い（`works-*` 系はHome用で既に works）。念のため grep で二重確認する。
