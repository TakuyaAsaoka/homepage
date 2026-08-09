// ナビゲーションの現在地判定。Header.astro から抽出し、テスト可能な純関数にしている。

// 判定が末尾スラッシュの有無に依存しないよう正規化する
function normalizePath(path: string): string {
  return path.replace(/\/$/, "");
}

// ナビ項目の現在地状態を返す。戻り値は aria-current 属性値をそのまま表し、
// "page" は閲覧中のページ自身、"true" はその子ルートをたどっている項目、
// undefined は現在地でないことを意味する。
// Home（basePath）はあらゆるパスの先頭に一致するため完全一致でのみ現在地とする。
// 子ルートの前方一致は /works が /works-foo に誤マッチしないよう
// セグメント境界（"/" 配下）で判定する。
export function navCurrentState(
  currentPath: string,
  href: string,
  basePath: string,
): "page" | "true" | undefined {
  const current = normalizePath(currentPath);
  const target = normalizePath(href);
  if (current === target) return "page";
  if (target === normalizePath(basePath)) return undefined;
  return current.startsWith(`${target}/`) ? "true" : undefined;
}
