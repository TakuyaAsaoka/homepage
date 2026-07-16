# ヒーロー full-bleed 構造の再設計（Issue #67）

- 作成日: 2026-07-16
- 対象 Issue: [#67](https://github.com/TakuyaAsaoka/homepage/issues/67) — クラシックスクロールバー環境の800px未満幅でヒーローが約7.5px左にずれる

## 背景と問題

Home のヒーロー（`.home-hero`）は、幅制限された `main`（`max-width: 800px`）の内側から `width: 100vw; margin-inline: calc(50% - 50vw)` で全幅に広げ直す「full-bleed ハック」で実装されている。`100vw` はスクロールバー幅を含むため、クラシックスクロールバー環境（Windows 等、幅15px）かつビューポート幅 800px 未満で、ヒーローがスクロールバー幅の半分（約7.5px）左にずれ、ヒーロー内テキストと本文の左端が揃わない。

このハックは連鎖的に3つの補正を生んでおり、相互依存した4点セットになっている。

| ハック | 場所 | 役割 |
|--------|------|------|
| `width: 100vw` + `margin-inline: calc(50% - 50vw)` | `global.css` `.home-hero` | main の幅制限からの脱出（ズレの発生源） |
| `margin-top: -1rem` | 同上 | main の上パディング打ち消し（ヘッダー密着） |
| `html, body { overflow-x: clip }` | `global.css` | 100vw が生む横スクロール防止 |

## 原因の本質

「body 基準の幅を持つ `main` の内側から、viewport 基準の `100vw` で広げる」という座標系の混在が原因。body 幅はスクロールバーを含まず、viewport 幅は含むため、両者の差がズレとして現れる。

## 設計方針

**幅制限の内側から広げるのをやめ、ヒーローを幅制限の外（ただし `main` の中）に置く。**

```
現在                              変更後
<body>                            <body>
  <Header />                        <Header />
  <main>  ← max-width 800px         <main>  ← 全幅（flex:1 のみ）
    <div class="home-hero">           <slot name="hero" />  ← 全幅のまま
      <SeasonalHero>                  <div class="main-inner">  ← max-width + padding をここへ移設
    （本文）                            <slot />（本文）
  </main>                             </div>
                                    </main>
```

- ヒーロー幅 = main 幅 = body 幅（スクロールバー除外）となり、`hero-inner` / `main-inner` / Header `.nav` / Footer `.footer-inner` がすべて「body 幅基準 + 同一 max-width + 同一 padding」で揃う。クラシックスクロールバー環境でも数式上ズレが発生しない
- ヒーロー（ページの `h1` を含む主要コンテンツ）は `main` ランドマーク内に留まり、セマンティクスを損なわない
- hero スロットが空のページでは Astro は何も出力しないため、他ページの DOM 変化は `main > .main-inner` の1階層追加のみ

### 検討した対抗案と却下理由

| 案 | 却下理由 |
|----|---------|
| hero を main の外（body 直下）に置く | h1 がランドマーク外に孤立し、スクリーンリーダーの「メインコンテンツへジャンプ」が h1 を飛ばす。変更量は採用案と同等でセマンティクスだけ劣る |
| `body { container-type: inline-size }` + `100cqw` | ズレは解消するが、containment により将来 `position: fixed` 要素の包含ブロックが body になる罠を仕込む。ハック構造も温存 |
| Home 専用レイアウト（HomeLayout） | BaseLayout の head・季節スクリプト・reveal 配線が丸ごと重複し二重メンテ |
| main の content-grid 化 | 全ページの main 直下がグリッドアイテム化し、マージン相殺消失等が全ページに波及。ヒーロー1つのために釣り合わない |

## 変更内容

### 1. `src/layouts/BaseLayout.astro`

`main` 内に名前付きスロット `hero` と、本文を包む `.main-inner` を追加する。

```astro
<main>
  <slot name="hero" />
  <div class="main-inner">
    <slot />
  </div>
</main>
```

### 2. `src/pages/index.astro`

`.home-hero` ラッパー div を削除し、`<SeasonalHero slot="hero" ...>` で直接スロットに渡す（コンポーネント直付けの `slot` 属性は Astro で有効）。

### 3. `src/styles/global.css`

| 箇所 | 変更 |
|------|------|
| `main`（100-106行） | `max-width` / `margin: 0 auto` / `padding` を `.main-inner` に移設。`main` には `flex: 1` と `width: 100%` のみ残す |
| `overflow-x: clip` ブロック（113-117行） | コメントごと削除（存在理由である 100vw ハックが消滅。`100vw` の使用箇所は他に無いことを確認済み） |
| `.home-hero` ルール（133-137行） | 丸ごと削除 |
| `.hero-inner` のコメント（138-139行） | 「full-bleed のまま」という旧構造前提の表現を修正 |
| `.home-intro`（265行） | `margin-block: 3.5rem 5rem` → `2.5rem 5rem`。`.main-inner` の `padding-top: 1rem` が間に入るため、合計 3.5rem で現状の見た目を維持（padding があるためマージン相殺は起きない）。根拠をコメントで明記 |
| `--content-pad` のコメント（4-5行） | 「Header / main / ヒーロー内テキスト / Footer で共用」の `main` 参照を `main-inner` 基準に更新 |

### 4. コメントの整合性維持

- `src/components/Header.astro:65`・`src/components/Footer.astro:36` の「main / hero-inner と同一構造」コメントを `main-inner` 基準に書き換える

## 影響なしと確認済みの範囲

- 各ページ（about/blog/projects/404）のスコープドスタイルは自クラスの margin のみで `main` の padding に非依存。`main > *` 型セレクタも存在しない
- reveal スクリプト（`src/scripts/reveal.ts`）は `[data-reveal]` を document 全体から拾うため DOM 階層追加の影響なし
- SeasonalHero の粒子・波紋はコンポーネント自身の `overflow: hidden` 内に閉じており、`overflow-x: clip` 削除後も溢れない
- View Transitions（ClientRouter）は body 全体を swap し、名前付き transition は未使用のため無関係
- 旧ハックのコードが `docs/records/plans/2026-07-09-53-editorial-home-port.md` に作業記録として残るが、records は履歴のため更新しない

## 受け入れ条件（Issue #67 より）

- クラシックスクロールバー環境・800px 未満幅で、ヒーローのテキスト左端が本文と同一ラインに揃う（構造的に保証: ヒーロー幅が body 幅基準になるため `100vw` 由来のズレが原理的に発生しない）
- 800px 以上・オーバーレイスクロールバー環境で従来どおり表示が崩れない

## 検証計画

1. `npm run build` が成功する
2. `dist/index.html` でヒーローが `main` 内・`.main-inner` の外にあり、`100vw` を使う CSS が残っていないこと
3. ブラウザ実測（`npm run preview` + chrome-devtools）:
   - Home: ヒーロー上端がヘッダー直下に密着（旧 `-1rem` の代替が構造的に効いている）
   - Home: ヒーローテキスト・本文・nav・footer の左端が一致（800px 未満・以上の両方）
   - Home: ヒーロー下端〜導入文の間隔が変更前と同等（3.5rem）
   - 下層ページ（about/blog/projects/404）: 表示・左端整列のリグレッション無し
   - View Transitions・reveal アニメーション・SeasonalHero の粒子描画が正常
