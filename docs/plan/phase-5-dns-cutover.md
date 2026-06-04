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

> ℹ️ If `praveer09.github.io` itself was previously mapped to a custom domain via a `CNAME`
> file in the repo, make sure that file is gone (it moved to `_legacy-jekyll/` in Phase 1) so
> GitHub Pages serves on the `github.io` host.

---

## Definition of Done

- [ ] `migration/dns-backup-praveergupta-in.txt` committed; email records re-created in
      Cloudflare.
- [ ] `praveergupta.in` is **Active** on Cloudflare; nameservers switched at the registrar.
- [ ] Domain disconnected in Medium's settings; stale Medium records removed.
- [ ] Apex **and** `www` added as Pages custom domains; `www` → apex redirect set.
- [ ] **SSL certificate issued**; `https://praveergupta.in` serves the new site.
- [ ] 5.4 redirect checks pass against the real domain (301s + correct `Location`).
- [ ] GitHub Pages workflow deploys `dist`; a sample old github.io deep link reaches the right
      new post via its stub.

➡️ Next: [Phase 6 — Verify & go live](./phase-6-verify-golive.md)
