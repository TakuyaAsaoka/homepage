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
