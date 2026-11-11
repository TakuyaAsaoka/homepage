// 画面を撮る一覧（capturing-screens-to-canvas が読む）。
// パスの前置きは astro.config.mjs の base と同じにする（違うと「送り返された」になる）
const BASE = "/homepage/";

export default {
	title: "ASAOKA Homepage 画面一覧",
	favicon: "🗂️",
	artifactUrl: "",
	baseURL: "http://127.0.0.1:4399",
	start: "npm run build && npm run preview -- --host 127.0.0.1 --port 4399",
	groups: [
		{
			title: "公開ページ",
			screens: [
				{ title: "Home", path: BASE },
				{ title: "About", path: `${BASE}about/` },
				{ title: "Works一覧", path: `${BASE}works/` },
			],
		},
	],
};
