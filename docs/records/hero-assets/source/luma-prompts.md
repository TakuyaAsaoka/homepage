# Luma Dream Machine — ヒーロー動画の生成手順

## 進め方

```
STEP 1（無料枠・8本）  現状の絵でループ品質を確認 → 使えそうか判断
STEP 2（Plus $29.99）  高解像度化した絵で本番生成 → 選抜 → ダウンロード → 解約
```

STEP 1は**品質の見極めだけ**が目的なので、絵は今のもの（1672×941）で構いません。

---

## STEP 1：無料枠で試す

### 設定

| 項目 | 値 |
|---|---|
| モード | **Image to Video** |
| 入力画像 | `scene-full.png`（今の絵） |
| **Loop** | **必ずON**（プロンプト欄の**無限記号アイコン**をクリック） |
| 長さ | **10秒**（ループ周期が長いほど繰り返しに気づきにくい） |
| 解像度 | 1080p |

### プロンプト（4案）

**同じ絵から4つ試して、動きの質を比べてください。** 無料枠は8本なので、各2回ずつ試せます。

#### A. 基本（まずこれ）

```
Static camera, no camera movement. Traditional Japanese ink painting style
strictly preserved. Gentle mist drifts slowly and horizontally. A few maple
leaves fall softly through the air. Pine branches sway almost imperceptibly.
Very subtle, calm, quiet motion. Seamless loop.
```

#### B. 霞を主役に

```
Static camera. Traditional Japanese ink painting, style preserved exactly.
Horizontal bands of pale mist flow slowly across the scene, thinning and
thickening. Everything else remains still. Extremely subtle and serene.
Seamless loop.
```

#### C. 落ち葉を主役に

```
Static camera. Traditional Japanese ink painting, unchanged style.
Autumn maple leaves drift and flutter downward, rotating gently as they fall.
The pine tree and rocks remain completely still. Quiet, delicate motion.
Seamless loop.
```

#### D. 動き最小（最も安全）

```
Static camera, absolutely no camera motion. Traditional Japanese painting,
style and composition completely unchanged. Only the faintest breath of
movement: mist barely drifting, one or two leaves falling. Almost still.
Seamless loop.
```

### 生成後のチェックリスト

**この5点で落とします。1つでも該当したら不採用。**

- [ ] **絵のタッチが崩れていないか**（写実化・シャープ化していないか）
- [ ] **松の形が変わっていないか**（AIが枝を勝手に描き足す・変形させることがあります）
- [ ] **石灯篭・岩の輪郭が保たれているか**（人工物は特に崩れやすい）
- [ ] **ループの継ぎ目が見えないか**（最後→最初の瞬間を注視）
- [ ] **動きが過剰でないか**（背景として見続けられる静けさか）

**5〜10テイク生成して1本選ぶ**くらいの想定でいてください。1本目で当たることは稀です。

---

## STEP 2：本番生成

STEP 1で「使える」と判断できたら進みます。

### 1. 絵の高解像度化

| ツール | 種類 | 費用 |
|---|---|---|
| **Topaz Gigapixel 8** | 保存系（にじみを潰さない） | $99買い切り |
| Magnific Precision V2 | 生成系（ディテールを発明する） | 無料枠あり |

**両方で同じ絵を2倍（3344×1882）に拡大し、たらしこみの階調が保たれている方**を採用してください。日本画は「にじみ・かすれ」が価値なので、それを整えてしまう方は不採用です。

### 2. Plusプラン契約（$29.99/月）

- 商用利用権が付き、透かしが消えます
- **1ヶ月で解約して構いません**。有料期間中に生成したものは、解約後も永久に商用利用できます

### 3. 本番生成

高解像度化した絵を入力に、STEP 1で良かったプロンプトで**5〜10本**生成。同じチェックリストで選抜。

### 4. ⚠️ 必ずダウンロードして保管

```
解約後30日でLumaのサーバーからデータが消える可能性があります
（"Luma will be under no obligation to store or retain the applicable Input"）
```

**採用したもの・候補・入力画像すべてをローカルに保存**してください。権利は残りますが、ファイルは残りません。

---

## 私が引き取る作業

動画をいただいたら以下を行います。

1. **ループ継ぎ目の処理**（ffmpegでクロスフェード。Loop機能で足りなければ）
2. **エンコード**（H.264をベースに、AV1/WebMを追加。1440p / CRF 22 目標）
3. **poster画像の抽出**（第0フレームをAVIF化。これがJS無効・低性能環境・reduced-motion時の表示になります）
4. **実装**（`<video autoplay muted loop playsinline>` ＋ ASCIIからのフェード連携）

容量は10秒1080pで**2〜4MB**を見込んでいます。超えるようなら1080pに落として調整します。
