# CMS URLバリデーション整合 実装計画

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `public/admin/config.yml` のURL型5フィールドに `pattern` バリデーションを追加し、`content.config.ts` のスキーマ（`z.url()` / `emptyableUrl`）と整合させる。

**Architecture:** CMS（Sveltia CMS）の各URLフィールドに、既存 `email` フィールドと同じ `pattern: [正規表現, エラーメッセージ]` 形式のバリデーションを追加する。正規表現 `^(https?://\S+)?$`（YAML内では `\\S`）は「空文字・http/https URL」を許可し、それ以外を弾く。スキーマ側の変更は不要。

**Tech Stack:** Sveltia CMS（`config.yml`）、Astro Content Collections（`zod`）

**設計ドキュメント:** `docs/records/specs/2026-07-24-34-cms-url-validation-design.md`

---

## 補足: なぜTDDの自動テストが無いか

`config.yml` はビルド生成物ではなく静的配信されるCMS設定であり、`pattern` の実際の動作はSveltia CMSのランタイム挙動に依存する（プロジェクトのテストハーネスの対象外）。そのため本計画では、自動テストの代わりに **(a) 正規表現の挙動を手元で検証する手順** と **(b) ビルド・型チェックの全パス確認** を品質ゲートとする。

> 注: このプロジェクトは **npm**（`package-lock.json`）を使い、`package.json` の scripts は `dev` / `build` / `preview` / `check` / `astro` のみ。テストフレームワーク・lint・独立したtypecheckスクリプトは存在しないため、共通CLAUDE.mdの汎用検証コマンド（`pnpm test:run` 等）ではなく、実在する `npm run build`（`astro build`）と `npm run check`（`astro check` = 型・Astroチェック）を品質ゲートとする。

---

## File Structure

- Modify: `public/admin/config.yml` — 対象5フィールドに `pattern` を追加
  - `:58` works `url`
  - `:79` settings `social.github`
  - `:80` settings `social.twitter`
  - `:81` settings `social.youtube`
  - `:82` settings `noteRssUrl`

追加する `pattern` は5フィールドすべて同一:

```yaml
pattern: ["^(https?://\\S+)?$", "https:// または http:// で始まる正しいURLを入力してください（空欄可）"]
```

---

## Task 1: 正規表現の挙動を事前検証する

自動テストが無い代わりに、実装前に正規表現が意図通り動くことを確認し、期待値を固定する。

**Files:** なし（検証のみ）

- [ ] **Step 1: 正規表現を代表7ケースで検証する**

Run:
```bash
node -e '
const re = /^(https?:\/\/\S+)?$/;
const cases = [
  ["", true],                       // 空欄可
  ["https://example.com", true],    // 有効(https)
  ["http://x.io", true],            // 有効(http)
  ["not-a-url", false],             // 不正
  ["ftp://x.com", false],           // http/https限定
  ["https://", false],             // ホストなし
  ["https://ex ample.com", false], // 空白混入
];
let ok = true;
for (const [input, expected] of cases) {
  const actual = re.test(input);
  const pass = actual === expected;
  if (!pass) ok = false;
  console.log(`${pass ? "OK " : "NG "} test("${input}") = ${actual} (expected ${expected})`);
}
process.exit(ok ? 0 : 1);
'
```

Expected: 全7行が `OK`、終了コード0。

> 注: このNode正規表現リテラルはJS用のエスケープ（`\/` `\S`）。`config.yml` に書く際はYAML二重引用符内なので `\\S` になる（バックスラッシュのエスケープ差異に注意）。

---

## Task 2: config.yml の5フィールドに pattern を追加する

**Files:**
- Modify: `public/admin/config.yml`

- [ ] **Step 1: works `url` フィールドに pattern を追加**

`public/admin/config.yml` の works コレクション（`:58` 付近）の url フィールドを変更する。

変更前:
```yaml
      - { label: "URL", name: "url", widget: "string", required: false, hint: "制作の公開URL（あれば）" }
```

変更後:
```yaml
      - { label: "URL", name: "url", widget: "string", required: false, pattern: ["^(https?://\\S+)?$", "https:// または http:// で始まる正しいURLを入力してください（空欄可）"], hint: "制作の公開URL（あれば）" }
```

- [ ] **Step 2: social 3フィールド（github/twitter/youtube）に pattern を追加**

`public/admin/config.yml` の settings コレクションの social（`:79`〜`:81`）を変更する。

変更前:
```yaml
              - { label: "GitHub", name: "github", widget: "string", required: false, default: "", hint: "プロフィールのURL。空にすると非表示になります" }
              - { label: "X（Twitter）", name: "twitter", widget: "string", required: false, default: "", hint: "プロフィールのURL。空にすると非表示になります" }
              - { label: "YouTube", name: "youtube", widget: "string", required: false, default: "", hint: "チャンネルのURL。空にすると非表示になります" }
```

変更後:
```yaml
              - { label: "GitHub", name: "github", widget: "string", required: false, default: "", pattern: ["^(https?://\\S+)?$", "https:// または http:// で始まる正しいURLを入力してください（空欄可）"], hint: "プロフィールのURL。空にすると非表示になります" }
              - { label: "X（Twitter）", name: "twitter", widget: "string", required: false, default: "", pattern: ["^(https?://\\S+)?$", "https:// または http:// で始まる正しいURLを入力してください（空欄可）"], hint: "プロフィールのURL。空にすると非表示になります" }
              - { label: "YouTube", name: "youtube", widget: "string", required: false, default: "", pattern: ["^(https?://\\S+)?$", "https:// または http:// で始まる正しいURLを入力してください（空欄可）"], hint: "チャンネルのURL。空にすると非表示になります" }
```

- [ ] **Step 3: `noteRssUrl` フィールドに pattern を追加**

`public/admin/config.yml` の settings コレクションの noteRssUrl（`:82`）を変更する。

変更前:
```yaml
          - { label: "note RSS URL", name: "noteRssUrl", widget: "string", required: false, default: "", hint: "noteのRSS URL（例: https://note.com/xxx/rss）。空にするとブログページのRSS連携が止まります" }
```

変更後:
```yaml
          - { label: "note RSS URL", name: "noteRssUrl", widget: "string", required: false, default: "", pattern: ["^(https?://\\S+)?$", "https:// または http:// で始まる正しいURLを入力してください（空欄可）"], hint: "noteのRSS URL（例: https://note.com/xxx/rss）。空にするとブログページのRSS連携が止まります" }
```

- [ ] **Step 4: 差分を確認する**

Run: `git diff public/admin/config.yml`
Expected: 5フィールドに `pattern: [...]` が追加され、他の属性・順序・インデントに変更がないこと。email フィールド（変更対象外）が変わっていないこと。

---

## Task 3: 検証（唯一の品質ゲート）

CLAUDE.mdのローカル検証ルールに従い、全パス（エラー・warning 0件）を確認する。

**Files:** なし（検証のみ）

- [ ] **Step 1: 依存関係の確認**

このタスクは `package.json` / `package-lock.json` を変更しないため、クリーンインストールは不要。既存 `node_modules` のまま進めてよい。

- [ ] **Step 2: ビルド・型チェックを全パス確認**

Run: `npm run build && npm run check`
Expected: すべて成功。エラー・warningともに0件。

> ⚠️ warningが出た場合、既存の問題であっても0件になるまで修正する（CLAUDE.mdルール）。
> `npm run check`（`astro check`）が型・Astroコンポーネントの整合を検証する。このプロジェクトにはテスト・lintスクリプトが無いため、この2コマンドが検証の全て。

---

## Task 4: コミット

- [ ] **Step 1: 変更をコミット**

Run:
```bash
git add public/admin/config.yml
git commit -m "feat: CMSのURL入力欄にpatternバリデーションを追加する"
```

> コミット本文の末尾には環境指定のCo-Authored-By / Claude-Session行を付与する。

- [ ] **Step 2: 受け入れ条件の最終確認**

設計ドキュメントの受け入れ条件をすべて満たしていることを確認する:
- [ ] URL型5フィールドすべてに `pattern` が追加されている
- [ ] 正規表現が不正URLを弾き、有効URL・空欄を許可する（Task 1で検証済み）
- [ ] `npm run build` が成功する（Task 3で検証済み）
