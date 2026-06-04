// Generates static redirect stub pages for old praveer09.github.io deep links.
// GitHub Pages can't issue server-side 301s, so for every old github.io URL whose
// target differs we emit a tiny HTML page that declares the canonical new URL and
// meta-refreshes to it. Written into public/ so they land in dist/ for the github.io
// host (Phase 5). Plain Node (no astro:content) — runs as a prebuild step.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readInventory } from './lib/inventory.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const csvPath = join(root, 'migration', 'url-inventory.csv');
const publicDir = join(root, 'public');
const CANONICAL_ORIGIN = 'https://praveergupta.in';

function stubHtml(newPath) {
	const target = `${CANONICAL_ORIGIN}${newPath}`;
	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<title>Redirecting…</title>
		<link rel="canonical" href="${target}" />
		<meta name="robots" content="noindex" />
		<meta http-equiv="refresh" content="0; url=${target}" />
	</head>
	<body>
		<p>This page has moved to <a href="${target}">${target}</a>.</p>
	</body>
</html>
`;
}

/** Map an old (directory-style) path to the stub file we write under public/. */
function outFileFor(oldPath) {
	const rel = oldPath.replace(/^\//, '');
	return join(publicDir, rel, 'index.html');
}

const rows = readInventory(csvPath);
let written = 0;
const skipped = [];
for (const row of rows) {
	if (row.old_host !== 'praveer09.github.io') continue;
	if (!row.new_path || row.old_path === row.new_path) {
		skipped.push(row.old_path);
		continue;
	}
	// File-extension paths (e.g. /feed.xml, /sitemap.xml) are deliberately NOT
	// stubbed: an HTML meta-refresh is useless to XML clients, and on the canonical
	// Cloudflare host a static stub would shadow the real `_redirects` 301 (static
	// assets take precedence). Those paths are handled by `_redirects` instead.
	const last = row.old_path.split('/').filter(Boolean).pop() ?? '';
	if (last.includes('.')) {
		skipped.push(row.old_path);
		continue;
	}
	const outFile = outFileFor(row.old_path);
	mkdirSync(dirname(outFile), { recursive: true });
	writeFileSync(outFile, stubHtml(row.new_path), 'utf8');
	written++;
}

console.log(
	`Wrote ${written} github.io redirect stub(s) under public/` +
		(skipped.length
			? ` (skipped ${skipped.length}: ${skipped.join(', ')})`
			: ''),
);
