# Phase 2 — Migrate the content

> **Goal:** convert all 20 Jekyll posts in `_legacy-jekyll/_posts/` into Astro **Content
> Collection** entries with a validated Zod schema, clean frontmatter, colocated images, and
> — crucially — each post's **`redirectFrom`** array populated from Phase 0's inventory.

Reasoning: `../research/greenfield-blueprint.md` §2 (content architecture & schema).

---

## 2.1 — Define the content collection schema

Create `src/content.config.ts` matching the blueprint (§2). The migration-critical field is
`redirectFrom: z.array(z.string())` — the list of old paths that should 301 to this post.

> 🤖 **Prompt:** "Create `src/content.config.ts` defining a `blog` collection with the `glob`
> loader (base `./src/content/blog`) and a Zod schema with: `title` (string), `description`
> (string, required), `pubDate` (coerced date), `updatedDate` (optional date), `tags`
> (string array, default []), `draft` (boolean default false), `redirectFrom` (string array
> default []), and an optional `cover` object `{ src: image(), alt: string }`. Import `z`
> from `astro/zod` and `glob` from `astro/loaders`. Use a `generateId` that strips
> `/index.(md|mdx)` and the extension."

---

## 2.2 — Convert each post

The Jekyll frontmatter varies across years (some posts use `subtitle`, `bigimg`,
`categories`, quoted vs unquoted titles, datetime vs date). Normalise it to the new schema.

**Mapping rules:**

| Jekyll field | New field | Notes |
|---|---|---|
| `title` | `title` | strip surrounding quotes |
| `date` | `pubDate` | normalise to ISO `YYYY-MM-DD` |
| `subtitle` | `description` | if absent, **write a 1-sentence description** (required field) |
| `tags: [..]` | `tags` | keep as array |
| `bigimg` / `image` | `cover.src` | move the image file into the post folder; add real `alt` |
| `categories` | — | drop (only needed to reconstruct old URLs, done in Phase 0) |
| `comments`, `layout`, `published`, `social-share` | — | drop (handled by layout/config) |

**Body fixups:** Jekyll/kramdown reference-style links (`[text][ref]` + `[ref]: url`) work in
Markdown as-is. Watch for: Liquid tags (`{% ... %}`) — rare here but must be removed;
`{{ site.url }}` references; and image paths (`/img/posts/...`) which must point at the new
colocated image.

**Folder-per-post layout** (`../research/greenfield-blueprint.md` §2):
```
src/content/blog/practical-guide-to-java-stream-api/
├── index.md          # the post
└── cover.jpg         # moved from _legacy-jekyll/img/posts/...
```

> 🤖 **Prompt (do a few at a time, review, repeat):** "Convert
> `_legacy-jekyll/_posts/2018-11-24-practical-guide-to-java-stream-api.md` into
> `src/content/blog/practical-guide-to-java-stream-api/index.md` using the new schema:
> map `title`/`date`→`pubDate`/`tags`; synthesise a one-line `description` from the intro if
> there's no `subtitle`; move `bigimg` (`_legacy-jekyll/img/posts/...`) into the post folder
> as `cover.jpg` and set `cover.alt`. Preserve the body verbatim except fixing any Liquid
> tags or `/img/` paths. Leave `redirectFrom` empty for now — I'll fill it in step 2.3."

> Tip: convert 3–5 posts, run `pnpm run build` (the schema will catch mistakes), then
> continue. The build failing on a bad date or missing description is the schema doing its job.

---

## 2.3 — Populate `redirectFrom` from the inventory

This is the bridge between Phase 0 and Phase 3. Each post's `redirectFrom` must list **all**
its old paths (the github.io category-dated path, the Medium slug-hex path(s), `/p/<id>`).

> 🤖 **Prompt:** "For each post in `src/content/blog/`, look up its `new_slug` in
> `migration/url-inventory.csv`, collect every `old_path` from rows where `kind = post` for
> that slug, and write them into the post's `redirectFrom` frontmatter array. Then verify:
> **every** `kind = post` row in the CSV is represented in exactly one post's `redirectFrom`.
> List any `post` rows that didn't get matched to a post."

This cross-check guarantees **no captured URL is dropped** before we generate redirects.

---

## 2.4 — Handle the RSS feed and standalone pages

- **RSS:** add `@astrojs/rss` to emit `src/pages/rss.xml.ts` at `/rss.xml`. The old
  `/feed.xml` → `/rss.xml` 301 is handled as the `__rss__` special row in Phase 3.
- **About page:** port `_legacy-jekyll/about-me.md` to `src/pages/about.astro` (or
  `/about/`); if the old path was `/about-me/`, add it to the redirect inventory.

> 🤖 **Prompt:** "Add an `@astrojs/rss` feed at `/rss.xml` that lists all non-draft posts
> (title, description, pubDate, link to `/blog/<slug>/`). Port `_legacy-jekyll/about-me.md`
> to an `/about/` page."

---

## Definition of Done

- [ ] `src/content.config.ts` defines the `blog` collection with `redirectFrom`.
- [ ] All 20 posts converted under `src/content/blog/<slug>/index.md`, images colocated.
- [ ] Every post has a non-empty `description` and valid `pubDate`; `pnpm run build` passes
      (schema validation green).
- [ ] Every post's `redirectFrom` is populated; the 2.3 cross-check reports **zero unmatched**
      inventory rows.
- [ ] `/rss.xml` builds and lists the posts; `/about/` page exists.
- [ ] Committed on the branch.

➡️ Next: [Phase 3 — Wire up redirects](./phase-3-redirects.md)
