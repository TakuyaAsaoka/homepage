import { defineCollection, type SchemaContext } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// 画像欄。image() はMarkdown・YAMLからの相対パスを解決し、寸法つきの画像として読み込む。
// CMSで一度設定した画像を消すと空文字が残るが、image() は空文字も「画像あり」として
// 通してしまうため、先に空文字を受けてから「未設定」に正規化する
const optionalImage = (image: SchemaContext["image"]) =>
  z
    .union([z.literal(""), image()])
    .optional()
    .transform((v) => v || undefined);

// 任意の一文。CMSで消すと空文字が残るため、空白だけの値も「未設定」に正規化する
const optionalText = z
  .string()
  .optional()
  .transform((v) => v?.trim() || undefined);

const works = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/works" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      image: optionalImage(image),
      // その制作で担当したことと、作って良くなったこと。カードに1行ずつ出す。
      // 書けない制作では行ごと出さないため任意
      role: optionalText,
      outcome: optionalText,
      url: z.url().optional(),
      // 公開日は暦日（どこで見ても動かない日付）。瞬間として持つとビルド環境のTZで1日ずれるため、
      // "YYYY-MM-DD" 文字列に正規化して保持する
      pubDate: z.coerce.date().transform((d) => d.toISOString().slice(0, 10)),
      draft: z.boolean().default(false),
    }),
});

// SNSリンク等は空文字で「使わない」を表すため、URL形式か空文字のみ許可する
const emptyableUrl = z.union([z.url(), z.literal("")]);

// Homeページの文言（CMS管理）。表示名はサイト設定の author を使うためここには持たない
const home = defineCollection({
  loader: glob({ pattern: "home.yaml", base: "./src/content/pages" }),
  schema: ({ image }) =>
    z.object({
      hero: z.object({
        role: z.string(),
        // 一番大きい見出し。改行した位置でそのまま行を分ける
        heading: z.string(),
        lead: z.string(),
        // 副業のひとこと。窓の「side:」の行に出す。書かなければ行ごと出さない
        side: optionalText,
      }),
      profile: z.object({
        photo: optionalImage(image),
        place: z.string(),
        linkLabel: z.string(),
      }),
      // できること。道具の名前（tools）は説明の下に小さく並べる。
      // 0件だと見出しだけが残るため、1件以上を求める
      services: z
        .array(
          z.object({
            title: z.string(),
            body: z.string(),
            tools: z.array(z.string()).default([]),
          }),
        )
        .min(1),
      contact: z.object({
        invite: z.string(),
      }),
    }),
});

// Aboutページの文言（CMS管理）。セクションは追加・削除・並び替え可能
const about = defineCollection({
  loader: glob({ pattern: "about.yaml", base: "./src/content/pages" }),
  schema: z.object({
    lead: z.string(),
    sections: z.array(
      z.object({
        title: z.string(),
        label: z.string(),
        body: z.string(),
      }),
    ),
  }),
});

// サイト全体の設定（CMS管理）。技術的な定数は src/consts.ts に残す
const settings = defineCollection({
  loader: glob({ pattern: "site.yaml", base: "./src/content/settings" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    copyrightHolder: z.string(),
    email: z.email(),
    social: z.object({
      github: emptyableUrl,
      twitter: emptyableUrl,
      youtube: emptyableUrl,
    }),
    noteRssUrl: emptyableUrl,
  }),
});

export const collections = { works, home, about, settings };
