# エディトリアルHome + アニメーション移植 設計書

- **Issue**: #53 Homeを和モダン・エディトリアルデザイン＋アニメーションに刷新（テンプレートから移植）
- **作成日**: 2026-07-09
- **移植元**: `astro-cms-homepage-template`（template main、#7 デザイン・#8 アニメーション実装済み）
- **ブランチ**: `feature/53-editorial-home-port`

## 1. 概要

現状の Home は `<h1>Welcome</h1>` のスタブ。姉妹リポジトリ `astro-cms-homepage-template` に実装済みの和モダン・エディトリアルデザイン（季節ヒーロー背景・文字組み・Skills/Contact）と Home アニメーション（入場 stagger・スクロール登場）を、本サイトの構成（**View Transitions / ClientRouter・ダークモード・system-ui 基盤**）に合わせて移植する。

**ブレインストーミングで確定した方針**:

| 論点 | 決定 |
|------|------|
| スコープ分割 | **単一PR**でデザインとアニメを一体で移植（両者は密結合） |
| トークン統合 | homepage 既存トークン（`--color-text/bg/border` 系）に**集約**。テンプレ固有の墨色系はマッピング |
| フォント配信 | **Google Fonts CDN**（テンプレ踏襲、preconnect + `display=swap`） |
| 連絡先 | `SITE_AUTHOR = "アサオカ"`（**フルネームではなく「アサオカ」のみ**）、`EMAIL = "asaoka.biz@gmail.com"` を公開 |
| ClientRouter 対応 | **案A**: スクリプトを初期化関数化し `astro:page-load` で実行、`astro:before-swap` で cleanup |

## 2. ゴールと非ゴール

### ゴール（受け入れ条件・Issue #53 より）

- [ ] Home が和モダン・エディトリアルデザイン（季節ヒーロー・文字組み・Skills/Contact）で表示される
- [ ] ヒーロー入場の stagger（順次フェードアップ＋罫線伸長）が再生される
- [ ] スクロールで Skills・Contact が2段階でフェードインする
- [ ] **ClientRouter によるクライアント遷移後も**全アニメーション・季節背景が動く（`astro:page-load` 対応）
- [ ] **ダークモード**（`prefers-color-scheme: dark`）で配色が破綻せず可読性を保つ
- [ ] `prefers-reduced-motion: reduce` / JS無効時にアニメ無効化・全内容表示
- [ ] モバイル幅（375px 等）で破綻しない
- [ ] `npm run build` 成功・自動デプロイで反映される

### 非ゴール（スコープ外）

- Home コンテンツ（名前・キャッチ・Skills・Contact）の Sveltia CMS 化（**まずはハードコードで移植**）
- ホバー微動・季節トランジション等の追加演出（移植元でもスコープ外）
- Blog / Projects ページ固有のアニメーション
- テンプレート側リポジトリの中立化・汎用スターター整理（本移植完了後の別作業）

## 3. アーキテクチャ / ファイル変更マップ

| 種別 | ファイル | 内容 |
|------|---------|------|
| 🆕 新規 | `src/components/SeasonalHero.astro` | 季節連動背景（vanilla JS + `requestAnimationFrame`、決定論的粒子）。ヒーローコンテンツを slot で受ける |
| 🆕 新規 | `src/scripts/reveal.ts` | `IntersectionObserver` による `[data-reveal]` のスクロール登場 |
| ✏️ 変更 | `src/pages/index.astro` | スタブ → エディトリアル Home（ヒーロー＋Skills＋Contact） |
| ✏️ 変更 | `src/styles/global.css` | フォント変数・keyframes・reveal CSS・季節アクセント・reduced-motion 二重担保 |
| ✏️ 変更 | `src/layouts/BaseLayout.astro` | head inline（`data-season` / `js` / `reduced-motion`）＋ reveal 読込＋ページ遷移対応 |
| ✏️ 変更 | `src/components/BaseHead.astro` | Google Fonts preconnect + stylesheet（`display=swap`） |
| ✏️ 変更 | `src/consts.ts` | `SITE_AUTHOR = "アサオカ"`、`EMAIL` を追加 |

## 4. トークン統合設計（既存に集約）

homepage 既存トークンを正とし、テンプレ固有トークンをマッピングする。トークン体系の二重化を避ける。

| テンプレ側 | homepage 側の扱い |
|-----------|------------------|
| `--color-ink`（墨色・本文/見出し） | 既存 `--color-text` に集約 |
| `--color-ink-soft`（補助墨色） | 必要な箇所のみ新規 `--color-text-soft` を1つ追加（既存に無いため） |
| `--color-surface` | 既存 `--color-tag-bg` に集約 |
| `--color-border` | 既存 `--color-border`（同名）をそのまま使用 |
| `--color-muted` | 既存 `--color-muted`（同名）をそのまま使用 |
| `--season-accent`（季節4色） | **新規追加**（テンプレ固有で既存に無い）。ライト/ダークで別値 |
| `--font-serif` / `--font-sans` | **新規追加**（Google Fonts の明朝/ゴシック） |
| `--anim-ease` / `--anim-duration` / `--hero-rule-width` | **新規追加**（アニメーション用） |

### ダークモード
homepage 既存の `@media (prefers-color-scheme: dark)` ブロック内に、追加した `--season-accent` のダーク版を**追記して一元管理**する。テンプレのダークモードトークンは既存ブロックへ統合し、独立した `@media` ブロックを増やさない。

### 季節アクセント（4色）
```
spring: #e48ca0 / summer: #3a9daa / autumn: #cf6a2e / winter: #87a3bc（ライト）
ダーク版はコントラストを確保した明度の値を別途定義（例 spring: #e79aae）
```

## 5. コンポーネント設計

### 5.1 SeasonalHero.astro
- **技術**: vanilla JS + `requestAnimationFrame`。Canvas 不使用（DOM 要素の `transform` で粒子操作）。外部ライブラリ依存なし。
- **季節判定**: `html[data-season]`（BaseLayout inline が付与）を優先、無ければ現在月から算出（`winter: 12,1,2` / `spring: 3-5` / `summer: 6-8` / `autumn: 9-11`）。
- **粒子生成**: `mulberry32(seed)` による決定論的乱数で配置を固定（負荷軽減・レイアウト安定）。春/秋/冬は落下粒子、夏は波紋、共通で日輪が呼吸動作。
- **初期化の関数化（ClientRouter 対応）**: 従来の即時実行を `initSeasonalHero()` に切り出し、`astro:page-load` で呼ぶ。rAF ハンドルを保持し、`astro:before-swap` で `cancelAnimationFrame` して**メモリリークを防ぐ**（案A）。

### 5.2 reveal.ts
- **責務**: `[data-reveal]` 要素を `IntersectionObserver` で監視し、ビューポート進入時に `.is-visible` を付与（一度出たら `unobserve`）。`rootMargin: "0px 0px -10% 0px"`。
- **reduced-motion**: `html.reduced-motion` が付いていれば Observer を張らず即リターン（CSS 側で最初から可視）。
- **ClientRouter 対応**: `initReveal()` を export し、`BaseLayout` で `astro:page-load` にバインド。`astro:before-swap` で既存 Observer を `disconnect`（案A）。

### 5.3 index.astro（移植元の構造をそのまま複製）
- ヒーロー: `.hero-role`（"SOFTWARE ENGINEER / SRE"）→ `.hero-name`（`{SITE_AUTHOR}`）→ `.hero-rule`（罫線）→ `.hero-copy`（"つくることと、動かし続けること。"）
- Skills（見出し「壱 / 技術 / SKILLS」）: `["TypeScript", "React", "Node.js", "AWS", "Kubernetes", "Terraform", "Grafana", "Prometheus"]` を「・」区切りで表示。`data-reveal="delayed"`。
- Contact（見出し「弐 / 連絡先 / CONTACT」）: GitHub（`SOCIAL_LINKS.github`）、EMAIL（`mailto:${EMAIL}`）。`data-reveal="delayed"`。

### 5.4 BaseLayout.astro
- **head inline（`is:inline`、初回ペイント前に同期実行）**:
  - `data-season` を現在月から算出して `html` に付与（FOUC 防止）
  - `html.classList.add("js")`、reduced-motion 時に `html.classList.add("reduced-motion")`
  - ※ ClientRouter は `html` 要素を置換しないため、これらの属性/クラスは遷移をまたいで保持される。
- **スクリプト読込**: `reveal.ts` を import し、`astro:page-load` / `astro:before-swap` へのバインドを行う（SeasonalHero の初期化も含め、既存 `Header.astro` の `astro:page-load` 実装と一貫させる）。

### 5.5 BaseHead.astro
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" />
```

### 5.6 consts.ts（追加）
```typescript
export const SITE_AUTHOR = "アサオカ"; // ヒーロー名・フッター著者（フルネームにしない）
export const EMAIL = "asaoka.biz@gmail.com"; // Contact の mailto
```

## 6. ClientRouter 対応（案A・詳細）

初回ロード前提だったテンプレのスクリプトを、遷移対応の形にリファクタする。

```
astro:page-load   → initSeasonalHero() / initReveal() を実行（初回・遷移後の両方で発火）
astro:before-swap → cancelAnimationFrame(rAF) / observer.disconnect() で後始末
```

- 既存 `Header.astro` が `astro:page-load` を使用しているため、パターンとして一貫する。
- rAF を止めずに遷移を繰り返すとメモリリーク・多重ループになるため、`before-swap` の cleanup は必須。
- CSS の入場アニメ（`.hero-role` 等の `animation`）は要素が再マウントされる遷移後にも再生されるが、`html.js` クラスは保持されるため初期隠し状態のセレクタは維持される。

## 7. ダークモード / 粒子色

- **粒子色の沈み込み対策**: テンプレの `PARTICLE_COLORS`（固定RGB）を **CSS カスタムプロパティ参照**に変え、`@media (prefers-color-scheme: dark)` でダーク時の粒子色を別定義する。ライト/ダークの双方でヒーロー背景に対するコントラストを確保する。
- **季節アクセント**: 下線・番号・区切りに使う `--season-accent` はダーク版を別値で定義。

## 8. アクセシビリティ（テンプレ同様の二重担保）

| 条件 | 挙動 | 実装 |
|------|------|------|
| `prefers-reduced-motion: reduce` | アニメ無効・即最終状態 | CSS `@media` ＋ inline の `html.reduced-motion` クラス（reveal.ts が Observer を張らない） |
| JS 無効 | 全内容が最初から表示（隠れない） | `html.js` クラスが付かず `[data-reveal]` の初期隠しセレクタが適用されない |
| SeasonalHero（reduced-motion） | 中間フレームで固定・日輪 `scale(1)` | rAF を回さず `tick()` を1回だけ適用 |

## 9. テスト / 検証方針

**本プロジェクト固有の注意**: `package.json` には test/lint スクリプトが存在せず、`npm run build` と `npm run check`（`astro check`）のみ。したがって品質ゲートは以下とする（グローバル規約の `pnpm test:run / typecheck / lint` は本プロジェクトに存在しないため適用しない）。

```bash
npm run build   # プロダクションビルド成功
npm run check   # astro check（型・診断）warning 0 件
```

**手動検証（受け入れ条件に対応）**:

| ケース | 確認内容 |
|--------|---------|
| 正常系（入場） | 初回ロードで stagger 入場・罫線伸長・季節背景が再生 |
| 正常系（登場） | スクロールで Skills・Contact が2段階フェードイン |
| 正常系（遷移） | 別ページ → Home のクライアント遷移後も全アニメ・季節背景が再生 |
| 正常系（配色） | ライト/ダーク両方で文字組みが崩れず可読性（コントラスト）維持 |
| 異常系（reduced-motion） | 即最終状態で全表示 |
| 異常系（JS無効） | `[data-reveal]` が隠れず全表示 |
| 境界値（モバイル） | 375px 幅で破綻しない |

## 10. リスクと対応

| リスク | 対応 |
|--------|------|
| rAF のメモリリーク（遷移繰り返し） | `astro:before-swap` で `cancelAnimationFrame`（案A） |
| ダーク時に粒子が背景に沈む | `PARTICLE_COLORS` を CSS 変数化しダーク版を別定義 |
| トークン二重化による混乱 | 既存トークンに集約、新規は `--season-accent`・フォント・アニメ変数に限定 |
| Google Fonts CDN の初回描画レイテンシ | `preconnect` ＋ `display=swap` でフォールバック表示（FOUT 回避） |
| フルネーム誤表示 | `SITE_AUTHOR = "アサオカ"`（フルネームにしない）をヒーロー・フッター両方に適用 |
