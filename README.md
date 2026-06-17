# Praveer's Musings

The source code for [praveergupta.in](https://praveergupta.in) — my personal blog,
where I share my learnings on software craftsmanship.

It's a statically generated site built with [Astro](https://astro.build), authored
in Markdown/MDX, and deployed to GitHub Pages.

## ✨ Features

- 📝 Posts authored in Markdown & MDX
- 🎨 Styled with Tailwind CSS and the Typography plugin
- 🌗 Light/dark theme toggle
- 📊 Diagrams rendered from `mermaid` code blocks to static inline SVG at build time (zero client JS)
- 💬 Comments backed by GitHub Discussions via [giscus](https://giscus.app)
- 📈 Cookieless visitor stats via Cloudflare Web Analytics
- 🔎 SEO-friendly with canonical URLs and Open Graph data
- 🗺️ Sitemap and RSS feed support
- 🔤 Self-hosted [Atkinson Hyperlegible](https://www.brailleinstitute.org/freefont/) font

## 🚀 Project Structure

```text
├── public/              # Static assets served as-is (favicon, etc.)
├── scripts/             # Build-time helpers (redirects, diagram checks)
├── src/
│   ├── assets/          # Fonts and images processed at build time
│   ├── components/      # Astro components (header, footer, comments, …)
│   ├── content/         # Blog posts (Markdown/MDX content collection)
│   ├── layouts/         # Page layouts
│   ├── pages/           # Routes (index, about, blog, tags, rss)
│   ├── styles/          # Global styles
│   ├── consts.ts        # Site-wide config (title, giscus, analytics)
│   └── content.config.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command          | Action                                      |
| :--------------- | :------------------------------------------ |
| `pnpm install`   | Installs dependencies                       |
| `pnpm dev`       | Starts local dev server at `localhost:4321` |
| `pnpm build`     | Build the production site to `./dist/`      |
| `pnpm preview`   | Preview the build locally before deploying  |
| `pnpm typecheck` | Type-check the project with `astro check`   |
| `pnpm lint`      | Run ESLint and Prettier checks              |
| `pnpm format`    | Format the codebase with Prettier           |

## 🛠️ Built With

This blog stands on the shoulders of these excellent open-source projects:

- [Astro](https://astro.build) — the static site framework, with the official
  [MDX](https://docs.astro.build/en/guides/integrations-guide/mdx/),
  [RSS](https://docs.astro.build/en/guides/rss/), and
  [Sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) integrations
- [Tailwind CSS](https://tailwindcss.com) + [`@tailwindcss/typography`](https://github.com/tailwindlabs/tailwindcss-typography) — styling
- [Mermaid](https://mermaid.js.org) via [`@beoe/rehype-mermaid`](https://github.com/BadgerHobbs/beoe) — diagrams as build-time SVG
- [Shiki](https://shiki.style) — syntax highlighting for code blocks
- [giscus](https://giscus.app) — comments powered by GitHub Discussions
- [Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/) — privacy-friendly, cookieless analytics
- [sharp](https://sharp.pixelplumbing.com) — image optimization
- [Prettier](https://prettier.io) & [ESLint](https://eslint.org) — formatting and linting

The initial scaffolding was based on the official Astro Blog starter template,
whose theme draws inspiration from the lovely
[Bear Blog](https://github.com/HermanMartinus/bearblog/).

## 📄 License

See [LICENSE](./LICENSE) for the license covering this repository's code.
