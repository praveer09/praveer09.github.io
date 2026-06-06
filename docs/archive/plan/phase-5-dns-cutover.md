# Phase 5 — DNS cutover for praveergupta.in

> **Goal:** repoint `praveergupta.in` from Medium to your Cloudflare Pages project so it
> becomes the live, canonical home of the new site — with SSL issued and every redirect
> working — and fold the `praveer09.github.io` identity in as a redirector. This is the
> highest-risk phase; go slowly and follow the order.

Reasoning: `../research/greenfield-blueprint.md` §0a (DNS cutover steps, email-record gotcha,
apex+www, SSL/CAA, unlinking Medium, the GitHub Pages 301 caveat).

> Most steps here are 🧑‍💻 browser/registrar work. Do them deliberately; a wrong nameserver
> change can break email.

---

## 5.0 — ⚠️ Pre-flight: back up the existing DNS zone FIRST

Before changing anything, record **every** current DNS record for `praveergupta.in` at your
registrar — **especially email records** (`MX`, plus `SPF`/`DKIM`/`DMARC` `TXT` records). If
`praveergupta.in` sends or receives mail, moving nameservers without re-creating these will
**silently break email**.

> 🤖 **Prompt:** "Help me audit the current DNS for `praveergupta.in`: write a PowerShell
> script using `Resolve-DnsName` (or `nslookup`) that queries and prints the `A`, `AAAA`,
> `CNAME`, `MX`, `TXT` (SPF/DKIM/DMARC), `NS`, and `CAA` records, and save the output to
> `migration/dns-backup-praveergupta-in.txt`. Flag any MX/SPF/DKIM/DMARC records I must
> re-create after the move."

Commit `migration/dns-backup-praveergupta-in.txt`.

> 🤖 **CLI-prepared (this session):** ran `scripts/audit-dns.ps1 -Domain praveergupta.in`,
> output committed to `migration/dns-backup-praveergupta-in.txt`. **Findings:**
> - **Registrar = GoDaddy** (nameservers `ns63/ns64.domaincontrol.com`). The nameserver
>   change in 5.1 happens in the **GoDaddy** DNS dashboard.
> - Apex `A` records point to Medium's AWS IPs (`52.x.x.x`) — these get replaced by the
>   Pages custom-domain records in 5.3.
> - **⚠️ ACTIVE EMAIL — re-create before switching nameservers:** `MX 10
>   mailstore1.secureserver.net` and `MX 0 smtp.secureserver.net` (GoDaddy email). If these
>   aren't re-created in Cloudflare, **mail to/from praveergupta.in breaks silently.**
> - Apex `TXT` has a `google-site-verification` token (re-create it so Search Console stays
>   verified). **No SPF and no DMARC** were found publicly — verify in the GoDaddy zone
>   editor; if GoDaddy email uses an SPF/DKIM, copy it across too.

---

## 5.1 — 🧑‍💻 Add the domain to Cloudflare and re-create records

1. Cloudflare dashboard → **Add a site** → `praveergupta.in` → Free plan.
2. Cloudflare scans existing records — **verify the imported list matches your backup**, and
   manually add anything missing (especially the email records from 5.0).
3. Cloudflare gives you **two nameservers**. At your **registrar** (where you bought the
   domain), replace the current nameservers with Cloudflare's.
4. Wait for Cloudflare to report the domain **Active** (propagation: minutes to a few hours).

---

## 5.2 — 🧑‍💻 Unlink the domain from Medium

To avoid an ownership/verification conflict:
1. In **Medium → Settings**, remove/disconnect the `praveergupta.in` custom domain.
2. Remove any stale Medium-pointing records (the old `CNAME`/verification entries) from the
   Cloudflare zone if the import carried them over.

---

## 5.3 — 🧑‍💻 Point the domain at Cloudflare Pages

In the Pages project (from Phase 4) → **Custom domains**, add **both**:
- `praveergupta.in` (apex — Cloudflare uses **CNAME flattening** automatically), and
- `www.praveergupta.in`.

Cloudflare auto-creates the needed records and provisions a certificate.

> 🤖 **Prompt:** "Decide whether `www` or the apex should be primary and the other a redirect.
> Recommend apex (`praveergupta.in`) as canonical with `www` → apex, since my `site` config
> and all canonical tags use the bare apex. Give me the Cloudflare redirect-rule settings to
> 301 `www` → apex."

---

## 5.4 — ⏳ Wait for SSL, then verify

- **Wait for the SSL certificate to issue** before declaring cutover done (can take a few
  minutes to ~an hour). If issuance stalls, check for a restrictive **`CAA`** record blocking
  Cloudflare/Let's Encrypt and fix it.
- Then run the redirect verification (same as Phase 4.4, now against the real domain).

> 🤖 **Prompt:** "Run my redirect-check PowerShell script against `https://praveergupta.in`
> this time: confirm the home page and a `/blog/<slug>/` post return `200` over HTTPS, the
> old Medium-style paths from `migration/url-inventory.csv` return `301` to the right new URL,
> and `/feed` → `/rss.xml`. Print any URL that doesn't behave as expected."

---

## 5.5 — Fold in `praveer09.github.io` (best-effort redirector)

`praveer09.github.io` is a **different host** that Cloudflare can't redirect, and GitHub Pages
can't issue true server-side 301s — so use the **stub pages** generated in Phase 3 (canonical
+ meta-refresh + `noindex`) for the old deep links. Deploy the Astro `dist/` (which contains
those stubs) to GitHub Pages so old deep links keep working. Pick how the github.io **home
page** behaves:

- **Option A (recommended, simplest):** deploy the same `dist/`. Old deep links
  (`/technology/.../slug/`) hit their stub and redirect; `praveer09.github.io/` shows a
  *duplicate* of your real home page. That's SEO-safe **because every page emits an absolute
  canonical to `praveergupta.in` (Phase 3.4)** — so the duplicate isn't penalised. You accepted
  brief github.io downtime, and a canonical-tagged duplicate home is harmless.
- **Option B (purist):** build a **redirect-only** artifact for GitHub Pages (just the stub
  pages + a root `index.html` that redirects to `https://praveergupta.in`), so github.io serves
  *no* duplicate content. More CI work; only worth it if a duplicate home page bothers you.

> 🤖 **Prompt (Option A):** "Set up GitHub Pages deployment via a GitHub Actions workflow
> (`.github/workflows/deploy-pages.yml`) that builds the Astro site with pnpm (Node from
> `.nvmrc`, `--frozen-lockfile`) and publishes `dist/` using `actions/deploy-pages`. This makes
> `praveer09.github.io` serve the same build — including the redirect stub pages at the old
> `/category/date/slug/` paths. Confirm every page carries the absolute `praveergupta.in`
> canonical so the duplicated home/listing pages are SEO-safe."

> Result: `praveer09.github.io/technology/2018/11/24/<slug>/` → stub → `praveergupta.in/blog/<slug>/`.
> It's a meta-refresh (not a 301), but combined with the `canonical` tag it preserves the user
> journey and consolidates SEO on `praveergupta.in`. You accepted brief github.io downtime, so
> a gap here before this workflow runs is fine.

> 🤖 **CLI-prepared (this session):** `.github/workflows/deploy-pages.yml` is written (Option A:
> builds Astro with pnpm from `.nvmrc`, `--frozen-lockfile`, uploads `dist` via
> `actions/upload-pages-artifact` → `actions/deploy-pages`). **It is committed on branch
> `phase-5-dns-cutover` but deliberately NOT merged yet.** Three things to know:
>
> 1. **The workflow alone does NOT stop the Jekyll emails.** You MUST switch the source in
>    **Settings → Pages → Build and deployment → Source → GitHub Actions**. That switch is what
>    disables the failing legacy `pages-build-deployment`.
> 2. **Do not merge this branch until the source is switched.** `actions/deploy-pages` fails if
>    the Pages source is still "Deploy from a branch" — merging early just adds a *second*
>    failure email. Recommended order: cut over DNS (5.1–5.4) → switch source to GitHub Actions
>    → merge `phase-5-dns-cutover` to master (the push runs the workflow and deploys). Do the
>    last two back-to-back to minimise the github.io gap.
> 3. **Known accepted limitation:** on github.io, `/feed.xml` and `/sitemap.xml` will 404
>    (no meta-refresh stub is generated for `.xml` paths — a meta-refresh can't live in an XML
>    file — and Cloudflare's `_redirects` is ignored by GitHub Pages). This only affects the
>    *github.io* host; on the canonical `praveergupta.in` both 301 correctly via `_redirects`.
>    Per-page `canonical` tags consolidate SEO regardless, so this is within the "best-effort
>    redirector" envelope.

> ℹ️ If `praveer09.github.io` itself was previously mapped to a custom domain via a `CNAME`
> file in the repo, make sure that file is gone (it moved to `_legacy-jekyll/` in Phase 1) so
> GitHub Pages serves on the `github.io` host.

---

## Definition of Done

- [x] `migration/dns-backup-praveergupta-in.txt` committed. Email records: **N/A — the owner
      confirmed no email is used on `praveergupta.in`**, so the GoDaddy `MX`/`email`/`ftp`
      records were dropped (only the `google-site-verification` TXT was kept).
- [x] `praveergupta.in` is **Active** on Cloudflare; nameservers switched at GoDaddy
      (`anahi/henry.ns.cloudflare.com`). Medium `A` records (`52.x.x.x`) removed.
- [x] Domain disconnected from Medium at the DNS layer (A records removed + nameservers moved).
- [x] Apex **and** `www` added as Pages custom domains; `www → apex` 301 redirect rule deployed
      (Dynamic `concat("https://praveergupta.in", http.request.uri.path)`, preserves path/query;
      also resolved a transient `522` on `www`).
- [x] **SSL issued**; `https://praveergupta.in` serves the new site (apex resolves to Cloudflare
      `172.67.173.99` / `104.21.63.248`).
- [x] 5.4 redirect checks pass against the real domain: 14/14 via
      `scripts/test-redirects.ps1 -BaseUrl https://praveergupta.in`, plus `www → apex` 301.
- [x] GitHub Pages source switched to **GitHub Actions** (stops the legacy Jekyll builds);
      `.github/workflows/deploy-pages.yml` deploys `dist`, including the old-path redirect stubs.

➡️ Next: [Phase 6 — Verify & go live](./phase-6-verify-golive.md)
