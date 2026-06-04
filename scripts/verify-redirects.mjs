// Validates the generated redirect artifacts against the built site (dist/).
// Run AFTER `pnpm build`. Fails (exit 1) if:
//   - a _redirects target (non-splat) does not resolve to a file in dist/,
//   - the same `from` path maps to two different targets,
//   - a CSV row with a non-empty new_path is neither in _redirects nor stubbed,
//   - a parked row (empty new_path) is not in the known allowlist.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readInventory } from './lib/inventory.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const distDir = join(root, 'dist');
const publicDir = join(root, 'public');
const redirectsPath = join(publicDir, '_redirects');
const csvPath = join(root, 'migration', 'url-inventory.csv');

// Medium-only posts intentionally deferred (recreate from Medium export later).
const PARKED_ALLOWLIST = new Set([
	'/tackling-asynchrony-with-kotlin-coroutines-4cfeacb36d1c',
	'/photography-d2e8f8570677',
	'/oneplus-3-pro-user-tips-ecbfb938c488',
	'/harnessing-the-power-of-java-8-streams-67517312447a',
	'/how-to-think-in-rxjava-before-reacting-7aa5d550650e',
]);

const errors = [];

/** Resolve a redirect target to the file that should serve it in dist/. */
function distFileForTarget(target) {
	const path = target.split(/[?#]/)[0];
	const last = path.split('/').filter(Boolean).pop() ?? '';
	if (path.endsWith('/') || last === '')
		return join(distDir, path, 'index.html');
	if (last.includes('.')) return join(distDir, path);
	return join(distDir, path, 'index.html');
}

if (!existsSync(distDir)) {
	console.error(
		'dist/ not found — run `pnpm build` before verifying redirects.',
	);
	process.exit(1);
}

// 1. Parse _redirects and validate targets + uniqueness.
const fromToTarget = new Map();
const fromPaths = new Set();
for (const raw of readFileSync(redirectsPath, 'utf8').split('\n')) {
	const line = raw.trim();
	if (!line || line.startsWith('#')) continue;
	const [from, to] = line.split(/\s+/);
	if (fromToTarget.has(from) && fromToTarget.get(from) !== to) {
		errors.push(
			`duplicate source ${from} -> ${fromToTarget.get(from)} and ${to}`,
		);
	}
	fromToTarget.set(from, to);
	fromPaths.add(from);
	if (from.includes('*')) continue; // splat targets (e.g. /tags/) checked once below
	if (!existsSync(distFileForTarget(to))) {
		errors.push(`_redirects target missing in dist: ${from} -> ${to}`);
	}
}
// Splat targets still need to resolve.
for (const [from, to] of fromToTarget) {
	if (from.includes('*') && !existsSync(distFileForTarget(to))) {
		errors.push(`_redirects splat target missing in dist: ${from} -> ${to}`);
	}
}

// 2. Every CSV row with a target must be covered by a redirect or a stub.
const rows = readInventory(csvPath);
for (const row of rows) {
	if (!row.new_path) {
		if (row.kind === 'post' && !PARKED_ALLOWLIST.has(row.old_path)) {
			errors.push(`un-allowlisted parked row with no target: ${row.old_path}`);
		}
		continue;
	}
	if (row.old_path === row.new_path) continue;
	const inRedirects = fromPaths.has(row.old_path);
	const stubFile = join(
		publicDir,
		row.old_path.replace(/^\//, ''),
		'index.html',
	);
	const hasStub = existsSync(stubFile);
	if (!inRedirects && !hasStub) {
		errors.push(
			`CSV row not covered by redirect or stub: ${row.old_path} -> ${row.new_path}`,
		);
	}
}

if (errors.length) {
	console.error(`Redirect validation FAILED (${errors.length}):`);
	for (const e of errors) console.error(`  - ${e}`);
	process.exit(1);
}
console.log(
	`Redirect validation OK: ${fromToTarget.size} redirects, all targets resolve, ` +
		`${PARKED_ALLOWLIST.size} parked (allowlisted).`,
);
