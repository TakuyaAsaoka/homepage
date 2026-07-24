// 四季のヒーロー背景アニメーション（依存なし・素のJS）。
// PRNG・粒子色・落下/波紋アニメーション・ライフサイクル管理を集約する。
// season="auto" は訪問時の月で季節を自動判定（html[data-season] があればそれを優先）。
// ClientRouter 下での再初期化に対応するため init/teardown を公開する（reveal.ts と同パターン）。
import { currentSeason } from "../season";

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

// 落下粒子色（春/秋/冬）。夏は波紋のためアクセントトークン（var(--accent-summer)）を使う別経路。
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
// 季節アクセント（日輪・夏の波紋の色）は global.css の --accent-<season> トークンを
// var() で参照する（単一情報源）。light/dark は CSS の prefers-color-scheme が解決するため
// JS 側でのダーク判定・色定義は不要で、閲覧中の OS テーマ切替にも追従する。

const SEASONS = ["spring", "summer", "autumn", "winter"];
// 月→季節の判定は src/season.ts の currentSeason に集約（単一情報源）。

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

// rAF ハンドルをインスタンスごとに1スロットで保持する。
// frame では push せずスロットを再代入するため、配列は長時間再生でも肥大しない。
let rafIds: number[] = [];

// [data-seasonal-hero] を初期化してアニメーションを開始する。astro:page-load ごとに呼ばれる。
export function initSeasonalHero(): void {
  teardownSeasonalHero(); // 遷移後の再初期化・多重ループを防ぐ
  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const PARTICLE_COLORS = isDark ? PARTICLE_COLORS_DARK : PARTICLE_COLORS_LIGHT;
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
    // アクセント色は解決済み season のトークンを参照（日輪と夏の波紋で共用）
    const accent = `var(--accent-${season})`;

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
    ds.background = accent;
    ds.opacity = "0.14";
    layer.appendChild(disc);

    const tick =
      season === "summer"
        ? setupRipples(layer, density, accent)
        : setupFalling(layer, season, density, PARTICLE_COLORS[season]);

    const slot = rafIds.length; // このインスタンス専用のスロット
    rafIds.push(0);
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = ((now - t0) / 1000) * speed;
      disc.style.transform = `scale(${1 + 0.015 * Math.sin((2 * Math.PI * t) / 12)})`;
      tick(t);
      rafIds[slot] = requestAnimationFrame(frame); // 再代入（毎フレーム増やさない）
    };
    if (reduced) {
      tick(3);
      disc.style.transform = "scale(1)";
    } else {
      rafIds[slot] = requestAnimationFrame(frame);
    }
  }
}

// ページ離脱（astro:before-swap）時に rAF を停止し、生成要素を除去する。
export function teardownSeasonalHero(): void {
  for (const id of rafIds) cancelAnimationFrame(id);
  rafIds = [];
  // 生成した粒子・日輪を除去（再初期化時の二重生成を防ぐ）
  for (const layer of document.querySelectorAll<HTMLElement>("[data-sh-layer]")) {
    layer.replaceChildren();
  }
}
