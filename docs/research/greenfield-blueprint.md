# Greenfield: Building "Praveer's Musings" the Right Way (2026)

**Scenario:** Forget the old repo. If you were starting from absolute zero today — with two goals, (1) *write and publish regularly* and (2) *learn modern, current ways of building apps* — what is the right stack and the right way to build it?

This is an **opinionated blueprint**. Where there's a real decision, I name the winner, the runner-up, and *why*. A guiding principle runs throughout: **proportionality** — this is a personal blog, not a SaaS. Adopt modern practices that teach you something or save you time; skip ceremony that only makes sense for teams.

---

## TL;DR — The Recommended Stack

| Layer | Choice | One-line reason |
|---|---|---|
| **Framework** | **Astro (v5+)** | Content-first SSG that teaches the *modern* web (TS, components, Vite, islands) without shipping needless JS |
| **Language** | **TypeScript** | The 2026 default; type-safe content + tooling |
| **Content** | **Markdown/MDX + Content Collections** | Author in Markdown; Zod-validated frontmatter catches mistakes at build time |
| **Styling** | **Tailwind CSS (v4)** + a few design tokens | Fast, modern, no CSS-file sprawl; v4 config is near-zero |
| **Package manager** | **pnpm** | Fast, disk-efficient, strict; the current default |
| **Runtime pin** | **Node LTS** via `.nvmrc` + `"engines"` | Reproducible across machines/CI |
| **Hosting** | **Cloudflare Pages** (primary) — GitHub Pages is the fine fallback | Free, global edge, **per-PR preview deploys**, built-in privacy analytics |
| **CI/CD** | **GitHub Actions** | Lint, typecheck, build, link/a11y/Lighthouse checks on every PR |
| **Comments** | **giscus** | GitHub Discussions-backed; free, no tracking |
| **Analytics** | **Cloudflare Web Analytics** | Privacy-first, no cookie banner, free |
| **Quality** | **ESLint + Prettier** (Astro plugins) | Best-supported `.astro` tooling today; Biome's Astro support is still experimental |
| **Deps** | **Dependabot** (or Renovate if you want grouping) | Native, automated security + version PRs |
| **Dev env** | **Dev Container / Codespaces** | One-click reproducible environment, editable from anywhere |

**The single most important choice is Astro.** It uniquely satisfies *both* goals: it's a first-class static blog generator (goal 1) and it's a genuine modern web framework — TypeScript, Vite, component islands, SSR/edge when you want it — so maintaining it actually teaches you current app-building (goal 2).

---

## 0. Migration First (do this before any stack decisions are final)

"Forget the old repo" applies to the *tooling*, not the *content or its URLs*. The old blog has 20 posts that are indexed by search engines, linked from other sites, and subscribed to via RSS. Breaking those URLs silently throws away a decade of SEO and inbound links. So the first work item — before styling, components, or hosting polish — is a migration plan:

1. **Inventory old URLs** from *both* sources you control (see §0a — the `praveergupta.in`/Medium set is the higher priority).
2. **Decide a canonical permalink pattern** for the new site. Two coherent strategies — pick one and apply it consistently:
   - **(A) Redirect, recommended.** Serve all posts at a clean new pattern (e.g. `/blog/<slug>/`) and **301-redirect** every old URL to its new home. List each post's old path(s) in a `redirectFrom` frontmatter array (see §2 schema); a small build script emits a Cloudflare `_redirects` file from those. 301s preserve SEO/link-equity and are far simpler than recreating the old routing.
   - **(B) Render in place.** Keep the *exact* old paths by routing every post through a single root catch-all (`src/pages/[...slug].astro`) whose `getStaticPaths()` derives the URL from a `permalink` field. Zero redirects, but more routing complexity and you inherit the old URL scheme forever.
3. **For any URL that still changes, add a 301** (the `_redirects` file from strategy A). Cloudflare Pages serves `_redirects` natively — a concrete reason it edges out GitHub Pages here (§4).
4. **Keep the feed alive:** serve RSS at the same path the old `feed.xml` used (or 301-redirect it), and preserve item GUIDs where practical so existing subscribers aren't re-notified of every old post.
5. **Verify in CI:** keep a checked-in list of critical old URLs and fail the build (via a link-check job, §5) if any stops resolving.

Treat this as a first-class deliverable, not cleanup. Everything below assumes URL continuity is handled here.

---

## 0a. Reclaiming `praveergupta.in` from Medium (highest-value migration)

You also publish the same posts on **Medium**, mapped to your own domain **`praveergupta.in`** — and *those links are your most popular ones*. Medium is **removing custom-domain support on the free plan**: custom domains now require a paid Medium Membership, and if you don't pay, `praveergupta.in` simply stops resolving to your Medium content — **with no redirect** — so that traffic and SEO authority evaporate.[^m1] This is both a risk and an opportunity: because **you own the domain at your registrar**, you can repoint it to the *new* site and capture all that link equity instead of losing it.

### The strategic call: make `praveergupta.in` your canonical domain
Since the `praveergupta.in` links outperform the `praveer09.github.io` ones, **`praveergupta.in` should become the primary/canonical domain of the new Astro site** — not github.io. Set `site: "https://praveergupta.in"` in `astro.config`, point the domain there, and **301-redirect `praveer09.github.io` → `praveergupta.in`** so all three identities (Medium domain, GitHub Pages, new site) consolidate into one canonical home.

### ⏱️ Harvest the old URLs now (while the custom domain still resolves)
Grab the URL inventory *before* cutover — it's the easiest way to capture the exact old `praveergupta.in/...` paths. (After cutover, Medium's export and `medium.com/feed/@<handle>` may still help, but they'll expose `medium.com` URLs rather than your custom-domain paths.)[^m2]
1. **Export from Medium (primary, complete source)** — Settings → *Download your information* → the ZIP's `index.html` lists *every* story and its URL. Use this as your authoritative inventory; the RSS feed only returns the ~10 most recent posts, so it can't enumerate your full back-catalogue.
2. **RSS as a supplement/sanity-check** — `https://medium.com/feed/@<your-handle>` (or `https://praveergupta.in/feed` while still live) is handy to spot-verify recent slugs, but don't rely on it for completeness.[^m2]

**Normalize every harvested URL** before building redirects: keep only the path, and **strip query strings and fragments** (Medium RSS links carry `?source=rss-...`, and Cloudflare `_redirects` sources are path-only — a trailing `?...` won't match). Store e.g. `/practical-guide-to-java-stream-api-7aadc02908f7`, not the full querystring'd URL.

Save this as your **old-URL inventory** — it feeds the redirect map below.

### Medium URL shape → redirect mapping
Medium custom-domain post URLs look like `https://praveergupta.in/<human-slug>-<12-char-hex-id>` (e.g. `.../practical-guide-to-java-stream-api-7aadc02908f7`). The stable, permanent part is the **12-char hex post ID**, not the slug (Medium re-slugs on title edits), so the most robust map uses the **exact harvested URLs** as static redirects. Since you harvested the full list, just emit one exact line per post; add a slug-prefix splat only as a safety net. In a Cloudflare Pages `_redirects` file (Netlify-style syntax; a trailing `*` splat is allowed; 2,000 static + 100 dynamic redirects on the free tier — vastly more than ~20 posts need):[^m3]
```
# _redirects  (old Medium path on praveergupta.in  →  new canonical post  status)
# Preferred: exact full URL (slug + stable hex id) — most robust
/practical-guide-to-java-stream-api-7aadc02908f7  /blog/practical-guide-to-java-stream-api/  301
/rxjava-part-1-a-quick-introduction-abc123def456  /blog/rxjava-part-1-a-quick-introduction/  301
# Safety-net: slug-prefix splat (only valid with the splat at the END)
/practical-guide-to-java-stream-api-*             /blog/practical-guide-to-java-stream-api/  301
# Medium /p/<id> short links, if any have inbound traffic
/p/7aadc02908f7                                   /blog/practical-guide-to-java-stream-api/  301
# RSS continuity
/feed                                             /rss.xml                                   301
```
> Note: in `_redirects` the `*` splat is only valid at the *end* of the source path — you can't match on the id alone (`/*-7aadc...`). That's another reason to prefer the exact harvested URLs. Leave the default `404.html` to handle unmatched paths (don't add a `/* … 404` line — `_redirects` is for redirect status codes, not 404 rewrites).

Generate these lines from each post's `redirectFrom` frontmatter (Strategy A in §0) — list the post's old Medium URL(s) there and let `scripts/gen-redirects.mjs` emit the file. For very large or messy URL sets, Cloudflare **Bulk Redirects** or **Redirect Rules** (regex/wildcards) are the zone-level alternative, but `_redirects` is simpler and sufficient here.[^m3]

### DNS cutover steps
1. **Back up the current DNS zone first.** Before touching anything, record all existing records — **especially email (`MX`, plus `SPF`/`DKIM`/`DMARC` `TXT`) records** if `praveergupta.in` sends/receives mail. Moving nameservers without re-creating these will silently break email.
2. **Add `praveergupta.in` to Cloudflare** (change the nameservers at your registrar to Cloudflare's), and re-create every record you backed up. This also unlocks the redirect + analytics features in §4.
3. **Unlink the custom domain inside Medium's settings** and **remove the stale Medium DNS records** (the `CNAME`/verification records pointing at Medium's custom-domain endpoint), so there's no ownership/verification conflict.
4. **Point the domain at Cloudflare Pages:** add **both** `praveergupta.in` (apex, via Cloudflare's CNAME flattening) **and** `www.praveergupta.in` as custom domains on the Pages project, and **wait for the SSL certificate to issue** before declaring cutover done (if issuance stalls, check `CAA` records).
5. **Deploy the new site** with the `_redirects` file in place, then test a handful of real old Medium URLs return a `301` to the right new posts.
6. **Fold in `praveer09.github.io`:** 301-redirect it to `praveergupta.in` where supported (a Pages/repo redirect). True server-side 301s from GitHub Pages are limited — if you can't issue a real 301, use a `rel=canonical` plus a minimal meta-refresh redirect page as a fallback.

### What you *can't* redirect (and what to do instead)
You only control `praveergupta.in`. The Medium-hosted copies at `medium.com/@<handle>/...` and `<handle>.medium.com/...` stay on Medium's servers — you **cannot 301 those**. Do two things to consolidate authority:
1. **On the new site**, emit a self-referential `<link rel="canonical">` to each post's `praveergupta.in` URL.
2. **On Medium**, set each story's canonical / "original source" URL to the new `praveergupta.in/...` URL where Medium allows it (Medium's import tool and story settings support this). If a Medium copy can't be made to canonicalize correctly, either keep it as a mirror that links back, or **unpublish it after the new site is live** to avoid duplicate-content dilution.

---

## 1. The Framework Decision (the one that matters)

You have four serious options. Scored against *your* two goals:

| | Writing-first? | Teaches modern app dev? | Maintenance | Verdict |
|---|---|---|---|---|
| **Astro** | ✅ Excellent | ✅ **Yes** (TS, Vite, islands, SSR) | Low–med (Node) | ⭐ **Winner** |
| **Eleventy (11ty)** | ✅ Excellent | 🟡 Some (Node/ESM, but no components) | Low | Strong runner-up if you want minimalism |
| **Hugo** | ✅ Excellent | ❌ No (Go templates, niche skill) | Very low | Pick only if build speed/zero-runtime is paramount |
| **Next.js** | 🟡 Overkill | ✅ Yes (but React/server-heavy) | Med–high | Wrong tool for a blog; learn it on an *app*, not here |

**Why Astro over the runner-up (Eleventy):** Eleventy is delightful and lower-overhead, but it deliberately *doesn't* teach you component-based UI, TypeScript-first workflows, or a modern bundler. Since "learn modern app building" is an explicit goal, Astro's islands + Vite + TS give you transferable skills that map directly onto Next.js/SvelteKit later. Astro's "zero JS by default" means you pay none of the React-app weight for a content site.

**Why not Next.js:** Next is a fantastic framework — for *applications*. For a blog it's heavier, pushes you toward React-everything, and its big-ticket features (Server Components, ISR, middleware) are overkill here. Better to learn Next later by building an actual app; don't contort a blog into being one.

---

## 2. Content Architecture (where you'll spend your time)

Author posts in **Markdown** (plain `.md`), reaching for **MDX** only when a specific post needs an interactive component. Use **Astro Content Collections** with a **Zod schema** so frontmatter is validated at build time:

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  // generateId strips the trailing /index and extension so folder-per-post
  // still yields clean slugs (and lets us preserve old Jekyll URLs)
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/blog',
    generateId: ({ entry }) =>
      entry.replace(/\/index\.(md|mdx)$/, '').replace(/\.(md|mdx)$/, ''),
  }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),            // required → forces good SEO/OG
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Strategy A (redirects): old URLs to 301 from. Strategy B (render in place):
    // use `permalink` instead and route via a root catch-all. Pick one (see §0).
    redirectFrom: z.array(z.string()).default([]),
    permalink: z.string().optional(),
    cover: z.object({                  // alt is required → keeps a11y honest
      src: image(),
      alt: z.string(),
    }).optional(),
  }),
});

export const collections = { blog };
```

Why this matters: the schema is your *guardrail*. A typo'd date or a missing description fails the build instead of silently shipping — exactly the kind of correctness the old blog lacked (it had frontmatter drift across years). It also gives you autocomplete and type-safety when listing posts. The `redirectFrom`/`permalink` fields are your **migration levers** — they feed the URL-continuity strategy you chose in §0.

**Draft rule:** posts with `draft: true` must be filtered out of *every* listing — index, RSS, sitemap, tag pages, and related-post lists — in one shared `getCollection` helper. Note that a draft in a public repo is still public *source*; for truly private drafts, keep them on a branch and preview via a PR deploy.

**One-post-per-folder convention** (`src/content/blog/2026-01-modern-blog/index.md` + colocated images) keeps each post self-contained and its images optimizable.

---

## 3. Styling: Tailwind v4 (+ restraint)

**Tailwind CSS v4** is the pragmatic modern default: utility classes, no separate JS config file in v4 (config lives in CSS via `@theme`), tiny production output via automatic content detection. Wire it through the `@tailwindcss/vite` plugin and load the **`@tailwindcss/typography`** plugin so Markdown prose looks good with one `prose` class:

```css
/* src/styles/global.css */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  /* design tokens: colors, fonts, spacing */
}
```

Honest caveat: Tailwind is a *preference*, not a requirement. If you'd rather learn modern CSS deeply, plain CSS with custom properties + a few container queries is entirely legitimate and arguably more "fundamental." Pick Tailwind for speed-to-ship; pick vanilla CSS to sharpen fundamentals. Either is a defensible "right" choice — just don't hand-roll a bespoke design system for a personal blog.

---

## 4. Hosting & Deploy: Cloudflare Pages (primary)

| | GitHub Pages | **Cloudflare Pages** | Vercel |
|---|---|---|---|
| Cost (this use) | Free | **Free** | Free (hobby) |
| Per-PR preview deploys | ❌ (DIY) | ✅ **Built-in** | ✅ Built-in |
| Edge/global CDN | ✅ | ✅ | ✅ |
| Privacy analytics included | ❌ | ✅ **Free** | 🟡 (paid tiers) |
| Edge functions later | ❌ | ✅ Workers | ✅ |
| GitHub-native feel | ✅ Best | 🟡 | 🟡 |

**Recommendation: Cloudflare Pages**, because **preview deployments per pull request** are the single biggest "doing it right" upgrade — you see your post rendered on a real URL before it goes live — and you get privacy analytics, native `_redirects` support (which matters for §0 migration), and a path to edge functions, all free.

**This does *not* undercut the "stay current with GitHub" goal:** your repo, PRs, Issues, Discussions (for giscus), Dependabot, and CI Actions all still live on GitHub — Cloudflare only builds and serves the static output. Decide by priority:
- Choose **Cloudflare Pages** if PR previews, URL redirects, and built-in analytics matter (recommended, especially given the migration in §0).
- Choose **GitHub Pages** if minimizing vendors and learning GitHub-native deployment is the priority — it's a perfectly good free option; you just lose automatic PR previews and easy arbitrary redirects.

Keep your custom domain on whichever you choose.

---

## 5. CI/CD: GitHub Actions as a Quality Gate

Run on every PR — this is where the repo becomes a *learning surface*. This assumes `package.json` defines the scripts below and the dev deps (`@astrojs/check`, `typescript`, `vitest`) from §8 are installed:

```yaml
# .github/workflows/ci.yml
name: CI
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint               # eslint + prettier --check
      - run: pnpm run typecheck          # astro check
      - run: pnpm run build              # fails on broken content schema
      - run: pnpm run --if-present test  # vitest; skips cleanly if absent
```

```json
// package.json scripts
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "astro check",
    "lint": "eslint . && prettier --check .",
    "test": "vitest run"
  }
}
```

Add **Lighthouse CI** and a **link checker** (e.g. `lychee`, which can also assert your §0 legacy URLs still resolve) as separate, *non-blocking-at-first* jobs so you learn performance/a11y budgets without being nagged into paralysis. Deployment itself is handled by Cloudflare Pages' Git integration (or an `actions/deploy-pages` job if you choose GitHub Pages).

**Proportionality note:** for a solo blog you do *not* need branch protection requiring reviews, CODEOWNERS, or a release-please pipeline. A simple `main` + "CI must be green" ruleset is plenty. Conventional Commits are a nice habit to learn but optional.

---

## 6. The Supporting Cast (decided, briefly)

- **Comments → giscus.** GitHub Discussions-backed, free, no ads/tracking, you already live in GitHub. (utterances is the lighter Issues-based alternative.)
- **Analytics → Cloudflare Web Analytics.** Privacy-first, no cookie banner needed, free. GA4 only if you specifically need its funnels — for a blog you don't.
- **Lint/format → ESLint + Prettier** with `eslint-plugin-astro` and `prettier-plugin-astro` — the most conservative, best-supported choice for `.astro` today. *Not Biome:* Biome now technically supports `.astro`, but its Astro/Vue/Svelte support is still marked **experimental**, so stick with ESLint + Prettier unless you specifically want to experiment with the newest JS tooling.
- **Dependencies → Dependabot** (native, zero-setup security + version PRs). Upgrade to **Renovate** only if you want grouped/scheduled PRs and auto-merge of safe patches.
- **Images → Astro `<Image>` / `<Picture>`** (built on sharp) for automatic resizing, modern formats (AVIF/WebP), and lazy loading.
- **SEO → `@astrojs/sitemap` + `@astrojs/rss`**, plus an OpenGraph/Twitter-card component and JSON-LD `BlogPosting` structured data in your post layout. Canonical URLs from a single `site:` config value.
- **Dev environment → `.devcontainer/devcontainer.json`** (Node LTS image + pnpm) so Codespaces or local Docker spins up identically. Pin Node with `.nvmrc` and `"engines"` in `package.json`.
- **Accessibility → `eslint-plugin-jsx-a11y`/`astro` a11y rules + manual keyboard/contrast checks.** Ship dark mode via `prefers-color-scheme` + a toggle.

---

## 7. Repository Layout

```
praveer-blog/
├── .devcontainer/devcontainer.json
├── .github/
│   ├── workflows/ci.yml
│   └── dependabot.yml
├── .nvmrc
├── astro.config.mjs
├── package.json            # "engines": { "node": ">=22" }, "packageManager": "pnpm@..."
├── tsconfig.json
├── src/
│   ├── content.config.ts   # Zod schemas
│   ├── content/blog/        # one folder per post (md/mdx + images)
│   ├── components/          # Header, PostCard, Comments(giscus), SEO
│   ├── layouts/             # BaseLayout, PostLayout
│   ├── pages/               # index, blog/[...slug], tags/[tag], rss.xml.ts, 404
│   │                        #   (Strategy B instead uses a root [...slug].astro)
│   └── styles/global.css    # Tailwind entry + tokens
├── scripts/gen-redirects.mjs # Strategy A: emit _redirects from redirectFrom
└── public/                  # favicons, robots.txt, _redirects (generated), CNAME
```

---

## 8. Day-One Setup (the happy path)

```bash
pnpm create astro@latest praveer-blog -- --template blog --typescript strict
cd praveer-blog
pnpm add -D @astrojs/sitemap @astrojs/rss @tailwindcss/vite tailwindcss \
            @tailwindcss/typography @astrojs/check typescript vitest \
            eslint prettier eslint-plugin-astro prettier-plugin-astro
# wire Tailwind v4 via the Vite plugin, add the package.json scripts from §5,
# add the giscus component, and set `site:` in astro.config
echo "22" > .nvmrc
git init && git add -A && git commit -m "chore: scaffold Astro blog"
# push to GitHub → connect repo in Cloudflare Pages → done (previews on every PR)
```

Then: write `src/content/blog/hello-again.md`, open a PR, watch the preview deploy build, merge, publish. That loop *is* the modern workflow.

### Sequencing (don't do it all at once)

Ship the essentials first; layer polish only after you've published a few posts — so the "learn the tooling" goal never blocks the "actually write" goal.

**Phase 1 — must-have to launch:** Astro scaffold · content collections + schema · **§0 migration (old URLs + RSS continuity)** · sitemap · canonical URLs · basic CI (build + typecheck) · deploy.

**Phase 2 — after the first 3–5 new posts:** giscus comments · Cloudflare Web Analytics · Lighthouse CI + link-check jobs · dev container · dark-mode toggle · Dependabot.

---

## 9. What This Deliberately Avoids (anti-over-engineering)

- ❌ A headless CMS (Contentful/Sanity) — your content is Markdown in Git; that *is* the CMS, and it's better.
- ❌ A database, auth, or serverless backend — a blog needs none. Add a single edge function later only if you build a contact form or newsletter.
- ❌ Monorepo tooling (Turborepo/Nx), Docker-for-prod, Kubernetes — irrelevant at this scale.
- ❌ Heavy test suites — validate content schemas and a couple of utilities; don't unit-test a static site to death.
- ❌ React-everything — Astro ships zero JS by default; reach for an island only when a component is genuinely interactive.

The skill being demonstrated here is **judgment**: using modern tools where they add value and *consciously declining* the rest.

---

## 10. If You Want a Second "Learning" Track

Keep the blog lean (above), and satisfy the "build modern apps" itch with a **separate** small project where heavier tools are actually justified — e.g. a tiny full-stack app on **SvelteKit or Next.js** with a **Cloudflare Workers/D1** or **Vercel + Postgres** backend, deployed with preview environments. That's the honest way to learn app architecture without bloating a blog that should stay simple.

---

## Decisions Resolved (after rubber-duck consensus)

These were the genuine judgment calls; here's where they landed and why:

1. **Astro vs. Eleventy as the headline pick** — **Astro wins.** It's not over-spec'd: it's a first-class static blog generator *and* the only option that teaches transferable modern-app skills (TS, Vite, islands). Eleventy stays the runner-up for pure minimalism.
2. **Cloudflare Pages vs. GitHub Pages** — **Cloudflare Pages**, and it does *not* undercut the GitHub goal: repo, PRs, Discussions, Dependabot, and CI all stay on GitHub; Cloudflare only builds/serves. Its native `_redirects` also directly serves the §0 migration. GitHub Pages remains a clean fallback if you prefer a single vendor.
3. **Tailwind vs. vanilla CSS** — a true preference, not a correctness issue. Tailwind for speed-to-ship; vanilla CSS to drill fundamentals. Both defensible; just don't build a bespoke design system.
4. **Is this too much ceremony?** — guarded against via the §8 two-phase sequencing and the §9 "deliberately avoids" list. Phase 1 is genuinely small; everything heavier is opt-in after you're publishing.

The single non-negotiable that's easy to skip: **§0 migration / URL + RSS continuity.** Do that first, or you'll quietly throw away a decade of inbound links and SEO — and right now the most urgent piece is **§0a: reclaim `praveergupta.in` before Medium drops the custom domain**, since that's where your most popular links live.

---

## Footnotes

[^m1]: Medium custom domains now require a paid Membership; on the free plan the custom domain stops resolving to Medium content with no redirect — [Medium Help: Setting up a custom domain](https://help.medium.com/hc/en-us/articles/115003053487-Setting-up-a-custom-domain-for-your-profile-or-publication); see also discussion at https://shubhamdavey.com/medium-custom-domain/
[^m2]: Enumerating old Medium URLs — the authoritative source is the Medium *Download your information* export (`https://medium.com/me/export`, ZIP contains an `index.html` listing *every* story). The per-user RSS feed `https://medium.com/feed/@<handle>` only returns roughly the 10 most recent posts (and its `<link>` values include `?source=rss-...` query strings that must be stripped), so treat RSS as a recent-post supplement, not a complete inventory. Harvest before the custom domain is disconnected.
[^m3]: Cloudflare Pages `_redirects` uses Netlify-style syntax with splat/placeholder wildcards (`*` / `:splat`) and supports `301`/`302`/`303`/`307`/`308` (it is not for `404` rewrites). The free-tier limit is **2,000 static + 100 dynamic redirects** (2,100 total); rules containing a splat or `:placeholder` count toward the dynamic quota, and the splat is only valid at the end of the source path. Bulk Redirects / Redirect Rules are the zone-level alternative for larger or regex-based maps — https://developers.cloudflare.com/pages/configuration/redirects/

