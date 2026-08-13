// ページ遷移の待ち時間を示す進行バーの配線。
// 状態は <html> の data-navigating 属性1つに閉じており、モジュール変数もタイマーも持たない。
// 「短い遷移では出さない」の判定は global.css の animation-delay が担う（JS側に閾値は無い）。

// 取得中かどうかを <html> に印として書く。バーの見た目は global.css が決める。
function setNavigating(isNavigating: boolean): void {
  document.documentElement.toggleAttribute("data-navigating", isNavigating);
}

// 遷移のライフサイクルに配線する。リスナは一度だけ登録すればよいので、
// astro:page-load ではなくモジュールの評価時（BaseLayout の script）から呼ぶ。
export function initNavProgress(): void {
  document.addEventListener("astro:before-preparation", (event) => {
    setNavigating(true);
    // 中断された遷移（連続クリック・同一ページ内アンカー等）では、遷移の完了イベントが
    // 二度と発火しない。ここで消さないとバーが出たまま画面に残る。
    event.signal.addEventListener("abort", () => setNavigating(false));
  });
  // 遷移が成功した場合の消灯は要らない。ページ差し替えで <html> の属性は遷移先の値に
  // 置き換わり、data-navigating は自動で消える（同じ性質を BaseLayout の
  // applyDocumentFlags が「遷移後に再適用が要る」側から利用している）。
}
