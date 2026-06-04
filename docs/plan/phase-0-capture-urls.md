# Phase 0 — Capture all existing URLs

> **Goal:** produce one checked-in file, `migration/url-inventory.csv`, that lists **every**
> URL your blog has ever been reachable at — from both `praveer09.github.io` and the
> Medium-mapped `praveergupta.in` — mapped to the slug it should live at on the new site.
> This is the master list every redirect is generated from. **Do this first and do it
> completely** — some sources stop being available after the Medium cutover.

Why this matters: 301-redirects are only possible for URLs you *know about*. A missed URL =
a dead link and lost SEO that you can't recover later. (See `../research/greenfield-blueprint.md`
§0 and §0a.)

---

## 0.1 — Harvest the `praveer09.github.io` URLs (authoritative: the sitemap)

The old Jekyll site uses `permalink: pretty` **with `categories: technology`**, so the live
URLs are *not* simply `/YYYY/MM/DD/slug/` — they include the category, e.g.
`/technology/2018/11/24/practical-guide-to-java-stream-api/`. Don't hand-derive these — the
site has `jekyll-sitemap` enabled, so harvest the authoritative list while the site is still up:

```powershell
# from the repo root
New-Item -ItemType Directory -Force -Path migration | Out-Null
curl.exe -sSL https://praveer09.github.io/sitemap.xml -o migration/raw-github-sitemap.xml
```

> 🤖 **Prompt:** "Parse `migration/raw-github-sitemap.xml` and extract **every** `<loc>` URL —
> do not drop any. For each, write a row to `migration/url-inventory.csv` and **classify** it
> in a `kind` column: `post` (paths matching `/<category>/YYYY/MM/DD/<slug>/`), `home` (`/`),
> `about` (`/about-me/`), `tags` (`/tags/` and any per-tag pages), `feed` (`/feed.xml`),
> `sitemap` (`/sitemap.xml`), or `other`. For `post` rows, also output the trailing `<slug>`.
> The goal is **zero** sitemap URLs left out of the inventory."

Decide a destination for **every** non-post URL too (don't leave any unclassified) — the #1
goal is to miss nothing:
- `/feed.xml`    → `/rss.xml`
- `/about-me/`   → `/about/`
- `/`            → `/` (new home)
- `/tags/` + per-tag pages → new tag pages (`/tags/<tag>/`) or, if you drop tag pages, redirect
  to `/` — but make the choice explicit, don't silently omit them
- `/sitemap.xml` → keep working (the new `@astrojs/sitemap` emits `/sitemap-index.xml`; add a
  redirect `/sitemap.xml` → `/sitemap-index.xml` so the old path still resolves)

> ⚠️ If `sitemap.xml` is missing or incomplete, fall back to deriving URLs from `_posts/`:
> each file is `YYYY-MM-DD-<slug>.md[arkdown]` and its frontmatter has `categories:`. The URL
> is `/<categories>/YYYY/MM/DD/<slug>/`. Cross-check a few against the live site in a browser.

---

## 0.2 — Harvest the Medium / `praveergupta.in` URLs (do this NOW — time-sensitive)

These are your **most popular links** and they **stop resolving once Medium drops free
custom-domain support**. The Medium *export* is the complete source; the RSS feed only
returns ~10 recent posts, so don't rely on it.

1. Go to **Medium → Settings → Download your information** and request the export.
2. When the ZIP arrives, open `index.html` (or the `posts/` folder) — it lists **every**
   story and its canonical URL.
3. For each story, record the `praveergupta.in` URL. Medium post URLs look like
   `https://praveergupta.in/<human-slug>-<12-char-hex-id>` (the 12-hex id is the stable
   part). Also note any `/p/<id>` short links if you have them.
4. **Also capture the Medium feed path** `praveergupta.in/feed` (Medium serves your RSS there
   while the custom domain is live) — add it as a `feed` row mapping to `/rss.xml`, so old
   feed subscribers/crawlers on that URL are redirected too.

> 🤖 **Prompt:** "I've saved my Medium export to `migration/medium-export/`. Read its
> `index.html`, extract every story's title and full URL, **strip query strings and
> fragments** (Medium adds `?source=...`), and keep only the path. Match each Medium story
> to the corresponding post in `_posts/` by title similarity, and add the Medium path(s) as
> `kind=post` rows for that post in `migration/url-inventory.csv`. Also add a `feed` row
> `feed,praveergupta.in,/feed,,/rss.xml,medium,`. Flag any story you can't confidently match
> so I can map it by hand."

> ⚠️ The Medium-hosted copies at `medium.com/@<handle>/...` and `<handle>.medium.com/...`
> are **not** on a domain you control — you can't 301 those. They're handled separately in
> Phase 6 (set their canonical/original-source to the new URL, or unpublish).

---

## 0.3 — Decide the new slug for each post

The new canonical URL is `https://praveergupta.in/blog/<slug>/`. Default the `<slug>` to the
existing Jekyll slug (the part after the date in the `_posts` filename) — it's already clean,
descriptive, and keeps the URLs recognisable. Example:

| Old github.io URL | Old Medium URL | New URL |
|---|---|---|
| `/technology/2018/11/24/practical-guide-to-java-stream-api/` | `/practical-guide-to-java-stream-api-7aadc02908f7` | `/blog/practical-guide-to-java-stream-api/` |

Keep the slug identical to the Jekyll one wherever possible — fewer surprises.

---

## 0.4 — The inventory file format

Aim for one row per **old URL** (a post can have several old URLs → several rows). Include a
`kind` column so non-post URLs are tracked and classified, never silently dropped:

```csv
kind,old_host,old_path,new_slug,new_path,source,notes
post,praveer09.github.io,/technology/2018/11/24/practical-guide-to-java-stream-api/,practical-guide-to-java-stream-api,/blog/practical-guide-to-java-stream-api/,jekyll-sitemap,
post,praveergupta.in,/practical-guide-to-java-stream-api-7aadc02908f7,practical-guide-to-java-stream-api,/blog/practical-guide-to-java-stream-api/,medium-export,
post,praveergupta.in,/p/7aadc02908f7,practical-guide-to-java-stream-api,/blog/practical-guide-to-java-stream-api/,medium-shortlink,if it has traffic
feed,praveer09.github.io,/feed.xml,,/rss.xml,jekyll,
feed,praveergupta.in,/feed,,/rss.xml,medium,Medium-served feed on the custom domain
about,praveer09.github.io,/about-me/,,/about/,jekyll-sitemap,
home,praveer09.github.io,/,,/,jekyll-sitemap,
sitemap,praveer09.github.io,/sitemap.xml,,/sitemap-index.xml,jekyll-sitemap,
tags,praveer09.github.io,/tags/,,/tags/,jekyll-sitemap,decide: keep or redirect to /
```

This CSV is **the single source of truth**. In Phase 2 you'll fold each `post` row's old paths
into that post's `redirectFrom` frontmatter; in Phase 3 the build scripts read the CSV + the
posts to emit every redirect artifact. Every non-`post` row needs a `new_path`. Commit the CSV
(and the raw sitemap + a copy of the Medium export's `index.html`) so the migration is
reproducible.

---

## Definition of Done

- [ ] `migration/url-inventory.csv` exists and is committed.
- [ ] **Every** `<loc>` from `sitemap.xml` is in the inventory with a `kind` and a `new_path` —
      **zero unclassified URLs** (this is what guarantees "miss nothing").
- [ ] Every one of the 20 posts has at least its **github.io** URL captured.
- [ ] Every post that exists on Medium has its **`praveergupta.in`** URL captured (from the
      export, query-strings stripped).
- [ ] `/feed.xml` (github.io), **`/feed` (Medium/praveergupta.in)**, `/about-me/`, `/`,
      `/sitemap.xml`, and `/tags/` each have an explicit destination decision recorded.
- [ ] Each `post` row has a `new_slug`, and slugs are unique per post.
- [ ] Raw sources (`raw-github-sitemap.xml`, Medium export `index.html`) are committed under
      `migration/` for reproducibility.

➡️ Next: [Phase 1 — Scaffold the Astro site](./phase-1-scaffold-astro.md)
