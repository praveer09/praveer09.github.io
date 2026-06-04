// Shared helpers for reading migration/url-inventory.csv from plain Node scripts
// (prebuild steps — must not import astro:content).
import { readFileSync } from 'node:fs';

/** Minimal RFC-4180-ish parser for the quoted, comma-separated inventory file. */
export function parseCsv(text) {
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
				} else {
					inQuotes = false;
				}
			} else {
				field += c;
			}
		} else if (c === '"') {
			inQuotes = true;
		} else if (c === ',') {
			record.push(field);
			field = '';
		} else if (c === '\n' || c === '\r') {
			if (field !== '' || record.length) {
				record.push(field);
				rows.push(record);
				record = [];
				field = '';
			}
			if (c === '\r' && text[i + 1] === '\n') i++;
		} else {
			field += c;
		}
	}
	if (field !== '' || record.length) {
		record.push(field);
		rows.push(record);
	}
	const header = rows.shift();
	return rows.map((r) =>
		Object.fromEntries(header.map((h, idx) => [h, r[idx] ?? ''])),
	);
}

export function readInventory(csvPath) {
	return parseCsv(readFileSync(csvPath, 'utf8'));
}
