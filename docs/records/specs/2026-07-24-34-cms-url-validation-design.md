# CMS設定のURLウィジェットをコンテンツスキーマのバリデーションと整合させる

- Issue: #34
- 作成日: 2026-07-24
- ステータス: 設計完了

## 背景と課題

CMS（Sveltia CMS）の `public/admin/config.yml` に定義されたURL入力欄は `widget: "string"` のままで、URL形式のバリデーションが行われていない。一方、コンテンツスキーマ `src/content.config.ts` では該当フィールドを `z.url()`（または空文字を許す `emptyableUrl`）で検証している。

この不整合により、コンテンツ編集者がCMSで不正なURL（例: `not-a-url`）を入力しても、CMS画面上ではエラーにならず保存されてしまう。不正値はビルド時の Zod バリデーションで初めてエラーになり、原因特定に時間がかかる。

### あるべき姿

CMSの全URL入力欄で、スキーマと同等のバリデーションが入力時点で行われ、不正なURLはCMS画面上で即座に弾かれる。これによりビルド時のZodエラーを未然に防ぐ。

## スコープ

Issueの実装ヒントは works の `url` フィールド1つを指しているが、スキーマを精査すると同じ不整合がURL型の5フィールドすべてに存在する。CLAUDE.mdの設計原則「まずあるべき姿の全体像を描く」に従い、5フィールドすべてを対象とする。

### 対象フィールド（`public/admin/config.yml`）

| フィールド | スキーマ定義（`content.config.ts`） | CMS現状 |
|---|---|---|
| works `url` | `z.url().optional()` | `widget: string, required: false`（patternなし） |
| settings `social.github` | `emptyableUrl`（URL or `""`） | `widget: string, required: false, default: ""`（patternなし） |
| settings `social.twitter` | `emptyableUrl` | 同上 |
| settings `social.youtube` | `emptyableUrl` | 同上 |
| settings `noteRssUrl` | `emptyableUrl` | 同上 |

`emptyableUrl` は `src/content.config.ts` で `z.union([z.url(), z.literal("")])` として定義されている。

### やらないこと

- `email` フィールド（`config.yml`）は既に `pattern` バリデーションが実装済みのため対象外。
- スキーマ側（`content.config.ts`）の変更は不要。CMS設定をスキーマに合わせるのが本Issueの趣旨。

## 設計

### 変更内容

`public/admin/config.yml` の対象5フィールドそれぞれに、同一の `pattern` オプションを追加する。

```yaml
pattern: ["^(https?://\\S+)?$", "https:// または http:// で始まる正しいURLを入力してください（空欄可）"]
```

既存の `email` フィールドが採用している `pattern: [正規表現, エラーメッセージ]` 形式と揃える。

### 正規表現 `^(https?://\S+)?$` の設計意図

| 要素 | 意図 |
|---|---|
| `^(...)?$` の `?` | グループ全体を任意にし、**空文字を許可**する。全フィールドがoptional/emptyableのため、未入力（空欄）でエラーにならない要件を満たす。CMSがoptional空欄に対してpatternを走らせても通る。 |
| `https?://` | http / https スキームに限定する。 |
| `\S+` | `://` の後に空白以外の文字が1文字以上あることを必須にする。URLに空白は含まれないため妥当。 |

YAML二重引用符内では `\S` を `\\S` とエスケープする（`email` フィールドの `\\s`・`\\.` と同じ流儀）。

### スキーマとの整合性

- works `url`（`z.url().optional()`）: 値ありなら有効URL、空欄可 → pattern一致。
- social / noteRssUrl（`emptyableUrl` = URL or `""`）: 同上。
- `z.url()` は任意スキームを許容する（zod v4）が、これらのフィールドは実運用上すべてWeb URL（http/https）であり、http/https限定でも実害はない。むしろCMS編集者にとって明確なフィードバックになる。

## テスト・検証方針

`config.yml` はビルド生成物ではなく静的配信されるCMS設定のため、pattern自体の動作はSveltia CMSのランタイム挙動に依存する（自動テストの対象外）。本Issueでは以下で検証する。

1. `pnpm build` が成功する（受け入れ条件）。
2. あわせて `pnpm build && pnpm test:run && pnpm typecheck && pnpm lint` を全パス（エラー・warning 0件）で確認する。
3. 目視確認: 正規表現が空文字・有効URL（`https://example.com`）・不正値（`not-a-url`）に対して期待通り一致/不一致になることをレビューで確認する。

## 受け入れ条件（Issue #34）

- [ ] `config.yml` のURL型5フィールドすべてに `pattern`（URL形式の正規表現）が追加されている
- [ ] CMS上で不正なURLを入力した際にエラーメッセージが表示される（pattern不一致）
- [ ] 有効なURL（`https://example.com` 等）は問題なく保存できる
- [ ] 空欄（未入力）の場合もエラーにならない（optionalフィールドのため）
- [ ] `npm run build` が成功する
