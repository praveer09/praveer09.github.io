// Phase 6.1 — full live URL-coverage check against the deployed sites.
//
// Reads EVERY row of migration/url-inventory.csv and requests each `old_path` on its
// own `old_host`:
//   - praveergupta.in rows  -> https://praveergupta.in<old_path>  (expect a 200 whose final
//     URL is https://praveergupta.in<new_path>, reached via Cloudflare _redirects 301s)
//   - praveer09.github.io rows -> https://praveer09.github.io<old_path>  (served by the same
//     Astro build; resolves via a meta-refresh STUB or a real page, so accept a 200 whose
//     HTML <link rel="canonical"> points at https://praveergupta.in<new_path>)
//
// Exits non-zero if any row FAILs. Two allowlists mirror reality:
//   - PARKED: the 5 Medium-only posts (empty new_path) intentionally 404 until recreated.
//   - GITHUB_XML_KNOWN: /feed.xml and /sitemap.xml on github.io 404 there by design
//     (a meta-refresh can't live in an XML file and Cloudflare's _redirects is ignored by
//     GitHub Pages). They DO 301 correctly on the canonical praveergupta.in host.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readInventory } from './lib/inventory.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const csvPath = join(root, 'migration', 'url-inventory.csv');
const CANON = 'https://praveergupta.in';

const PARKED = new Set([
	'/tackling-asynchrony-with-kotlin-coroutines-4cfeacb36d1c',
	'/photography-d2e8f8570677',
	'/oneplus-3-pro-user-tips-ecbfb938c488',
	'/harnessing-the-power-of-java-8-streams-67517312447a',
	'/how-to-think-in-rxjava-before-reacting-7aa5d550650e',
]);

const GITHUB_XML_KNOWN = new Set(['/feed.xml', '/sitemap.xml']);

// Concrete samples for wildcard rows.
const WILDCARD_SAMPLES = {
	'/archive*': '/archive/2016',
	'/tagged/*': '/tagged/java',
};

const UA = 'praveer-musings-redirect-verifier/1.0';

const norm = (u) =>
	u.replace(/\/+$/, (m) => (u === 'https://praveergupta.in/' ? m : '')); // keep apex slash
function sameUrl(a, b) {
	const strip = (s) => s.replace(/#.*$/, '');
	return strip(a) === strip(b);
}

function expandOldPath(oldPath) {
	if (WILDCARD_SAMPLES[oldPath]) return WILDCARD_SAMPLES[oldPath];
	return oldPath;
}

function canonicalFromHtml(html) {
	const m = html.match(
		/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i,
	);
	return m ? m[1] : null;
}

async function checkRow(row) {
	const oldPath = row.old_path;
	const host = row.old_host;
	const label = `${host}${oldPath}`;

	if (!row.new_path) {
		if (PARKED.has(oldPath))
			return { status: 'SKIP', code: '-', label, note: 'parked (Medium-only)' };
		return {
			status: 'FAIL',
			code: '-',
			label,
			note: 'empty new_path, not parked',
		};
	}

	if (host === 'praveer09.github.io' && GITHUB_XML_KNOWN.has(oldPath))
		return {
			status: 'SKIP',
			code: '-',
			label,
			note: 'known github.io .xml limitation (301s on praveergupta.in)',
		};

	const testPath = expandOldPath(oldPath);
	const url = `https://${host}${testPath}`;
	const expected = `${CANON}${row.new_path}`;

	try {
		const res = await fetch(url, {
			redirect: 'follow',
			headers: { 'user-agent': UA },
		});
		const code = res.status;

		if (host === 'praveergupta.in') {
			// Should land (via 301) on the canonical new URL with a 200.
			const ok = res.ok && sameUrl(norm(res.url), norm(expected));
			return {
				status: ok ? 'PASS' : 'FAIL',
				code,
				label,
				note: ok ? `-> ${res.url}` : `landed ${res.url} (want ${expected})`,
			};
		}

		// github.io: served by the same Astro build; assert canonical -> praveergupta.in<new_path>.
		if (!res.ok)
			return { status: 'FAIL', code, label, note: `non-200 (${code})` };
		const html = await res.text();
		const canon = canonicalFromHtml(html);
		const ok = canon && sameUrl(norm(canon), norm(expected));
		return {
			status: ok ? 'PASS' : 'FAIL',
			code,
			label,
			note: ok
				? `canonical ${canon}`
				: `canonical ${canon ?? '(none)'} (want ${expected})`,
		};
	} catch (err) {
		return {
			status: 'FAIL',
			code: 'ERR',
			label,
			note: String(err.message ?? err),
		};
	}
}

async function pool(items, size, fn) {
	const out = [];
	let i = 0;
	const workers = Array.from({ length: size }, async () => {
		while (i < items.length) {
			const idx = i++;
			out[idx] = await fn(items[idx]);
		}
	});
	await Promise.all(workers);
	return out;
}

const rows = readInventory(csvPath);
const results = await pool(rows, 6, checkRow);

let pass = 0;
let fail = 0;
let skip = 0;
for (const r of results) {
	if (r.status === 'PASS') pass++;
	else if (r.status === 'SKIP') skip++;
	else fail++;
	const tag = r.status.padEnd(4);
	console.log(
		`${tag} ${String(r.code).padStart(3)}  ${r.label}\n       ${r.note}`,
	);
}

console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped (allowlisted).`);
process.exit(fail ? 1 : 0);
