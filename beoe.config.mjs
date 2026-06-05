import { defineConfig } from '@beoe/cache';

// Store the rendered-diagram cache as a committed SQLite file in the repo
// (default is node_modules/.beoe, which is gitignored). Committing it lets
// Cloudflare Pages build the site WITHOUT a headless browser: cache hits
// return the prerendered SVG instead of launching Playwright/Chromium.
//
// On Cloudflare (CF_PAGES) and CI the cache is opened READONLY so that:
//   - reads never mutate the committed SQLite file (no lastAccess/WAL churn), and
//   - @beoe/cache does not register its writable-mode process handlers
//     (incl. an uncaughtException -> process.exit() that could mask failures).
// A cache MISS there falls through to a browser render, which has no browser
// available and therefore fails the build LOUDLY (instead of shipping a blank
// page). Locally the cache stays writable so authoring auto-populates it; run a
// normal `pnpm build` with the devcontainer's Chromium to refresh it.
const readonly = process.env.CF_PAGES === '1' || process.env.CI === 'true';

export default defineConfig({
	database: '.beoe/cache.sqlite',
	readonly,
});
