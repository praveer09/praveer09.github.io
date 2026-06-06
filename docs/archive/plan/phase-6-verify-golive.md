# Phase 6 — Verify & go live

> **Goal:** prove that **every** captured URL resolves or redirects correctly, the feed and
> SEO essentials are right, the Medium copies point back to you — then remove the old Jekyll
> files and call the migration done.

Reasoning: `../research/greenfield-blueprint.md` §0 (verify in CI, RSS continuity), §0a (Medium
canonical / unpublish), §6 (SEO).

---

## 6.1 — Full URL-coverage check (the big one)

Verify the live site against **the entire inventory**, not just spot samples.

> 🤖 **Prompt:** "Write `scripts/verify-redirects.mjs` (Node, ESM) that reads **every** row of
> `migration/url-inventory.csv`, requests each `old_path` on its `old_host`
> (`https://praveergupta.in...` for praveergupta.in rows, `https://praveer09.github.io...` for
> github.io rows), follows redirects, and asserts each lands on that row's expected
> `https://praveergupta.in<new_path>` (covers posts, the feed, about, sitemap, tags — not just
> posts). Print a table of PASS/FAIL with final status code and resolved URL, and exit non-zero
> if any FAIL. Note: github.io rows resolve via a meta-refresh stub, so also accept a `200`
> whose HTML `<link rel=canonical>` points at the right `new_path`."

Fix any FAILs (usually a missing `redirectFrom` entry or a slug typo), rebuild, re-run until
**100% PASS**.

---

## 6.2 — Feed, sitemap, robots, canonical

> 🤖 **Prompt:** "Verify the SEO/feed essentials on `https://praveergupta.in`: (1) `/rss.xml`
> is valid RSS and lists all non-draft posts with `/blog/<slug>/` links; (2) `/sitemap-index.xml`
> (from `@astrojs/sitemap`) exists and lists the posts; (3) `robots.txt` references the
> sitemap; (4) each post page has a self-referential `<link rel=canonical>` to its
> `praveergupta.in/blog/<slug>/` URL and OpenGraph/JSON-LD tags. Report anything missing."

- **Feed continuity:** old subscribers used `praveer09.github.io/feed.xml`; that path now 301s
  (Cloudflare) / stubs (github.io) to `/rss.xml`. Accept that GUIDs change once — unavoidable
  when the canonical domain changes.

---

## 6.3 — Tell search engines & reclaim Medium authority

1. **Google Search Console / Bing Webmaster:** add `praveergupta.in` as a property, submit the
   new sitemap. If you previously verified `praveer09.github.io`, use the **Change of Address**
   tool there to signal the move.
2. **On Medium (the copies you can't 301):** for each story set its **canonical / "original
   source"** URL to the matching `praveergupta.in/blog/<slug>/` where Medium allows it. If a
   copy can't be canonicalised, either keep it as a mirror that links back or **unpublish it**
   now that the new site is live — to avoid duplicate-content dilution.

> 🤖 **Prompt:** "From `migration/url-inventory.csv`, generate a checklist mapping each Medium
> story (old `praveergupta.in/<slug>-<hex>`) to its new `praveergupta.in/blog/<slug>/` URL, so
> I can set the canonical/original-source on each Medium post and tick them off."

---

## 6.4 — Remove the old Jekyll files

Only now that everything is verified, delete the quarantined legacy site.

> 🤖 **Prompt:** "Confirm nothing in `src/` or `scripts/` still references `_legacy-jekyll/`
> (search imports, image paths, and the build). If clean, `git rm -r _legacy-jekyll` and any
> leftover Jekyll-only files (`Gemfile*`, `Dockerfile`, `_config.yml`, `feed.xml`,
> `tags.html`) that aren't already moved. Keep `docs/`, `migration/`, favicons, and
> `LICENSE`. Then run `pnpm run build` to confirm the site still builds."

> Keep `migration/` (inventory, DNS backup, raw sources) — it's your audit trail.

---

## 6.5 — Promote to production & announce

1. Merge the migration branch into your production branch (Phase 4.3) so the `*.pages.dev`
   production build and `praveergupta.in` serve the final site.
2. Sanity-check the live domain one more time (home, a post, feed, an old link).
3. Optionally write a short "the blog has moved / is back" post — your first new entry.

---

## Definition of Done

- [ ] `scripts/verify-redirects.mjs` reports **100% PASS** across the full inventory on the
      live domain.
- [ ] `/rss.xml`, sitemap, `robots.txt`, and per-post canonical/OG/JSON-LD all verified.
- [ ] Search Console/Bing property added, sitemap submitted, Change-of-Address done (if
      applicable).
- [ ] Medium copies canonicalised to the new URLs (or unpublished); checklist complete.
- [ ] `_legacy-jekyll/` and stray Jekyll files removed; `pnpm run build` still green.
- [ ] Production branch updated; `https://praveergupta.in` is the live canonical site.

➡️ Next: [Phase 7 — Post-launch polish](./phase-7-post-launch.md)
