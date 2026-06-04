# Phase 1 — Scaffold the Astro site

> **Goal:** a modern **Astro + TypeScript + Tailwind v4** project that builds and serves
> locally, living in this repo — with the old Jekyll files *quarantined* (moved aside, not
> deleted) so they remain available as migration sources until Phase 6.

Reasoning: `../research/greenfield-blueprint.md` §1 (why Astro), §3 (Tailwind v4), §8 (day-one setup).

---

## 1.1 — Prerequisites

Install once, then pin for reproducibility:

```powershell
# Node LTS (v22+). If you use nvm-windows: nvm install lts; nvm use lts
node -v        # expect v22.x or newer
corepack enable          # lets you use pnpm without a global install
pnpm -v        # expect 9.x+
```

> Astro 5 requires **Node 22.12+** (not just any 22.x) — if `node -v` shows an older 22, update
> before scaffolding or the install/build will complain.

> 🤖 **Prompt:** "Confirm Node is v22.12 or newer and pnpm is available via corepack on this
> Windows machine. If pnpm isn't found, enable it with `corepack enable` and verify."

---

## 1.2 — Quarantine the old Jekyll site (don't delete yet)

You'll keep `_posts/` and the old config around as migration sources. Move everything
Jekyll-specific into a temporary holding folder on a new branch:

```powershell
git switch -c phase-1-scaffold
New-Item -ItemType Directory -Force -Path _legacy-jekyll | Out-Null
# move Jekyll build inputs aside (keep docs/ and .git untouched)
foreach ($p in '_config.yml','_data','_includes','_layouts','_posts','css','js','img','feed.xml','index.html','tags.html','about-me.md','404.html','Gemfile','Gemfile.lock','Dockerfile','_site') {
  if (Test-Path $p) { git mv $p "_legacy-jekyll/$p" }
}
```

> Keep `_legacy-jekyll/_posts/` — Phase 2 reads from it. Keep `_legacy-jekyll/img/posts/`
> too (post images). You'll delete `_legacy-jekyll/` entirely in Phase 6.

> ⚠️ **Note on `github.io` going dark:** once these Jekyll files move and the new build
> replaces them, GitHub Pages will serve the *new* Astro output (or nothing until Phase 4).
> You already accepted brief `praveer09.github.io` downtime — this is where it starts.

---

## 1.3 — Create the Astro project in-place

Scaffold into a temp dir, then move the files into the repo root (so the project lives at the
repo root, not a subfolder):

```powershell
pnpm create astro@latest ..\_astro-tmp -- --template blog --typescript strict --no-git --install
# review the scaffold first, then move files in WITHOUT overwriting anything that already exists
$protect = @('.git','docs','_legacy-jekyll','migration','LICENSE','.gitattributes')
Get-ChildItem ..\_astro-tmp -Force | ForEach-Object {
  if ($protect -contains $_.Name -or (Test-Path $_.Name)) {
    Write-Warning "SKIP (already exists or protected): $($_.Name)"   # review these by hand
  } else {
    Move-Item $_.FullName . -Force
  }
}
Remove-Item ..\_astro-tmp -Recurse -Force
```

> The guard above uses `-Force` so **dotfiles** (`.gitignore`, `.vscode`, etc.) are moved too,
> and it **refuses to clobber** anything already in the repo — any skipped item (e.g. a scaffold
> `README.md` vs. your own, or `.gitignore`) is flagged for you to merge by hand.

> 🤖 **Prompt:** "Scaffold a new Astro 5 blog (`--template blog --typescript strict`) into a
> temp folder, then move its contents (including dotfiles) into this repo root **without
> overwriting** anything that already exists, and never touching `docs/`, `_legacy-jekyll/`,
> `migration/`, `.git`, `.gitattributes`, or `LICENSE`. For any file that collides (e.g.
> `.gitignore`, `README.md`), show me both versions and help me merge them. Show the resulting
> tree before committing."

---

## 1.4 — Add Tailwind v4 + the core integrations

```powershell
pnpm add -D @astrojs/sitemap @astrojs/rss @tailwindcss/vite tailwindcss `
            @tailwindcss/typography @astrojs/check typescript `
            eslint prettier eslint-plugin-astro prettier-plugin-astro
```

> 🤖 **Prompt:** "Wire Tailwind v4 into this Astro project via the `@tailwindcss/vite`
> plugin in `astro.config.mjs`, create `src/styles/global.css` importing `tailwindcss` and
> the `@tailwindcss/typography` plugin (`@plugin`), and apply `prose` to the post layout.
> Add `@astrojs/sitemap` to the integrations. Set `site: 'https://praveergupta.in'` in
> `astro.config.mjs`. Then run `pnpm build` and fix any errors."

Pin the runtime and add scripts (`../research/greenfield-blueprint.md` §5):

```powershell
"22" | Out-File -Encoding ascii .nvmrc
```

> 🤖 **Prompt:** "Add these scripts to `package.json`: `dev`, `build`, `preview`,
> `typecheck` (`astro check`), `lint` (`eslint . && prettier --check .`). Add
> `\"engines\": { \"node\": \">=22\" }` and a `packageManager` field for pnpm. Create minimal
> `eslint` + `prettier` configs using the Astro plugins."

---

## 1.5 — Verify it builds and runs

```powershell
pnpm install
pnpm run build      # must succeed
pnpm run dev        # open http://localhost:4321 and eyeball the starter blog
```

---

## Definition of Done

- [ ] On branch `phase-1-scaffold`; old Jekyll files moved under `_legacy-jekyll/` (still present).
- [ ] Astro project lives at the repo root; `pnpm install && pnpm run build` succeeds.
- [ ] Tailwind v4 + typography render in `pnpm run dev`.
- [ ] `astro.config.mjs` has `site: 'https://praveergupta.in'` and the sitemap integration.
- [ ] `.nvmrc`, `engines`, and `package.json` scripts are in place; `pnpm run lint` and
      `pnpm run typecheck` run (warnings OK for now).
- [ ] Committed and pushed; optionally open a PR (previews come online in Phase 4).

➡️ Next: [Phase 2 — Migrate the content](./phase-2-migrate-content.md)
