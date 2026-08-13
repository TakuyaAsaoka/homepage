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
    // 遷移が終わらないうちに次の遷移が始まると、前の遷移は中断され、ページの差し替えも
    // 完了のイベントも起きない（連続クリック、遷移中の戻る操作、遷移中のページ内アンカー）。
    // ここで消さないとバーが出たまま画面に残る。
    event.signal.addEventListener("abort", () => setNavigating(false));
  });
  // 遷移が成功した場合の消灯は要らない。ページ差し替えで <html> の属性は遷移先の値に
  // 置き換わり、data-navigating は自動で消える。同じ性質のせいで季節フラグが消えるのを、
  // BaseLayout の applyDocumentFlags が遷移後の再適用で打ち消している。
}
