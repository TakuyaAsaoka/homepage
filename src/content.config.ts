import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const works = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/works" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).default([]),
    // CMSで一度設定した画像を消すと空文字が残る。表示・OGP・JSON-LDの各所で
    // 空文字を判定し直さずに済むよう、ここで「未設定」に正規化する
    image: z
      .string()
      .optional()
      .transform((v) => v || undefined),
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
  schema: z.object({
    hero: z.object({
      role: z.string(),
      tagline: z.string(),
    }),
    intro: z.object({
      text: z.string(),
      linkLabel: z.string(),
    }),
    skills: z.array(z.string()),
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
