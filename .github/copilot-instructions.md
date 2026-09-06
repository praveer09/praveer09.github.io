# Copilot instructions for this repo

- Do not run local build, lint, or typecheck commands for routine changes in this repository.
- Treat GitHub Actions and Cloudflare Pages checks as the source of truth for validation and deployment.
- Only run local validation if the user explicitly asks for it or if a CI failure requires local debugging and the fix cannot be reasoned about from the logs.
- Prefer pushing the branch and waiting on CI rather than building locally, especially for Astro/static site changes.
