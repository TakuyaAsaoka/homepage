var FLIP = Number(process.argv[2] || 0);
  var AX = 0.8;
  var DENSITIES = [[84, 32], [120, 45], [150, 56]];
  var FONT = '"SFMono-Regular", "SF Mono", Menlo, Consolas, monospace';
  var INK = ["#222222", "#eeeeee"];
  // 要素別の色（尾形光琳の松の色味：薄茶の幹・青緑の苔・淡い松葉色）
  var PALETTE = [
    { // light
      outline: [74, 58, 44], trunk: [140, 108, 76], moss: [106, 150, 142],
      leaf: [124, 154, 104], ridge: [88, 122, 74], twig: [92, 74, 56]
    },
    { // dark
      outline: [216, 198, 174], trunk: [178, 143, 106], moss: [140, 188, 179],
      leaf: [158, 192, 137], ridge: [126, 162, 105], twig: [170, 146, 120]
    }
  ];
  var RAMP = [".", ",", ":", ";", "+", "*", "#", "%", "@"];
  var DIR = ["-", "\\", "|", "/"];

  var BASE = {
    rootX: -0.60, rootY: 0.100, angle: 50, len: 0.80,
    girthRoot: 0.072, girthTop: 0.026,
    tiers: [
      [0.14, 0.700, 0.38, 0.082, 5, 1.3],
      [-0.30, 0.640, 0.26, 0.064, 4, 2.7],
      [0.60, 0.668, 0.25, 0.062, 4, 4.1],
      [0.28, 0.828, 0.22, 0.056, 4, 5.9]
    ],
    branches: [
      // 幹の中腹から出る枝。先に樹冠が付く（midTiers と対応）
      { u: 0.36, to: [-0.50, 0.374], w: 0.46, mid: true, kinks: [[-0.13, 0.026], [-0.10, 0.008]] },
      { u: 0.54, to: [0.30, 0.498], w: 0.42, mid: true, kinks: [[0.13, 0.022], [0.11, 0.008]] },
      // 樹冠へ繋がる枝
      { u: 0.64, to: [-0.30, 0.634], w: 0.55, kinks: [[-0.14, 0.026], [-0.12, -0.014]] },
      { u: 0.82, to: [0.56, 0.656], w: 0.50, kinks: [[0.16, 0.022], [0.14, -0.010]] },
      { u: 0.95, to: [0.26, 0.790], w: 0.36, kinks: [[0.07, 0.044]] }
    ],
    // 中腹の枝先に載る樹冠（branches の mid:true と同じ順）
    midTiers: [
      [-0.53, 0.402, 0.19, 0.048, 3, 7.3],
      [0.33, 0.524, 0.18, 0.046, 3, 8.7]
    ],
    roots: [
      { dir: -1, off: -0.95, seg: [[0.085, -0.006], [0.030, -0.052]] },
      { dir: -1, off: -0.15, seg: [[0.050, -0.022], [0.022, -0.048]] },
      { dir: 1, off: 0.45, seg: [[0.075, -0.008], [0.032, -0.052]] },
      { dir: 1, off: 1.05, seg: [[0.115, 0.000], [0.038, -0.056]] }
    ]
  };

  // ▼ 確定パラメータ（この値を設計書の既定値とする）
  var state = { scrub: 0, sceneY: 60, density: 1, theme: 0, flip: 1, color: 1, satur: 80, solid: 85,
    gamma: 100, ink: 100, moss: 11, bark: 100, root: 100, rootW: 46, rootD: 100,
    angle: 50, girth: 100, len: 100, midBranch: 100, wobble: 100, crown: 100, lobe: 100, fill: 92,
    twig: 3, twigLen: 50, twigDepth: 2, twigBranch: 20 };

  var T_DRIFT = 0.7, STAGGER = 0.55, DUR = 1.5;
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function easeInOutQuart(p) { return p < 0.5 ? 8 * p * p * p * p : 1 - Math.pow(-2 * p + 2, 4) / 2; }
  function hash(x, y) { var s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); }
  function rgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function fbm(x, y) {
    var h2 = function (a, b) { return hash(Math.floor(a), Math.floor(b)); };
    var bilerp = function (fx, fy, k) {
      var x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      return lerp(lerp(h2(x0 + k, y0), h2(x0 + 1 + k, y0), tx),
                  lerp(h2(x0 + k, y0 + 1), h2(x0 + 1 + k, y0 + 1), tx), ty);
    };
    return 0.62 * bilerp(x, y, 0) + 0.38 * bilerp(x * 2.7, y * 2.7, 17);
  }

  function rampChar(d) { return RAMP[Math.min(RAMP.length - 1, Math.max(0, Math.floor(d * RAMP.length)))]; }
  function dirChar(ang) {
    var a = ang % Math.PI; if (a < 0) a += Math.PI;
    return DIR[Math.floor((a + Math.PI / 8) / (Math.PI / 4)) % 4];
  }
  function segInfo(x, y, p, q) {
    var ax = (q.x - p.x) * AX, ay = q.y - p.y, bx = (x - p.x) * AX, by = y - p.y;
    var l2 = ax * ax + ay * ay;
    var u = l2 > 0 ? clamp01((bx * ax + by * ay) / l2) : 0;
    var dx = bx - ax * u, dy = by - ay * u;
    return { d: Math.sqrt(dx * dx + dy * dy), w: lerp(p.w, q.w, u), u: u, ang: Math.atan2(-ay, ax) };
  }

  var stage = null, cv = null;
  var ctx = null, fpsEl = null;
  var heroText = null;
  var cells = [], cols = 0, rows = 0, cellW = 0, cellH = 0, fontPx = 0, originX = 0, originY = 0;
  var t0 = performance.now(), frozen = false;
  var scene = null;
  // タイムライン（秒）
  var T_HOLD = 1.2;       // ASCII完成後、見せる時間
  var T_FADE = 1.6;       // 絵へのクロスフェード時間
  var T_TAIL = 1.0;       // 絵になってからの余韻（ここで録画を止める）

  function buildArt() {
    cols = DENSITIES[state.density][0]; rows = DENSITIES[state.density][1];
    var nc = cols, nr = rows;
    var cs = state.crown / 100, lb = state.lobe / 100;
    var kind = new Array(nc * nr), chg = new Array(nc * nr), dn = new Float32Array(nc * nr);
    var colToX = function (c) { return (c / (nc - 1)) * 2 - 1; };
    var rowToY = function (r) { return 1 - r / (nr - 1); };
    var xToCol = function (x) { return Math.round(((x + 1) / 2) * (nc - 1)); };
    var yToRow = function (y) { return Math.round((1 - y) * (nr - 1)); };

    var rad = state.angle * Math.PI / 180, L = BASE.len * (state.len / 100);
    var root = { x: BASE.rootX, y: BASE.rootY };
    var top = { x: root.x + Math.cos(rad) * L / AX, y: root.y + Math.sin(rad) * L };
    var gR = BASE.girthRoot * (state.girth / 100), gT = BASE.girthTop * (state.girth / 100);
    // 幹は直線に沿わせず、法線方向へ「反り」と「凹凸」を与える（手描きの線に近づける）
    var wob = state.wobble / 100;
    var dirx = (top.x - root.x) * AX, diry = top.y - root.y;
    var dlen = Math.sqrt(dirx * dirx + diry * diry) || 1e-6;
    var nX = -diry / dlen, nY = dirx / dlen;
    var trunkAt = function (u) {
      var bend = 0.030 * wob * Math.sin(u * 2.3 + 0.6) + 0.007 * wob * (fbm(u * 7, 3.3) - 0.5) * 2;
      return {
        x: lerp(root.x, top.x, u) + (nX * bend) / AX,
        y: lerp(root.y, top.y, u) + nY * bend,
        w: lerp(gR, gT, u) * (0.93 + 0.15 * wob * fbm(u * 8, 1.1))
      };
    };
    // 折れ線を細分化して手描きの揺らぎを乗せる
    function refine(pts, seed) {
      var out = [];
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1];
        var ax2 = (b.x - a.x) * AX, ay2 = b.y - a.y;
        var L2 = Math.sqrt(ax2 * ax2 + ay2 * ay2) || 1e-6;
        var px2 = -ay2 / L2, py2 = ax2 / L2;
        for (var k = 0; k < 6; k++) {
          var t2 = k / 6;
          var off = 0.011 * wob * (fbm((i + t2) * 3.4 + seed, 2.1) - 0.5) * 2;
          out.push({
            x: lerp(a.x, b.x, t2) + (px2 * off) / AX,
            y: lerp(a.y, b.y, t2) + py2 * off,
            w: lerp(a.w, b.w, t2) * (0.90 + 0.20 * wob * fbm((i + t2) * 5.4 + seed, 4.7))
          });
        }
      }
      out.push(pts[pts.length - 1]);
      return out;
    }
    // 幹の先端位置が変わった分だけ樹冠・枝を追従させる
    var dx = top.x - (BASE.rootX + Math.cos(BASE.angle * Math.PI / 180) * BASE.len / AX);
    var dy = top.y - (BASE.rootY + Math.sin(BASE.angle * Math.PI / 180) * BASE.len);
    var tiers = BASE.tiers.map(function (t) {
      return [t[0] + dx * 0.9, t[1] + dy * 0.9, t[2] * cs, t[3] * cs, Math.max(2, Math.round(t[4] * lb)), t[5]];
    });
    var mbv = state.midBranch / 100;
    if (mbv > 0.02) {
      var midIdx = 0;
      BASE.branches.forEach(function (b) {
        if (!b.mid) return;
        var mt = BASE.midTiers[midIdx++], bs = trunkAt(b.u);
        tiers.push([bs.x + (mt[0] - bs.x) * mbv + dx * 0.5, bs.y + (mt[1] - bs.y) * mbv + dy * 0.5,
                    mt[2] * cs, mt[3] * cs, Math.max(2, Math.round(mt[4] * lb)), mt[5]]);
      });
    }

    function tierTop(t, x) {
      var u = (x - t[0]) / t[2];
      if (u < -1 || u > 1) return null;
      var env = Math.pow(1 - Math.pow(u, 6), 0.42);
      var a = Math.PI * t[4] * (u + 1) / 2 + t[5];
      // 単一周波数だと等間隔・等高の山が並ぶ。周波数の違う波とノイズを重ねて崩す
      var wave = 0.46 * Math.abs(Math.sin(a))
               + 0.28 * Math.abs(Math.sin(a * 1.63 + 1.1))
               + 0.26 * fbm(u * 3.1 + t[5], 5.5);
      return t[1] + t[3] * env * (0.52 + 0.92 * wave);
    }
    function tierBot(t, x) {
      var u = (x - t[0]) / t[2];
      if (u < -1 || u > 1) return null;
      var env = Math.pow(1 - Math.pow(u, 6), 0.42);
      return t[1] - t[3] * env * (0.42 + 0.10 * Math.sin(u * 6 + t[5])
                                  + 0.14 * (fbm(u * 2.6 + t[5], 9.1) - 0.5));
    }
    function insideAnyTier(x, y, skip) {
      for (var i = 0; i < tiers.length; i++) {
        if (i === skip) continue;
        var t = tiers[i], tp = tierTop(t, x), bt = tierBot(t, x);
        if (tp !== null && y <= tp && y >= bt) return true;
      }
      return false;
    }

    var mb = state.midBranch / 100;
    var branchSrc = BASE.branches.filter(function (b) { return !b.mid || mb > 0.02; });
    var branchLines = branchSrc.map(function (b) {
      var sc = b.mid ? mb : 1;
      var base = trunkAt(b.u), pts = [{ x: base.x, y: base.y, w: base.w * b.w }];
      var cx = base.x, cy = base.y;
      b.kinks.forEach(function (k, i) {
        cx += (k[0] * sc) / AX; cy += k[1] * sc;
        pts.push({ x: cx, y: cy, w: base.w * b.w * lerp(1, 0.45, (i + 1) / (b.kinks.length + 1)) });
      });
      if (b.mid) {
        // 中腹の枝は「中腹の枝」スライダで張り出しをスケールする
        pts.push({ x: base.x + (b.to[0] - base.x) * sc, y: base.y + (b.to[1] - base.y) * sc,
                   w: base.w * b.w * 0.38 });
      } else {
        pts.push({ x: b.to[0] + dx * 0.9, y: b.to[1] + dy * 0.9, w: base.w * b.w * 0.35 });
      }
      return refine(pts, BASE.branches.indexOf(b) * 13.7);
    });
    var rw = state.rootW / 100, rs = state.root / 100, rd = state.rootD / 100;
    var rootLines = BASE.roots.map(function (r) {
      var rx = root.x + (r.off * gR) / AX, ry = root.y + 0.012;
      var pts = [{ x: rx, y: ry, w: gR * rw }];
      r.seg.forEach(function (g, i) {
        rx += (r.dir * g[0] * rs) / AX; ry += g[1] * rd;
        pts.push({ x: rx, y: ry, w: gR * rw * lerp(0.88, 0.34, (i + 1) / r.seg.length) });
      });
      return refine(pts, BASE.roots.indexOf(r) * 5.9 + 40);
    });

    function put(c, r, k, d, character) {
      if (c < 0 || c >= nc || r < 0 || r >= nr) return;
      var i = r * nc + c;
      kind[i] = k; dn[i] = d; chg[i] = character;
    }

    // 1. 面（疎に置く／濃度は位置で変える）
    var fillA = state.fill / 100, mossA = state.moss / 100;
    // 「くっきり」= 文字の間引きを減らす。幹・枝・根・輪郭の描画率をまとめて制御する
    var sd = state.solid / 100;
    var rateTrunk = lerp(0.55, 0.97, sd), rateBranch = lerp(0.68, 0.99, sd);
    var rateRoot = lerp(0.70, 0.97, sd);
    var keepOutline = lerp(0.86, 1.0, sd), keepRidge = lerp(0.88, 1.0, sd);
    for (var r = 0; r < nr; r++) {
      for (var c = 0; c < nc; c++) {
        var x = colToX(c), y = rowToY(r), h = hash(c * 7.3 + 1.9, r * 4.7 + 3.1);

        for (var ti = 0; ti < tiers.length; ti++) {
          var t = tiers[ti], tp = tierTop(t, x), bt = tierBot(t, x);
          if (tp === null || y > tp || y < bt) continue;
          var vert = clamp01((y - bt) / Math.max(1e-6, tp - bt));
          var side = 1 - Math.abs((x - t[0]) / t[2]);
          var d = clamp01(0.06 + 0.70 * vert + 0.30 * side * vert);
          if (h < fillA * (0.62 + 0.75 * d)) put(c, r, "leaf", d, rampChar(d * 0.80));
        }

        // 枝の面（樹冠の上に載せる＝原画では枝が葉群の中を走る）
        for (var bl = 0; bl < branchLines.length; bl++) {
          var bp = branchLines[bl];
          for (var bs2 = 0; bs2 < bp.length - 1; bs2++) {
            var bi2 = segInfo(x, y, bp[bs2], bp[bs2 + 1]);
            if (bi2.d >= bi2.w) continue;
            var be = clamp01(bi2.d / Math.max(1e-6, bi2.w));
            var bd = clamp01(0.34 + 0.46 * be * be);
            if (h < rateBranch + (1 - rateBranch) * be) put(c, r, "trunk", bd, rampChar(bd));
          }
        }

        // 幹：局所座標(uT=長手, vT=横断・符号付き)で樹皮の濃淡を作る
        var onT = null, uT = 0, vT = 0;
        for (var u = 0; u <= 1.0001; u += 0.012) {
          var a1 = trunkAt(u), b1 = trunkAt(Math.min(1, u + 0.012));
          var si = segInfo(x, y, a1, b1);
          if (si.d < si.w) {
            onT = si; uT = u;
            var axv = (b1.x - a1.x) * AX, ayv = b1.y - a1.y;
            var bxv = (x - a1.x) * AX, byv = y - a1.y;
            var lenv = Math.sqrt(axv * axv + ayv * ayv) || 1e-6;
            var cross = axv * byv - ayv * bxv;
            vT = clamp01(Math.abs(cross / lenv / si.w)) * (cross < 0 ? -1 : 1);
            break;
          }
        }
        if (onT) {
          var av = Math.abs(vT), bk = state.bark / 100;
          var dT = 0.24 + 0.34 * av * av;                                    // 丸み（縁が濃い）
          dT += 0.34 * bk * (fbm(uT * 9, vT * 2.4) - 0.45);                  // 樹皮の大きなムラ
          if (Math.sin(vT * 8.5 + fbm(uT * 3.5, 0.5) * 5) > 0.50) dT += 0.19 * bk;  // 縦の裂け目
          dT -= 0.16 * bk * Math.exp(-Math.pow((vT + 0.5) / 0.38, 2));       // 光の当たる面
          dT = clamp01(dT);
          var hm = hash(Math.floor(c / 2) * 3.3 + 5.1, r * 8.9 + 2.7);
          if (hm < mossA) put(c, r, "moss", clamp01(dT + 0.18), "%");
          else if (h < rateTrunk + (1 - rateTrunk) * av) put(c, r, "trunk", dT, rampChar(dT));
        }

        for (var rk = 0; rk < rootLines.length; rk++) {
          var pl = rootLines[rk];
          for (var s = 0; s < pl.length - 1; s++) {
            var ri = segInfo(x, y, pl[s], pl[s + 1]);
            if (ri.d >= ri.w) continue;
            var e2 = clamp01(ri.d / Math.max(1e-6, ri.w));
            if (h < rateRoot) put(c, r, "trunk", clamp01(0.14 + 0.46 * e2 * e2), rampChar(clamp01(0.14 + 0.46 * e2 * e2)));
          }
        }
      }
    }

    // 2. 輪郭（縁だけを最濃で締める）
    function strokeEdges(pl, weight) {
      for (var r2 = 0; r2 < nr; r2++) {
        for (var c2 = 0; c2 < nc; c2++) {
          var x2 = colToX(c2), y2 = rowToY(r2), best = null;
          for (var s2 = 0; s2 < pl.length - 1; s2++) {
            var si2 = segInfo(x2, y2, pl[s2], pl[s2 + 1]);
            if (best === null || si2.d / si2.w < best.d / best.w) best = si2;
          }
          if (!best || best.d >= best.w || best.d <= best.w * 0.76) continue;
          if (hash(c2 * 2.9, r2 * 1.7) > keepOutline) continue;
          put(c2, r2, "outline", weight, dirChar(best.ang));
        }
      }
    }
    var trunkPoly = [];
    for (var u2 = 0; u2 <= 1.0001; u2 += 0.02) trunkPoly.push(trunkAt(u2));
    strokeEdges(trunkPoly, 0.86);
    rootLines.forEach(function (pl) { strokeEdges(pl, 0.80); });
    branchLines.forEach(function (pl) { strokeEdges(pl, 0.84); });

    // 2b. 樹冠の稜線（外周のみ）
    tiers.forEach(function (t, ti) {
      for (var c3 = xToCol(t[0] - t[2]); c3 <= xToCol(t[0] + t[2]); c3++) {
        if (c3 < 0 || c3 >= nc) continue;
        var x3 = colToX(c3), tp3 = tierTop(t, x3);
        if (tp3 === null) continue;
        if (insideAnyTier(x3, tp3 + 0.004, ti)) continue;
        var r3 = yToRow(tp3), i3 = r3 * nc + c3;
        if (i3 >= 0 && i3 < nc * nr && kind[i3] === "outline") continue;
        if (hash(c3 * 2.1, t[5]) > keepRidge) continue;
        var prev = tierTop(t, colToX(c3 - 1));
        var ang3 = prev === null ? 0 : Math.atan2(-(tp3 - prev), (2 / (nc - 1)) * AX);
        put(c3, r3, "ridge", 0.88, dirChar(ang3));
      }
    });

    // 3. 小枝（鹿の角状に分岐・先端ほど淡い）
    function twig(x, y, ang, len, depth, seed, d) {
      if (depth <= 0 || len < 0.012) return;
      var steps = Math.max(2, Math.round(len * nc * 0.7));
      for (var s4 = 0; s4 <= steps; s4++) {
        var uu = s4 / steps;
        var px = x + Math.cos(ang) * len * uu / AX, py = y + Math.sin(ang) * len * uu;
        var c4 = xToCol(px), r4 = yToRow(py), i4 = r4 * nc + c4;
        if (c4 < 0 || c4 >= nc || r4 < 0 || r4 >= nr) continue;
        if (kind[i4] === "outline" || kind[i4] === "ridge" || kind[i4] === "trunk" || kind[i4] === "moss") continue;
        if (insideAnyTier(px, py, -1)) continue;
        put(c4, r4, "twig", d, dirChar(ang));
      }
      var ex = x + Math.cos(ang) * len / AX, ey = y + Math.sin(ang) * len;
      var sp = 0.34 + 0.28 * hash(seed, depth);
      var down = function (a) { return Math.max(-Math.PI / 2 - 1.15, Math.min(-Math.PI / 2 + 1.15, a)); };
      twig(ex, ey, down(ang + sp), len * 0.62, depth - 1, seed + 1.7, d * 0.78);
      twig(ex, ey, down(ang - sp * 0.85), len * 0.58, depth - 1, seed + 3.3, d * 0.74);
    }
    if (state.twig > 0) {
      // 3a. 樹冠の下縁から垂らす
      tiers.forEach(function (t, ti) {
        for (var k = 0; k < state.twig; k++) {
          var uu2 = -0.82 + 1.64 * ((k + 0.5) / state.twig);
          var x5 = t[0] + uu2 * t[2], bt5 = tierBot(t, x5);
          if (bt5 === null) continue;
          var ang5 = -Math.PI / 2 + uu2 * 0.85 + (hash(ti * 5.3 + k, 2.9) - 0.5) * 0.22;
          twig(x5, bt5 - 0.006, ang5, (state.twigLen / 1000) * (1 - 0.30 * Math.abs(uu2)),
               state.twigDepth, ti * 11 + k, 0.72);
        }
      });
      // 3b. 枝の先端寄りからも出す（樹冠の外へ抜けた分だけが見える）
      var fb = state.twigBranch / 100;
      if (fb > 0.02) {
        branchLines.forEach(function (pl, bi) {
          var ts = branchSrc[bi].twigScale === undefined ? 1 : branchSrc[bi].twigScale;
          for (var q = Math.max(1, Math.floor(pl.length * 0.45)); q < pl.length; q++) {
            var p2 = pl[q], n2 = Math.max(1, Math.round(state.twig * fb * ts));
            for (var z = 0; z < n2; z++) {
              var a0 = -Math.PI / 2 + (hash(bi * 3.1 + q * 1.7, z * 2.3) - 0.5) * 2.0;
              twig(p2.x, p2.y, a0,
                   (state.twigLen / 1000) * (0.62 + 0.45 * hash(z * 1.3, bi + q)) * (0.55 + 0.45 * ts),
                   state.twigDepth, bi * 31 + q * 7 + z, 0.70);
            }
          }
        });
      }
    }

    // 4. セル配列へ（濃度→描画のalpha）
    var gm = 100 / state.gamma, ik = state.ink / 100;
    cells = [];
    for (var g = 0; g < nc * nr; g++) {
      if (!chg[g]) continue;
      var cc = g % nc, rr = Math.floor(g / nc), k2 = kind[g];
      var base = k2 === "outline" || k2 === "ridge" || k2 === "twig"
        ? dn[g] : 0.20 + 0.72 * Math.pow(clamp01(dn[g]), gm);
      cells.push({
        kind: k2 || "trunk",
        c: state.flip === 1 ? (nc - 1 - cc) : cc, r: rr,
        ch: state.flip === 1 ? ({ "/": "\\", "\\": "/" }[chg[g]] || chg[g]) : chg[g],
        weight: clamp01(base * ik),
        rnd: hash(cc * 5.3 + 1.1, rr * 9.7 + 4.9), rnd2: hash(cc * 2.9 + 8.3, rr * 4.1 + 2.7)
      });
    }
    for (var m = 0; m < cells.length; m++) cells[m].distN = 1 - cells[m].r / (nr - 1);
  }


// 確定パラメータ（会話で確定した値）
Object.assign(state, {
  density: 2, theme: 0, flip: FLIP, color: 1, satur: 100, solid: 100,
  gamma: 200, ink: 150, moss: 8, bark: 121,
  root: 110, rootW: 38, rootD: 100,
  angle: 50, girth: 100, len: 100, midBranch: 116, wobble: 110,
  crown: 109, lobe: 102, fill: 100,
  twig: 0, twigLen: 50, twigDepth: 2, twigBranch: 0
});
buildArt();
console.log(JSON.stringify({ cols: cols, rows: rows, cells: cells }));
