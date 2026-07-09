# エディトリアルHome + アニメーション移植 実装計画

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** homepage の Home を、テンプレの和モダン・エディトリアルデザイン＋アニメーション（季節ヒーロー・入場stagger・スクロール登場）に、ClientRouter / ダークモード / Google Fonts 対応で移植する。

**Architecture:** テンプレ実装を複製ベースで移植。CSSトークンは homepage 既存体系（`--color-text/bg/border` 系）に集約し、テンプレ固有は `--season-accent`・フォント・アニメ変数のみ新規追加。初回ロード前提だったスクリプト（SeasonalHero の rAF・reveal の Observer）を init 関数化し、`astro:page-load` で再初期化・`astro:before-swap` で cleanup する（案A）。

**Tech Stack:** Astro v6、TypeScript（strict）、vanilla JS（`requestAnimationFrame` / `IntersectionObserver`）、Google Fonts CDN。外部ライブラリの追加なし。

---

## ⚠️ このプロジェクト固有の検証方針（TDD の代替）

本プロジェクトの `package.json` には **test / lint / typecheck スクリプトが存在しない**（`dev` / `build` / `preview` / `check` / `astro` のみ）。したがって標準の TDD（失敗テスト→実装）は適用せず、各タスクの検証は以下に置換する（spec §9・グローバル規約の `pnpm test:run/typecheck/lint` は本プロジェクトに無いため不適用）。

```bash
npm run check   # astro check（型・テンプレート診断）。warning も 0 件にする
npm run build   # プロダクションビルド成功
```

- Astro コンポーネント／CSS の**見た目**は自動テスト対象外。ビジュアル検証は最終 Task 9 で `npm run dev` により目視で行う。
- 各実装 Task は「変更 → `npm run check`（必要に応じ `npm run build`）→ commit」のリズムで進める。

---

## スコープ確定事項（ブレインストーミングで決定）

| 項目 | 決定 |
|------|------|
| フォント適用範囲 | **全サイト**（`html` グローバル）。他ページも和モダンフォントに。崩れは Task 9 で目視確認 |
| エディトリアルリンク（墨色＋季節下線） | **Home にスコープ**（`.home-section` 配下）。既存 `--color-link`（404.astro のみ使用）は不変 |
| `SITE_AUTHOR` | `"アサオカ"`（フルネームにしない）。**ヒーロー名のみ**で使用（テンプレ Footer は著者名を出さないため Footer 変更なし） |
| 粒子色ダーク対応 | JS 内 `matchMedia` で `ACCENT` / `PARTICLE_COLORS` をライト/ダーク切替（落下粒子＋夏の波紋の2経路） |

---

## ファイル構成

| 種別 | パス | 責務 |
|------|------|------|
| Modify | `src/consts.ts` | `SITE_AUTHOR` / `EMAIL` 追加 |
| Modify | `src/components/BaseHead.astro` | Google Fonts preconnect + stylesheet |
| Modify | `src/styles/global.css` | フォント・トークン・Home 用スタイル・アニメ・reveal・reduced-motion |
| Create | `src/scripts/reveal.ts` | `IntersectionObserver` によるスクロール登場（init/teardown） |
| Create | `src/components/SeasonalHero.astro` | 季節連動背景（init/teardown、ダーク粒子2経路） |
| Modify | `src/layouts/BaseLayout.astro` | head inline（data-season/js/reduced-motion）＋ reveal バインド |
| Modify | `src/pages/index.astro` | エディトリアル Home（ヒーロー＋Skills＋Contact） |

参照: 移植元は `/Users/asaokatakuya/SynologyDrive/workspace/private/astro-cms-homepage-template/`。コーディング規約は `docs/coding-standards.md`（フロントマターは import → Props型 → ロジックの順）。

---

## Task 1: consts に SITE_AUTHOR / EMAIL を追加

**Files:**
- Modify: `src/consts.ts`

- [ ] **Step 1: 定数を追加**

`src/consts.ts` の末尾（`NOTE_RSS_URL` の下）に追記する。

```typescript
// Home ヒーローの表示名（フルネームにしない）
export const SITE_AUTHOR = "アサオカ";
// Contact の mailto に使うメールアドレス
export const EMAIL = "asaoka.biz@gmail.com";
```

- [ ] **Step 2: 検証**

Run: `npm run check`
Expected: エラー 0 / warning 0（未使用でも型エラーにはならない）

- [ ] **Step 3: Commit**

```bash
git add src/consts.ts
git commit -m "feat: #53 consts に SITE_AUTHOR・EMAIL を追加"
```

---

## Task 2: BaseHead に Google Fonts を追加

**Files:**
- Modify: `src/components/BaseHead.astro`

- [ ] **Step 1: フォント読み込みを追加**

`src/components/BaseHead.astro` の `<link rel="icon" ... />`（19行目）の直後に追記する。

```html
<!-- Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
/>
```

- [ ] **Step 2: 検証**

Run: `npm run check && npm run build`
Expected: 両方成功。build 後 `dist/` の生成 HTML に上記 `<link>` が含まれる

- [ ] **Step 3: Commit**

```bash
git add src/components/BaseHead.astro
git commit -m "feat: #53 Google Fonts（明朝・ゴシック）を読み込む"
```

---

## Task 3: global.css にフォント・トークン基盤を追加

既存トークンに集約しつつ、テンプレ固有トークン（フォント・季節アクセント・アニメ）を追加する。**既存の `--color-text/bg/border/tag-bg/muted/link` は残す**。

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: `:root`（ライト）にトークンを追加**

`src/styles/global.css` の `:root { ... }`（1〜9行目）を、既存トークンを保ったまま次で置き換える。

```css
:root {
  color-scheme: light dark; /* ネイティブUI（フォーム/スクロールバー）をテーマ追従 */
  --content-max-width: 800px;
  --color-bg: #ffffff;
  --color-text: #333333;
  --color-text-soft: #4a5560; /* 補助本文（skill-list 等）。既存に無いため新規 */
  --color-border: #e0e0e0;
  --color-tag-bg: #f0f0f0;
  --color-muted: #666666;
  --color-link: #0066cc;

  /* フォント（Google Fonts） */
  --font-serif: "Shippori Mincho", "Hiragino Mincho ProN", serif;
  --font-sans: "Zen Kaku Gothic New", system-ui, -apple-system, sans-serif;

  /* アニメーション */
  --hero-rule-width: 52px;
  --anim-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --anim-duration: 0.7s;

  /* 季節アクセント（html[data-season] に連動。デフォルト: 春） */
  --season-accent: #e48ca0;
}
html[data-season="summer"] {
  --season-accent: #3a9daa;
}
html[data-season="autumn"] {
  --season-accent: #cf6a2e;
}
html[data-season="winter"] {
  --season-accent: #87a3bc;
}
```

- [ ] **Step 2: ダークモードブロックにトークンを追加**

既存の `@media (prefers-color-scheme: dark) { :root { ... } }`（11〜20行目）を次で置き換える（既存トークンは保持し、追加分を足す）。

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #1a1a1a;
    --color-text: #e0e0e0;
    --color-text-soft: #c3c1bb;
    --color-border: #333333;
    --color-tag-bg: #2a2a2a;
    --color-muted: #999999;
    --color-link: #5599ff;
    --season-accent: #e79aae; /* 春（ダーク版） */
  }
  html[data-season="summer"] {
    --season-accent: #5cbdca;
  }
  html[data-season="autumn"] {
    --season-accent: #e0904f;
  }
  html[data-season="winter"] {
    --season-accent: #a3bdd4;
  }
}
```

- [ ] **Step 3: html / 見出し / overflow を更新**

既存の `html { ... }`（30〜33行目）を次で置き換え、フォントと行間を反映する。`color` は既存どおり `body` 側で指定するため html には足さない。

```css
html {
  font-family: var(--font-sans);
  line-height: 1.7;
}

h1,
h2,
h3 {
  font-family: var(--font-serif);
  font-weight: 600;
  letter-spacing: 0.12em;
  line-height: 1.4;
}
```

full-bleed ヒーローの横スクロールを防ぐため、`img { ... }` ルールの直後に追加する。

```css
/* full-bleed（100vw）のヒーローが生む横溢れを防ぐ */
html,
body {
  overflow-x: clip;
}
```

- [ ] **Step 4: 検証**

Run: `npm run check && npm run build`
Expected: 両方成功。Task 9 で全ページのフォント反映を目視確認する（この時点で About/Blog/Projects も新フォントになる）

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: #53 フォント・季節アクセント・アニメ用トークンを追加"
```

---

## Task 4: global.css に Home 用スタイル（レイアウト・アニメ・reveal）を追加

移植元 `global.css` の 111〜286 行（Home ヒーロー〜reveal）を移植する。**トークン名を homepage 体系へ置換**し、**リンクスタイルは Home にスコープ**する。

**Files:**
- Modify: `src/styles/global.css`

**トークン置換ルール（移植元 → homepage）:**

| 移植元 | 置換後 |
|--------|--------|
| `var(--color-ink)` | `var(--color-text)` |
| `var(--color-ink-soft)` | `var(--color-text-soft)` |
| `var(--color-surface)` | `var(--color-tag-bg)` |
| `var(--color-muted)` / `var(--color-border)` / `var(--season-accent)` | そのまま（同名で追加済み） |

- [ ] **Step 1: Home 用スタイルを追記**

`src/styles/global.css` の末尾に次を追加する（置換ルール適用済みの最終形）。

```css
/* ===== Homeページ: エディトリアルリンク（Home スコープ・墨色文字＋季節下線） ===== */
.home-section a {
  color: var(--color-text);
  text-decoration: underline;
  text-decoration-color: var(--season-accent);
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
}

/* ===== Homeページ: ヒーロー ===== */
.home-hero {
  width: 100vw;
  margin-inline: calc(50% - 50vw);
  margin-top: -1rem; /* main の上パディングを打ち消しヘッダー直下に密着 */
}
.hero-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  text-align: left;
  padding: clamp(1.5rem, 5vw, 3.5rem);
  color: var(--color-text);
}
.hero-role {
  font-family: var(--font-serif);
  font-size: clamp(0.7rem, 1.6vw, 0.85rem);
  letter-spacing: 0.35em;
  color: var(--season-accent);
  margin-bottom: 1rem;
}
.hero-name {
  font-size: clamp(2.2rem, 6vw, 3.4rem);
  letter-spacing: 0.12em;
  line-height: 1.25;
}
.hero-rule {
  width: 0;
  height: 1px;
  background: var(--color-text);
  margin: 1.25rem 0;
}
.hero-copy {
  font-family: var(--font-serif);
  font-size: clamp(0.95rem, 2vw, 1.15rem);
  letter-spacing: 0.22em;
}

/* ===== Homeページ: ヒーロー入場アニメーション（純CSS・JS無効でも再生） ===== */
@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes hero-grow-rule {
  from {
    width: 0;
  }
  to {
    width: var(--hero-rule-width);
  }
}
.hero-role {
  opacity: 0;
  animation: hero-fade-up var(--anim-duration) var(--anim-ease) 0.1s forwards;
}
.hero-name {
  opacity: 0;
  animation: hero-fade-up var(--anim-duration) var(--anim-ease) 0.35s forwards;
}
.hero-rule {
  animation: hero-grow-rule 0.6s var(--anim-ease) 0.7s forwards;
}
.hero-copy {
  opacity: 0;
  animation: hero-fade-up var(--anim-duration) var(--anim-ease) 0.95s forwards;
}

/* reduced-motion: ヒーロー入場を無効化し最終状態で静止 */
@media (prefers-reduced-motion: reduce) {
  .hero-role,
  .hero-name,
  .hero-copy {
    opacity: 1;
    animation: none;
  }
  .hero-rule {
    width: var(--hero-rule-width);
    animation: none;
  }
}

/* ===== Homeページ: セクション共通 ===== */
.home-section {
  margin-block: 4rem;
}
.section-heading {
  display: flex;
  align-items: baseline;
  gap: 0.9em;
  margin-bottom: 1.5rem;
}
.section-num {
  font-size: 0.9em;
  color: var(--season-accent);
}
.section-title {
  letter-spacing: 0.25em;
}
.section-label {
  font-family: var(--font-sans);
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.3em;
  color: var(--color-muted);
}

/* ===== Homeページ: スキル（・区切りの文字組み） ===== */
.skill-list {
  list-style: none;
  color: var(--color-text-soft);
  line-height: 2.4;
  letter-spacing: 0.06em;
}
.skill-list li {
  display: inline;
}
.skill-list li + li::before {
  content: "・";
  color: var(--season-accent);
  margin: 0 0.5em;
}

/* ===== Homeページ: Contact ===== */
.contact-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.contact-label {
  display: inline-block;
  width: 5em;
  font-size: 0.68rem;
  letter-spacing: 0.2em;
  color: var(--color-muted);
}

/* ===== Homeページ: スクロール登場（data-reveal） =====
   初期の隠し状態は「JS有効かつ reduced-motion でない」ときのみ適用。
   → JS無効時は html.js が付かず隠れない。reduced-motion 時はセレクタが外れ最初から可視。 */
html.js:not(.reduced-motion) [data-reveal] {
  opacity: 0;
  transform: translateY(16px);
  transition:
    opacity var(--anim-duration) var(--anim-ease),
    transform var(--anim-duration) var(--anim-ease);
}
html.js:not(.reduced-motion) [data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0);
}
/* 2段階登場: 中身側（delayed）に遅延を与え、見出し→中身の順にする */
html.js:not(.reduced-motion) [data-reveal="delayed"] {
  transition-delay: 0.23s;
}

/* reduced-motion: 二重の担保（JSのクラス付与失敗時も隠れたままにしない） */
@media (prefers-reduced-motion: reduce) {
  [data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 2: 検証**

Run: `npm run check && npm run build`
Expected: 両方成功

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: #53 Home のエディトリアルレイアウト・入場/登場アニメCSSを追加"
```

---

## Task 5: reveal.ts を作成（init/teardown で ClientRouter 対応）

移植元 `src/scripts/reveal.ts` の Observer ロジックを、`astro:page-load` で呼べる init 関数に変える。

**Files:**
- Create: `src/scripts/reveal.ts`

- [ ] **Step 1: ファイルを作成**

```typescript
// data-reveal を付けた要素を、ビューポート進入時に一度だけ可視化する。
// js / reduced-motion クラスの付与は BaseLayout の head 内 inline script が担う（初回ペイント前）。
// ClientRouter 下での再初期化に対応するため init/teardown を公開する。

let observer: IntersectionObserver | null = null;

// [data-reveal] の監視を開始する。astro:page-load ごとに呼ばれる。
export function initReveal(): void {
  // reduced-motion 時はCSS側で最初から可視のため監視を張らない
  if (document.documentElement.classList.contains("reduced-motion")) return;

  // 前回の監視が残っていれば破棄してから張り直す（多重監視の防止）
  observer?.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer?.unobserve(entry.target); // 一度出たら解除
        }
      }
    },
    // 少しスクロールしてから発火させ、初期ビューポート内要素の即時発火を和らげる
    { rootMargin: "0px 0px -10% 0px" },
  );

  for (const el of document.querySelectorAll<HTMLElement>("[data-reveal]")) {
    observer.observe(el);
  }
}

// ページ離脱（astro:before-swap）時に監視を破棄する。
export function teardownReveal(): void {
  observer?.disconnect();
  observer = null;
}
```

- [ ] **Step 2: 検証**

Run: `npm run check`
Expected: 成功（この時点では未使用だが型エラーは出ない）

- [ ] **Step 3: Commit**

```bash
git add src/scripts/reveal.ts
git commit -m "feat: #53 スクロール登場（reveal）を init/teardown 化して追加"
```

---

## Task 6: SeasonalHero.astro を作成（init/teardown・ダーク粒子2経路）

移植元 `src/components/SeasonalHero.astro` を移植し、次の3点を変換する。
1. 即時実行の `for` ループを `initSeasonalHero()` に包み、`astro:page-load` でバインド
2. rAF ハンドルを保持し `teardownSeasonalHero()`（`astro:before-swap`）で `cancelAnimationFrame` ＋ 生成粒子の除去
3. `matchMedia` でライト/ダークを判定し `ACCENT` / `PARTICLE_COLORS` を切替（落下粒子＋夏の波紋の2経路）

**Files:**
- Create: `src/components/SeasonalHero.astro`

- [ ] **Step 1: フロントマター＋マークアップ＋style を作成（移植元と同一）**

```astro
---
// SeasonalHero.astro — 四季のヒーロー背景アニメーション（依存なし・素のJS）
// season="auto" は訪問時の月で季節を自動判定（html[data-season] があればそれを優先）。
// 子要素はそのまま前面にスロット表示される（見出しなど）。
interface Props {
  season?: "spring" | "summer" | "autumn" | "winter" | "auto";
  density?: number;
  speed?: number;
  height?: string;
}
const { season = "spring", density = 1, speed = 1, height = "600px" } = Astro.props;
---

<div
  data-seasonal-hero
  data-season={season}
  data-density={density}
  data-speed={speed}
  style={`position: relative; overflow: hidden; height: ${height};`}
>
  <div data-sh-layer style="position: absolute; inset: 0; pointer-events: none;"></div>
  <div style="position: relative; z-index: 1; height: 100%;">
    <slot />
  </div>
</div>
```

`<style>` ブロックは移植元 176〜210 行を**そのまま**貼る（背景グラデーションはコンポーネント固有のダーク演出として意図的に保持。spec §7）。

```html
<style>
  [data-seasonal-hero] {
    background: linear-gradient(160deg, #fdf7f8 0%, #fbecf0 55%, #f8e3ea 100%);
  }
  [data-seasonal-hero][data-season="summer"] {
    background: linear-gradient(160deg, #f4fafb 0%, #e7f3f5 55%, #dcedf0 100%);
  }
  [data-seasonal-hero][data-season="autumn"] {
    background: linear-gradient(160deg, #fcf6ec 0%, #f8ecd9 55%, #f4e2c8 100%);
  }
  [data-seasonal-hero][data-season="winter"] {
    background: linear-gradient(160deg, #f7f9fb 0%, #edf2f7 55%, #e4ebf2 100%);
  }
  @media (prefers-color-scheme: dark) {
    [data-seasonal-hero] {
      background: linear-gradient(160deg, #211d23 0%, #2c222b 100%);
    }
    [data-seasonal-hero][data-season="summer"] {
      background: linear-gradient(160deg, #17222a 0%, #153039 100%);
    }
    [data-seasonal-hero][data-season="autumn"] {
      background: linear-gradient(160deg, #241e19 0%, #2e2218 100%);
    }
    [data-seasonal-hero][data-season="winter"] {
      background: linear-gradient(160deg, #1b202a 0%, #212c3a 100%);
    }
  }
</style>
```

- [ ] **Step 2: `<script>` を作成（init/teardown・ダーク2経路）**

`mulberry32` / `pick` / `currentSeason` は移植元どおり。`setupFalling` / `setupRipples` は **色を引数で受け取る**よう変更（グローバル参照を排除）。`ACCENT` / `PARTICLE_COLORS` はライト/ダーク2組。

```astro
<script>
  function mulberry32(a: number) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = <T,>(rnd: () => number, arr: T[]): T =>
    arr[Math.floor(rnd() * arr.length) % arr.length];

  // 落下粒子色（春/秋/冬）。夏は波紋のため ACCENT.summer を使う別経路。
  const PARTICLE_COLORS_LIGHT: Record<string, string[]> = {
    spring: ["#f2b7c6", "#eda0b4", "#f7cdd8", "#e48ca0"],
    autumn: ["#cf6a2e", "#d99a3b", "#b4522a", "#e0b25c"],
    winter: ["#ffffff", "#f2f6fa", "#dfe8f0", "#cfdce8"],
  };
  // ダーク背景（藍墨）でも沈まない、やや明度を上げた粒子色
  const PARTICLE_COLORS_DARK: Record<string, string[]> = {
    spring: ["#f6c3d0", "#efabbd", "#fad6df", "#ea9db0"],
    autumn: ["#e0904f", "#e6ac52", "#cc6c3a", "#ecc274"],
    winter: ["#ffffff", "#eef4fa", "#dbe6f0", "#c9d8e8"],
  };
  const ACCENT_LIGHT: Record<string, string> = {
    spring: "#e48ca0",
    summer: "#3a9daa",
    autumn: "#cf6a2e",
    winter: "#87a3bc",
  };
  const ACCENT_DARK: Record<string, string> = {
    spring: "#e79aae",
    summer: "#5cbdca",
    autumn: "#e0904f",
    winter: "#a3bdd4",
  };

  const SEASONS = ["spring", "summer", "autumn", "winter"];
  // 月→季節: 12〜2月=winter / 3〜5月=spring / 6〜8月=summer / 9〜11月=autumn
  // （BaseLayout のインラインスクリプトと同一マッピングであること）
  function currentSeason(): string {
    const m = new Date().getMonth() + 1;
    return m <= 2 || m === 12 ? "winter" : m <= 5 ? "spring" : m <= 8 ? "summer" : "autumn";
  }

  function setupFalling(
    layer: HTMLElement,
    season: string,
    density: number,
    colors: string[],
  ) {
    const winter = season === "winter";
    const count = Math.max(4, Math.round((winter ? 46 : 26) * density));
    const rnd = mulberry32(season === "spring" ? 11 : season === "autumn" ? 22 : 33);
    const parts = Array.from({ length: count }, (_, i) => {
      const p = {
        x0: rnd() * 104 - 2,
        cyc: pick(rnd, winter ? [12, 12, 6] : [6, 12, 12, 4]),
        phase: rnd(),
        size: winter ? 4 + rnd() * 9 : 12 + rnd() * 16,
        swayAmp: winter ? 1 + rnd() * 2 : 2 + rnd() * 5,
        swayPer: pick(rnd, [3, 4, 6]),
        swayPhi: rnd() * Math.PI * 2,
        rotPer: pick(rnd, [3, 4, 6, 12]) * (rnd() > 0.5 ? 1 : -1),
        rot0: rnd() * 360,
        depth: rnd(),
        el: document.createElement("div"),
      };
      const s = p.size * (0.6 + p.depth * 0.6);
      const st = p.el.style;
      st.position = "absolute";
      st.width = s + "px";
      st.height = s * (winter ? 1 : season === "spring" ? 0.85 : 0.95) + "px";
      st.background = colors[i % colors.length];
      st.borderRadius = winter ? "50%" : season === "spring" ? "150% 20% 150% 20%" : "0 100% 0 100%";
      st.opacity = String(0.35 + p.depth * 0.5);
      if (p.depth < 0.35) st.filter = "blur(1.5px)";
      st.willChange = "transform";
      layer.appendChild(p.el);
      return p;
    });
    return (t: number) => {
      const W = layer.clientWidth,
        H = layer.clientHeight;
      for (const p of parts) {
        const prog = (t / p.cyc + p.phase) % 1;
        const y = ((-8 + prog * 116) / 100) * H;
        const x = ((p.x0 + p.swayAmp * Math.sin((2 * Math.PI * t) / p.swayPer + p.swayPhi)) / 100) * W;
        const rot = winter ? 0 : p.rot0 + (360 * t) / p.rotPer;
        p.el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
      }
    };
  }

  function setupRipples(layer: HTMLElement, density: number, color: string) {
    const n = Math.max(2, Math.round(5 * density));
    const rnd = mulberry32(44);
    const spots = Array.from({ length: n }, () => ({
      x: 0.08 + rnd() * 0.84,
      y: 0.2 + rnd() * 0.6,
      per: pick(rnd, [4, 6, 6, 12]),
      off: rnd(),
      max: 90 + rnd() * 150,
      els: [0, 0.5].map(() => {
        const el = document.createElement("div");
        const st = el.style;
        st.position = "absolute";
        st.borderRadius = "50%";
        st.border = `1.5px solid ${color}`;
        st.willChange = "transform";
        layer.appendChild(el);
        return el;
      }),
    }));
    return (t: number) => {
      const W = layer.clientWidth,
        H = layer.clientHeight;
      for (const s of spots) {
        s.els.forEach((el, j) => {
          const local = (t / s.per + s.off + j * 0.5) % 1;
          const r = local * s.max;
          el.style.left = s.x * W - r + "px";
          el.style.top = s.y * H - r * 0.42 + "px";
          el.style.width = r * 2 + "px";
          el.style.height = r * 0.84 + "px";
          el.style.opacity = String((1 - local) * 0.45);
        });
      }
    };
  }

  // 複数インスタンスに対応するため rAF ハンドルを配列で保持
  let rafIds: number[] = [];

  function initSeasonalHero(): void {
    teardownSeasonalHero(); // 遷移後の再初期化・多重ループを防ぐ
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const PARTICLE_COLORS = isDark ? PARTICLE_COLORS_DARK : PARTICLE_COLORS_LIGHT;
    const ACCENT = isDark ? ACCENT_DARK : ACCENT_LIGHT;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    for (const root of document.querySelectorAll<HTMLElement>("[data-seasonal-hero]")) {
      const layer = root.querySelector<HTMLElement>("[data-sh-layer]");
      if (!layer) continue;

      let season = root.dataset.season || "spring";
      if (season === "auto") {
        const htmlSeason = document.documentElement.dataset.season;
        season = htmlSeason && SEASONS.includes(htmlSeason) ? htmlSeason : currentSeason();
        root.dataset.season = season; // 背景CSSの参照を確定
      }
      const density = parseFloat(root.dataset.density || "1");
      const speed = parseFloat(root.dataset.speed || "1");

      // 日輪（ゆっくり呼吸する円）
      const disc = document.createElement("div");
      const ds = disc.style;
      ds.position = "absolute";
      ds.right = "12%";
      ds.top = "50%";
      ds.width = "340px";
      ds.height = "340px";
      ds.marginTop = "-170px";
      ds.borderRadius = "50%";
      ds.background = ACCENT[season];
      ds.opacity = "0.14";
      layer.appendChild(disc);

      const tick =
        season === "summer"
          ? setupRipples(layer, density, ACCENT.summer)
          : setupFalling(layer, season, density, PARTICLE_COLORS[season]);

      const t0 = performance.now();
      const frame = (now: number) => {
        const t = ((now - t0) / 1000) * speed;
        disc.style.transform = `scale(${1 + 0.015 * Math.sin((2 * Math.PI * t) / 12)})`;
        tick(t);
        rafIds.push(requestAnimationFrame(frame));
      };
      if (reduced) {
        tick(3);
        disc.style.transform = "scale(1)";
      } else {
        rafIds.push(requestAnimationFrame(frame));
      }
    }
  }

  function teardownSeasonalHero(): void {
    for (const id of rafIds) cancelAnimationFrame(id);
    rafIds = [];
    // 生成した粒子・日輪を除去（再初期化時の二重生成を防ぐ）
    for (const layer of document.querySelectorAll<HTMLElement>("[data-sh-layer]")) {
      layer.replaceChildren();
    }
  }

  document.addEventListener("astro:page-load", initSeasonalHero);
  document.addEventListener("astro:before-swap", teardownSeasonalHero);
</script>
```

> **注意（rAF配列の肥大化について）**: `frame` は毎フレーム `rafIds.push` する。単一 Home では実害はないが、`teardownSeasonalHero` が毎回全クリアするため配列は次の遷移までに解放される。より厳密にするなら push ではなく単一ハンドルの再代入でもよいが、複数インスタンス対応の明快さを優先して配列とする。

- [ ] **Step 3: 検証**

Run: `npm run check`
Expected: 成功（TypeScript strict。ジェネリック `pick<T,>` の記法に注意。エラーが出れば型注釈を修正）

- [ ] **Step 4: Commit**

```bash
git add src/components/SeasonalHero.astro
git commit -m "feat: #53 季節ヒーロー背景（init/teardown・ダーク粒子2経路）を追加"
```

---

## Task 7: BaseLayout に head inline と reveal バインドを追加

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: head inline スクリプトを追加**

`<ClientRouter />`（24行目）の**直後**（`</head>` の前）に、`is:inline` スクリプトを追加する。

```astro
    <ClientRouter />
    <script is:inline>
      // 訪問時の月から season を判定し、季節連動の起点となる data-season を html に設定する。
      // マッピング: 12〜2月=winter / 3〜5月=spring / 6〜8月=summer / 9〜11月=autumn
      {
        const month = new Date().getMonth() + 1;
        document.documentElement.dataset.season =
          month <= 2 || month === 12
            ? "winter"
            : month <= 5
              ? "spring"
              : month <= 8
                ? "summer"
                : "autumn";
      }
      // JS有効フラグと reduced-motion フラグを初回ペイント前に付与する（FOUC防止）。
      {
        const de = document.documentElement;
        de.classList.add("js");
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          de.classList.add("reduced-motion");
        }
      }
    </script>
```

> **補足**: `html` 要素は ClientRouter の遷移で置換されないため、`data-season` / `js` / `reduced-motion` は遷移をまたいで保持される。`is:inline` の再実行は不要。

- [ ] **Step 2: reveal のバインドを body 末尾に追加**

`<Footer />`（31行目）の直後（`</body>` の前）に追加する。

```astro
    <Footer />
    <script>
      import { initReveal, teardownReveal } from "../scripts/reveal.ts";
      document.addEventListener("astro:page-load", initReveal);
      document.addEventListener("astro:before-swap", teardownReveal);
    </script>
```

- [ ] **Step 3: 検証**

Run: `npm run check && npm run build`
Expected: 両方成功

- [ ] **Step 4: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: #53 head inline（season/js/reduced-motion）と reveal 再初期化を追加"
```

---

## Task 8: index.astro をエディトリアル Home に置き換え

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: ファイル全体を置き換え**

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
import SeasonalHero from "../components/SeasonalHero.astro";
import { SITE_DESCRIPTION, SOCIAL_LINKS, EMAIL, SITE_AUTHOR } from "../consts";

// スキルセクションに表示する技術タグ
const skills = [
  "TypeScript",
  "React",
  "Node.js",
  "AWS",
  "Kubernetes",
  "Terraform",
  "Grafana",
  "Prometheus",
];
---

<BaseLayout title="Home" description={SITE_DESCRIPTION}>
  <div class="home-hero">
    <SeasonalHero season="auto" height="70vh">
      <div class="hero-content">
        <p class="hero-role">SOFTWARE ENGINEER / SRE</p>
        <h1 class="hero-name">{SITE_AUTHOR}</h1>
        <span class="hero-rule" aria-hidden="true"></span>
        <p class="hero-copy">つくることと、動かし続けること。</p>
      </div>
    </SeasonalHero>
  </div>

  <section class="home-section">
    <h2 class="section-heading" data-reveal>
      <span class="section-num">壱</span>
      <span class="section-title">技術</span>
      <span class="section-label" aria-hidden="true">SKILLS</span>
    </h2>
    <ul class="skill-list" role="list" data-reveal="delayed">
      {skills.map((skill) => <li>{skill}</li>)}
    </ul>
  </section>

  <section class="home-section">
    <h2 class="section-heading" data-reveal>
      <span class="section-num">弐</span>
      <span class="section-title">連絡先</span>
      <span class="section-label" aria-hidden="true">CONTACT</span>
    </h2>
    <ul class="contact-list" role="list" data-reveal="delayed">
      <li>
        <span class="contact-label">GITHUB</span>
        <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer">github.com/TakuyaAsaoka</a>
      </li>
      <li>
        <span class="contact-label">EMAIL</span>
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </li>
    </ul>
  </section>
</BaseLayout>
```

- [ ] **Step 2: 検証**

Run: `npm run check && npm run build`
Expected: 両方成功

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: #53 Home をエディトリアル構成（ヒーロー・Skills・Contact）に刷新"
```

---

## Task 9: 統合検証（ビルド＋手動ビジュアル確認）

自動テストが無いため、受け入れ条件（spec §9）をこのタスクで目視確認する。

**Files:** なし（検証のみ。必要なら該当ファイルを修正して再 commit）

- [ ] **Step 1: ビルド・型検証**

Run: `npm run build && npm run check`
Expected: 両方エラー0・warning0

- [ ] **Step 2: 開発サーバーで手動確認**

Run: `npm run dev`（`http://localhost:4321/homepage/` を開く）

以下を確認する（受け入れ条件に対応）:

| # | 確認内容 | 期待 |
|---|---------|------|
| 1 | 初回ロード | ヒーローで肩書き→名前→罫線伸長→キャッチが順に stagger 入場し、季節背景が動く |
| 2 | スクロール | Skills・Contact が見出し→中身の2段階でフェードイン |
| 3 | クライアント遷移 | About 等へ遷移→Home へ戻ると入場・登場・季節背景が再生される（多重ループ・粒子の二重生成が無い） |
| 4 | ダークモード | OS をダークにして再読込。文字組みが崩れず、粒子（特に夏の波紋）が背景に沈まず可読性を保つ |
| 5 | reduced-motion | OS の「視差効果を減らす」を有効化→全要素が即最終状態で表示（隠れたまま無し） |
| 6 | JS無効 | ブラウザで JS を無効化→`[data-reveal]` が隠れず全内容表示 |
| 7 | モバイル幅 | 375px 幅でヒーロー・セクションが破綻しない |
| 8 | 既存ページ | About / Blog / Projects が新フォントで破綻せず表示される（フォント全サイト適用の影響確認） |

- [ ] **Step 3: 問題があれば修正**

各項目で問題があれば該当ファイル（global.css / SeasonalHero.astro / reveal.ts 等）を修正し、`Fix:` プレフィックスで commit する。

- [ ] **Step 4: 最終ビルド確認**

Run: `npm run build`
Expected: 成功

---

## 完了後

- superpowers:requesting-code-review でコードレビューを依頼
- ローカル検証（`npm run build && npm run check`）を最終確認
- PR 作成前に `git fetch origin main && git merge origin/main` を再実行
- PR 作成（本文に「Closes #53」）
