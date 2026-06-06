# Phase 7 — Post-launch polish (the "keep learning" layer)

> **Goal:** now that you're live and the migration is safe, *gradually* add the modern tooling
> that makes the repo a learning surface and the blog nicer — **without** letting any of it
> block you from writing. Do these one at a time, ideally each as its own PR (so you also
> practise the PR-preview workflow).

Reasoning: `../research/greenfield-blueprint.md` §5 (CI quality gate), §6 (supporting cast),
§8 (two-phase sequencing — this is "Phase 2: after the first 3–5 posts"), §9 (what to avoid).

> **Sequencing rule:** publish a post or two on the new site *first*. Only then start pulling
> items off this list. None of it is required to be live.

---

## 7.1 — Write the first new post (do this before any tooling)

> 🤖 **Prompt:** "Scaffold a new post at `src/content/blog/<slug>/index.md` with valid
> frontmatter (title, description, pubDate=today, tags, draft:false) and an empty body for me
> to write into. Open it so I can start writing."

The loop — write → open PR → review the preview deploy → merge → live — *is* the modern
workflow. Get comfortable with it before adding gates.

---

## 7.2 — CI quality gate (GitHub Actions)

Add `.github/workflows/ci.yml` running on every PR: install, lint, typecheck, build (the build
also re-validates the content schema and regenerates redirects).

> 🤖 **Prompt:** "Add `.github/workflows/ci.yml` per the blueprint §5: on `pull_request` and
> push to the production branch, set up pnpm + Node from `.nvmrc`, `pnpm install
> --frozen-lockfile`, then run `lint`, `typecheck`, and `build`. Keep it a single `verify`
> job. Don't add branch protection yet."

---

## 7.3 — Redirect/link safety net in CI

Guard against future content edits silently breaking an old URL.

> 🤖 **Prompt:** "Add a non-blocking CI job that runs `scripts/verify-redirects.mjs` (Phase 6)
> against the latest Cloudflare preview deploy, plus a link checker (e.g. `lychee`) over the
> built site. Start them as `continue-on-error: true` so they inform but don't block, per the
> blueprint's proportionality note."

---

## 7.4 — Comments: giscus

> 🤖 **Prompt:** "Enable GitHub Discussions on this repo, set up **giscus**, and add a
> `Comments.astro` island to the post layout (lazy-loaded, mapped by pathname). Use the
> repo's Discussions category. No tracking, no other config."

(Replaces the dead Disqus `praveer09` from the old site.)

---

## 7.5 — Analytics: Cloudflare Web Analytics

> 🤖 **Prompt:** "Enable **Cloudflare Web Analytics** for `praveergupta.in` and add its
> snippet to the base layout. Confirm it's cookieless (no banner needed)."

(Replaces the dead `UA-52054839-1` Google Analytics from the old site.)

---

## 7.6 — Dependency hygiene: Dependabot

> 🤖 **Prompt:** "Add `.github/dependabot.yml` for the npm ecosystem (weekly), grouping minor
> + patch updates. Briefly note when I'd switch to Renovate instead."

---

## 7.7 — Dev environment & dark mode (nice-to-haves)

> 🤖 **Prompt:** "Add a `.devcontainer/devcontainer.json` (Node LTS + pnpm) so Codespaces/local
> Docker spin up identically. Separately, add a `prefers-color-scheme` dark mode with a manual
> toggle that persists in `localStorage`."

---

## 7.8 — Performance & a11y budgets (optional, last)

> 🤖 **Prompt:** "Add **Lighthouse CI** as a non-blocking GitHub Actions job against the
> preview URL, reporting performance/SEO/a11y scores. Don't enforce thresholds yet — just
> surface the numbers so I can learn the budgets."

---

## What to deliberately NOT add

From the blueprint §9 — resist these for a personal blog: a headless CMS, a database/auth/
backend, monorepo tooling, Docker-for-prod, heavy unit-test suites, or React-everything. The
skill being practised is **judgment**: modern tools where they add value, consciously skipping
the rest. If you want to learn heavier app architecture, do it in a **separate** project
(blueprint §10), not here.

---

## Definition of Done (this is an ongoing list — tick as you go)

- [ ] First new post published via the PR-preview-merge loop.
- [ ] CI verify job (lint/typecheck/build) green on PRs.
- [ ] Redirect/link safety-net job running (non-blocking).
- [ ] giscus comments live; Cloudflare analytics live.
- [ ] Dependabot opening update PRs.
- [ ] (Optional) dev container, dark mode, Lighthouse CI added.

🎉 That's the whole journey: dormant Jekyll blog → modern Astro site on Cloudflare, every old
URL preserved, `praveergupta.in` as your single canonical home, and a repo that keeps you
current with GitHub. Now go write.
