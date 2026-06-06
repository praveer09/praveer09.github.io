# Architecture & operations reference

A living reference for **how this blog is built and run** — the stack, the repo
layout, how to add a post, how it deploys, and the gotchas worth remembering.

> If you want the *story* of the migration (why these choices were made), see the
> archived plan in [`archive/plan/`](./archive/plan/README.md) and the research in
> [`archive/research/`](./archive/research/README.md). The public write-up is the post
> _"Build once, deploy many: the anatomy of this blog"_.

---

## The stack at a glance

| Stage | Tools |
| --- | --- |
| **Author** | Markdown · MDX · Mermaid (` ```mermaid ` → static SVG) |
| **Source & tooling** | Git on GitHub · pnpm · Node (`>=22.12`, pinned in `.nvmrc`) · Dependabot |
| **Build** (GitHub Actions) | Astro 6 · TypeScript · Tailwind v4 · `sharp` (images) · Playwright/Chromium (renders Mermaid → SVG) |
| **Quality gates** | ESLint · Prettier · `astro check` · `verify-redirects` · `verify-diagrams` · lychee (links, non-blocking) · Lighthouse (non-blocking) |
| **Deploy** | `wrangler` Direct Upload (`cloudflare/wrangler-action`) — build once, deploy the same `dist/` |
| **Serve** | Cloudflare Pages (edge, production at **praveergupta.in**) + GitHub Pages (mirror) |
| **Reach the reader** | giscus comments · Cloudflare Web Analytics (cookieless) · RSS (`/rss.xml`) · sitemap |

**Design priority:** Markdown authoring experience + easy maintainability (focus on
writing), on a fully static site (zero server to run, fast at the edge).

---

## Repo layout

```
src/
  assets/fonts/        Atkinson Hyperlegible (self-hosted woff)
  components/          BaseHead, Header, HeaderLink, Footer, FormattedDate, Comments
  content/blog/        one folder per post: <slug>/index.md (+ co-located images)
  layouts/             BlogPost.astro (post shell; wraps body in <div class="prose">)
  pages/               index.astro, about.astro, blog/, tags/, rss.xml.js …
  styles/global.css    Bear Blog base + additive Tailwind v4 (no Preflight)
  consts.ts            SITE_TITLE, GISCUS ids, CF_ANALYTICS_TOKEN
  content.config.ts    blog collection schema (frontmatter contract)

scripts/               build-time helpers (see "Redirects" + "Scripts" below)
.github/workflows/     ci.yml (build + gates + Cloudflare deploy), deploy-pages.yml (GH Pages mirror)
docs/                  this reference, archive/plan/, archive/research/
astro.config.mjs       site, integrations (mdx, sitemap), Mermaid rehype, fonts
```

---

## Common tasks

### Add a new post
1. Create `src/content/blog/<slug>/index.md` (co-locate images in the same folder).
2. Frontmatter must satisfy the schema in `src/content.config.ts` — typically
   `title`, `description`, `pubDate`, `tags`, optional `cover`, optional
   `redirectFrom` (old URLs that should 301 here).
3. Write in Markdown/MDX. Diagrams go in ` ```mermaid ` fenced blocks (rendered to
   SVG at build — no client JS).
4. New post lives at `/blog/<slug>/`.

### Local development & checks
```bash
pnpm dev            # local dev server
pnpm build          # prebuild (redirects) → astro build → postbuild (fixes + verifiers)
pnpm preview        # serve the built dist/ locally
pnpm lint           # eslint . && prettier --check .   (tabs, single quotes)
pnpm format         # prettier --write .
pnpm typecheck      # astro check
```

`pnpm build` runs three phases via package.json:
- **prebuild:** `gen-redirects` + `gen-redirect-stubs`
- **build:** `astro build`
- **postbuild:** `fix-mermaid-br` → `verify-redirects` → `verify-diagrams`

---

## Deploy flow ("build once, deploy many")

- **PRs** → `ci.yml` builds + runs all gates, then deploys a **Cloudflare preview**
  (unique `https://<hash>.praveergupta.pages.dev` per deployment — these are pinned
  snapshots; each push gets a new hash).
- **Merge to `master`** → `ci.yml` deploys the same artifact to **Cloudflare Pages
  production** (praveergupta.in) via `wrangler` Direct Upload, **and**
  `deploy-pages.yml` publishes the **GitHub Pages mirror**.
- The build happens **once** in CI; Cloudflare serves exactly the bytes that were
  tested (no rebuild-from-source on the host).

Secrets required (repo settings): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

---

## Redirects (don't lose old URLs)

Single source of truth = each post's **`redirectFrom`** frontmatter (all old paths).
Two emitters turn that into outputs:
- `scripts/gen-redirects.mjs` → `_redirects` (Cloudflare 301s).
- `scripts/gen-redirect-stubs.mjs` → HTML stub pages (meta-refresh + canonical) so the
  old **github.io** URLs keep working.

Verification:
- `scripts/verify-redirects.mjs` — build-time gate (every mapping resolves).
- `scripts/verify-live-redirects.mjs` (`pnpm verify:live`) — checks the deployed site.

---

## Config touchpoints

| Want to change… | Edit |
| --- | --- |
| Site title / nav | `src/consts.ts`, `src/components/Header.astro` |
| Comments (giscus repo/category IDs) | `src/consts.ts` → `GISCUS` |
| Analytics token | `src/consts.ts` → `CF_ANALYTICS_TOKEN` |
| Fonts | `astro.config.mjs` `fonts:` + `src/assets/fonts/` |
| Global styles / theme tokens | `src/styles/global.css` |
| Mermaid theme / SVGO | `astro.config.mjs` `rehypeMermaid` block |

---

## Gotchas worth remembering

These are the non-obvious things that cost real debugging time. Check here first when
something looks "missing" or "off."

1. **No Tailwind Preflight (by design).** `global.css` imports only Tailwind's theme +
   utilities layers, *not* Preflight (so it wouldn't wipe the Bear Blog base). The
   trade-off: any Tailwind Typography (`prose`) feature that *assumes* Preflight can
   break silently. The classic case was **table borders** — prose sets border *width +
   color* but relies on Preflight for `border-style: solid` **and**
   `table { border-collapse: collapse }`. Both are supplied manually in `global.css`
   under the `.prose table` / `.prose thead, .prose tbody tr` rules.

2. **Cascade layers: unlayered beats any `@layer`.** Bear Blog element defaults live in
   `@layer base` so Tailwind Typography (which compiles into `@layer utilities`) **owns
   typography inside `.prose` posts**, while those defaults still style non-prose pages
   (home, about, header, footer). Deliberate brand overrides are kept **unlayered** so
   they beat prose. If a heading/table/etc. ignores prose, check whether a competing
   rule is unlayered.

3. **Mermaid `<br>` double-spacing.** The inline-SVG Mermaid output contains invalid
   `<br></br>`, which browsers parse as *two* line breaks (doubled label spacing) even
   though VS Code shows it fine. Fixed by the **postbuild** `scripts/fix-mermaid-br.mjs`,
   which rewrites `<br></br>` → `<br/>` across `dist/`. Keep it wired in `postbuild`.

4. **Mermaid 2-column grids.** To get a clean N×2 grid, connect the row **subgraphs**
   (`r1 --> r2`), not their child nodes — an edge crossing into a subgraph's children
   makes Mermaid ignore that subgraph's `direction LR`.

5. **Mermaid needs headless Chromium at build.** Playwright/Chromium renders diagrams;
   it can flake under back-to-back load (launch race) and usually passes on retry.
   `verify-diagrams` asserts every diagram actually rendered (blocking gate).

6. **Cloudflare double-deploys.** If the Pages project still has the **Git integration**
   connected, you'll see empty "No deployment available" rows alongside the real Actions
   deploys. The GitHub Actions `wrangler` Direct Upload is the deployer — disconnect the
   Git integration in the Pages project to stop the duplicate rows.

---

## Pointers

- Archived migration plan: [`archive/plan/`](./archive/plan/README.md)
- Research (assessment + greenfield blueprint): [`archive/research/`](./archive/research/README.md)
