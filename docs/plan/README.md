# Migration & rebuild plan — Praveer's Musings

This folder is your **executable, step-by-step plan** to rebuild this blog the modern way
and migrate every existing URL without losing traffic. It is split into phases so you can
do one sitting at a time, driving most of the work through the **GitHub Copilot CLI**.

The reasoning behind every choice lives in [`../research/`](../research/). This folder is
the *do-it-now* layer.

---

## The goal in one paragraph

Replace the dormant Jekyll site with a modern **Astro** site, deploy it on **Cloudflare
Pages**, and make **`praveergupta.in`** the single canonical home for all your writing.
Capture **every** old URL — from both `praveer09.github.io` *and* your Medium-mapped
`praveergupta.in` links — and **301-redirect them** to their new homes so a decade of SEO
and inbound links carries over. You are OK with `praveer09.github.io` being down briefly
during the switch.

---

## Phases (do them in order)

| # | Phase | Outcome | Est. effort |
|---|---|---|---|
| 0 | [Capture all existing URLs](./phase-0-capture-urls.md) | A checked-in `migration/url-inventory.csv` listing every old URL → intended new slug. **The single most important phase.** | 1–2 hrs |
| 1 | [Scaffold the Astro site](./phase-1-scaffold-astro.md) | A working Astro + TS + Tailwind project building locally, old Jekyll files quarantined (not yet deleted). | 1–2 hrs |
| 2 | [Migrate the content](./phase-2-migrate-content.md) | All 20 posts converted to Content Collections with validated frontmatter + `redirectFrom`. | 3–5 hrs |
| 3 | [Wire up redirects](./phase-3-redirects.md) | Build scripts that emit `_redirects` (Cloudflare 301s) **and** static redirect stubs for `github.io` deep links, from the inventory. | 1–2 hrs |
| 4 | [Cloudflare account & publishing](./phase-4-cloudflare-publish.md) | Cloudflare account + Pages project connected to the repo, building on every push, preview deploys on PRs, live on a `*.pages.dev` URL. | 1 hr |
| 5 | [DNS cutover for praveergupta.in](./phase-5-dns-cutover.md) | `praveergupta.in` repointed from Medium to Cloudflare Pages, SSL issued, redirects live. | 1 hr + DNS wait |
| 6 | [Verify & go live](./phase-6-verify-golive.md) | Every inventory URL verified to resolve/redirect; RSS, sitemap, canonical tags correct; old Jekyll files removed. | 1–2 hrs |
| 7 | [Post-launch polish](./phase-7-post-launch.md) | giscus comments, Cloudflare analytics, CI quality gates, Dependabot, dark mode — added *after* you're publishing. | ongoing |

**Phases 0–6 are the migration. Phase 7 is the "keep learning" layer** — deliberately
deferred so it never blocks you from writing.

---

## How to drive this with the GitHub Copilot CLI

Each phase file contains concrete steps, exact commands, and ready-to-paste **Copilot CLI
prompts** (look for the `🤖 Prompt` blocks). A good loop:

1. `cd` into this repo and start `copilot`.
2. Open the phase file you're on and paste the `🤖 Prompt` for the step you want done.
3. Review the diff Copilot proposes, approve, and let it run the commands.
4. Tick the **Definition of Done** checklist at the bottom of each phase before moving on.

> Tip: work on a branch per phase (e.g. `git switch -c phase-1-scaffold`) and open a PR.
> Once Cloudflare Pages is connected (Phase 4), every PR gets its own preview URL.

---

## Guardrails (read once)

- **Phase 0 is non-negotiable and comes first.** If you skip URL capture, no later phase
  can recover the links — especially the Medium-mapped `praveergupta.in` URLs, which stop
  resolving once Medium drops free custom domains. Capture them **now**.
- **One source of truth for redirects:** every post lists its old URLs in a `redirectFrom`
  frontmatter array (Phase 2). Phase 3's scripts generate *all* redirect artifacts from
  that. Never hand-edit `_redirects`.
- **Don't delete the old Jekyll files until Phase 6**, after the new site is verified — you
  need `_posts/` and the live old site/sitemap as migration sources.
- **Proportionality:** this is a personal blog. Phases 0–6 get you live; resist adding
  Phase 7 tooling until you've published a post or two.

---

## Current-state facts this plan is built on

- Repo: `praveer09/praveer09.github.io` (a GitHub **user page** → publishes to
  `https://praveer09.github.io`). Default branch `master`.
- Old stack: Jekyll 3.7.4, vendored Beautiful Jekyll v2, 20 posts in `_posts/`, dormant
  since 2018-11.
- **Old `github.io` URL shape:** `permalink: pretty` + `categories: technology` ⇒ real URLs
  look like `https://praveer09.github.io/technology/2018/11/24/practical-guide-to-java-stream-api/`.
  `jekyll-sitemap` is enabled, so `https://praveer09.github.io/sitemap.xml` is the
  authoritative list to harvest (Phase 0).
- **Old Medium URL shape:** `https://praveergupta.in/<slug>-<12-char-hex-id>` (plus
  `/p/<id>` short links). Harvest via Medium export (Phase 0).
- Old feed: `https://praveer09.github.io/feed.xml` (and `praveergupta.in/feed` via Medium).
- New canonical site: `https://praveergupta.in`, posts at `/blog/<slug>/`, RSS at `/rss.xml`.
