// 季節判定の単一情報源。
// 月→季節のマッピングはこのファイルだけが持ち、BaseLayout（is:inline スクリプト）と
// SeasonalHero の両方がここから導出した値を参照する。境界変更はこの1箇所で完結する。

export type Season = "spring" | "summer" | "autumn" | "winter";

// 月(1-12) → 季節。12〜2月=winter / 3〜5月=spring / 6〜8月=summer / 9〜11月=autumn
export function monthToSeason(month: number): Season {
  return month <= 2 || month === 12
    ? "winter"
    : month <= 5
      ? "spring"
      : month <= 8
        ? "summer"
        : "autumn";
}

// monthToSeason から導出した12ヶ月分の季節配列（index 0 = 1月 … index 11 = 12月）。
// is:inline スクリプトは import できないため、define:vars でこの配列を渡し、
// クライアント側は月インデックスで季節を引く（新規のロジック重複を作らない）。
export const MONTH_SEASONS: Season[] = Array.from({ length: 12 }, (_, i) =>
  monthToSeason(i + 1),
);

// 訪問時（クライアント実行）の月から季節を返す。
export function currentSeason(): Season {
  return monthToSeason(new Date().getMonth() + 1);
}
