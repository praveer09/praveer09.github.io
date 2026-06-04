// Cross-check: every `kind=post` row in migration/url-inventory.csv with a real
// new_slug must appear in exactly one post's redirectFrom. Rows with an empty
// new_slug are the intentionally-parked Medium-only posts (to be recreated later).
//
// Exits non-zero if any post URL is dropped or double-claimed.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'src', 'content', 'blog');
const CSV = path.join(ROOT, 'migration', 'url-inventory.csv');

function parseCSV(text) {
	const rows = [];
	let field = '';
	let record = [];
	let inQuotes = false;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (inQuotes) {
			if (c === '"') {
				if (text[i + 1] === '"') {
					field += '"';
					i++;
				} else inQuotes = false;
			} else field += c;
		} else if (c === '"') inQuotes = true;
		else if (c === ',') {
			record.push(field);
			field = '';
		} else if (c === '\n' || c === '\r') {
			if (c === '\r' && text[i + 1] === '\n') i++;
			if (field !== '' || record.length > 0) {
				record.push(field);
				rows.push(record);
				record = [];
				field = '';
			}
		} else field += c;
	}
	if (field !== '' || record.length > 0) {
		record.push(field);
		rows.push(record);
	}
	const header = rows.shift();
	return rows.map((r) =>
		Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])),
	);
}

// path -> [slugs that claim it]
const claims = new Map();
for (const slug of fs.readdirSync(OUT_DIR)) {
	const file = path.join(OUT_DIR, slug, 'index.md');
	if (!fs.existsSync(file)) continue;
	const { data } = matter(fs.readFileSync(file, 'utf8'));
	for (const p of data.redirectFrom ?? []) {
		if (!claims.has(p)) claims.set(p, []);
		claims.get(p).push(slug);
	}
}

const csv = parseCSV(fs.readFileSync(CSV, 'utf8'));
const postRows = csv.filter((r) => r.kind === 'post');

const unmatched = [];
const parked = [];
const doubleClaimed = [];
for (const row of postRows) {
	if (!row.new_slug) {
		parked.push(row.old_path);
		continue;
	}
	const owners = claims.get(row.old_path) ?? [];
	if (owners.length === 0)
		unmatched.push(`${row.old_path} (expected slug ${row.new_slug})`);
	else if (owners.length > 1)
		doubleClaimed.push(`${row.old_path} -> ${owners.join(', ')}`);
}

console.log(`post rows: ${postRows.length}`);
console.log(`matched:   ${postRows.length - unmatched.length - parked.length}`);
console.log(`parked (Medium-only, empty new_slug): ${parked.length}`);
parked.forEach((p) => console.log(`   · ${p}`));
if (doubleClaimed.length) {
	console.error(`\nDOUBLE-CLAIMED (${doubleClaimed.length}):`);
	doubleClaimed.forEach((d) => console.error(`   ✗ ${d}`));
}
if (unmatched.length) {
	console.error(`\nUNMATCHED (${unmatched.length}):`);
	unmatched.forEach((u) => console.error(`   ✗ ${u}`));
}
if (unmatched.length || doubleClaimed.length) {
	console.error('\nFAIL');
	process.exit(1);
}
console.log('\nOK — every non-parked post URL is claimed by exactly one post.');
