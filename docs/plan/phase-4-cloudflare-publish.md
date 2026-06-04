# Phase 4 — Cloudflare account & publishing

> **Goal:** create a Cloudflare account, connect this GitHub repo to **Cloudflare Pages**, and
> get the new Astro site building on every push with **per-PR preview deploys** — live on a
> temporary `*.pages.dev` URL. No custom domain yet (that's Phase 5).

Reasoning: `../research/greenfield-blueprint.md` §4 (why Cloudflare Pages: free, edge, PR
previews, native `_redirects`, privacy analytics).

> Most of this phase is **dashboard/account work that you do in a browser** — Copilot CLI
> can't click through Cloudflare's UI or create your account. The CLI's job here is to get
> the repo build-ready and (optionally) script deploys with Wrangler. Steps you must do
> yourself are marked 🧑‍💻.

---

## 4.1 — 🧑‍💻 Create the Cloudflare account

1. Sign up at <https://dash.cloudflare.com/sign-up> (free plan is enough).
2. Verify your email and enable **2FA** (you're about to put a domain here — protect it).

> Don't add the `praveergupta.in` domain to Cloudflare yet — do that in Phase 5, deliberately,
> after backing up its DNS. For now you only need the account so Pages can build the repo.

---

## 4.2 — Make sure the repo is build-ready for Pages

Cloudflare Pages will run a build command in a clean Linux container, so it must work from a
fresh `pnpm install`.

> 🤖 **Prompt:** "Verify this repo builds cleanly from scratch the way Cloudflare Pages will:
> remove `node_modules` and `dist`, run `pnpm install --frozen-lockfile`, then `pnpm run
> build`, and confirm `dist/` is produced with `public/_redirects` copied to `dist/_redirects`
> and the github.io stub pages present. Report the exact build command, output directory
> (`dist`), and Node version (from `.nvmrc`) I'll need to enter in the Pages dashboard."

Note the three values you'll type into the dashboard:
- **Build command:** `pnpm run build`
- **Build output directory:** `dist`
- **Environment variable:** `NODE_VERSION = 22` (match `.nvmrc`); Pages uses pnpm
  automatically when it sees `pnpm-lock.yaml`.

Make sure `pnpm-lock.yaml` is committed.

> ✅ **CLI-verified (clean-room build):** removed `node_modules` + `dist`, ran
> `pnpm install --frozen-lockfile` (17.9s, exit 0) then `pnpm run build` (exit 0). Produced
> `dist/` with `dist/_redirects` (42 redirects), 22 github.io stub pages, and 32 rendered pages
> (54 HTML files total); postbuild `verify-redirects` passed. **Dashboard values to enter:**
> - **Build command:** `pnpm run build`  (runs prebuild gen + postbuild verify automatically)
> - **Build output directory:** `dist`
> - **Environment variable:** `NODE_VERSION = 22`
> Run `pwsh scripts/test-redirects.ps1 -BaseUrl https://<project>.pages.dev` after the first
> deploy to validate the redirect checklist (4.4).

---

## 4.3 — 🧑‍💻 Connect the repo in Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Authorise GitHub and pick `praveer09/praveer09.github.io`.
3. Set **Production branch** to the branch you'll promote to (see note below), build command
   `pnpm run build`, output `dist`, and add `NODE_VERSION=22`.
4. Save & Deploy. Watch the first build; when green you get a live `https://<project>.pages.dev`.

> **Branch choice:** Pages treats your *production branch* as live and every *other* branch /
> PR as a **preview**. Two clean options:
> - Keep `master` as production and merge your migration branch into it when ready (the
>   github.io repo's default is `master`).
> - Or rename the default branch to `main` first (modern default) and use that.
> Pick one and be consistent. Either way, open your phase branches as PRs to get preview URLs.

---

## 4.4 — Verify previews and redirects on `*.pages.dev`

Before touching DNS, prove the whole redirect machine works on the temporary Pages URL.

> 🤖 **Prompt:** "Give me a checklist of URLs to test against my `*.pages.dev` deployment:
> the home page, a `/blog/<slug>/` post, `/rss.xml`, and — using the temporary domain — a few
> old Medium-style paths from `migration/url-inventory.csv` to confirm `_redirects` issues a
> 301 to the right `/blog/<slug>/`. Write me a small PowerShell script using `curl.exe -I`
> that hits each and prints the status code and `Location` header."

> ✅ Expect `301` + correct `Location` for Medium-style paths and `/feed` → `/rss.xml`.
> (The github.io-dated paths will 301 here too because we added them to `_redirects`; their
> *stub-page* fallback only matters once GitHub Pages serves them in Phase 5.)

---

## 4.5 — (Optional) Wrangler for CLI-driven deploys

If you'd rather deploy/preview from the terminal (and let Copilot CLI drive it):

> 🤖 **Prompt:** "Add `wrangler` as a dev dependency and a `pnpm run deploy:preview` script
> that runs `wrangler pages deploy dist --branch=<branch>`. Explain how to authenticate
> (`wrangler login`) and how a preview deploy differs from the Git-integration previews."

> The Git integration (4.3) is the recommended primary path — Wrangler is just a convenience.

---

## Definition of Done

- [ ] Cloudflare account created with 2FA.
- [ ] `praveer09/praveer09.github.io` connected to a Cloudflare Pages project; build command
      `pnpm run build`, output `dist`, `NODE_VERSION=22`.
- [ ] First production build is green; site loads on `https://<project>.pages.dev`.
- [ ] Opening a PR produces a working **preview URL**.
- [ ] The 4.4 redirect checklist passes on `*.pages.dev` (301s + correct `Location`).

➡️ Next: [Phase 5 — DNS cutover for praveergupta.in](./phase-5-dns-cutover.md)
