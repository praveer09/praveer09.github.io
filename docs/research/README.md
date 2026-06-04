# Research & decision record

These documents capture the research and reasoning behind the modernization of this
blog. They are preserved here for future reference — read them when you want the *why*
behind a decision in the implementation plan (`../plan/`).

| File | What it is |
|---|---|
| [`existing-blog-assessment.md`](./existing-blog-assessment.md) | Assessment of the **existing** Jekyll 3.7.4 / Beautiful Jekyll v2 blog: what's stale (dead analytics, CVEs, Bootstrap 3 / jQuery), and a phased path to revive it *in place* if you ever wanted to. Useful as a record of the starting point. |
| [`greenfield-blueprint.md`](./greenfield-blueprint.md) | The **"build it right from scratch"** blueprint that the implementation plan is based on: Astro + TypeScript + Content Collections + Tailwind v4 + pnpm + Cloudflare Pages + GitHub Actions + giscus + Dependabot. Includes the all-important **§0 / §0a migration** (URL continuity + reclaiming `praveergupta.in` from Medium). |

## How these relate to the plan

The **greenfield blueprint** is the chosen direction. The step-by-step, do-it-now version
lives in [`../plan/`](../plan/), split into phases you can execute one at a time with the
GitHub Copilot CLI. When a plan step references a decision (e.g. "why Astro?", "why
Cloudflare Pages?", "why `_redirects`?"), the justification is in the blueprint.

> These files were generated during a research session and reviewed iteratively
> ("rubber-ducked" to consensus). Treat them as a living record — update them if a
> decision changes.
