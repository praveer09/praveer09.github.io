// One-time migration: convert _legacy-jekyll/_posts/*.{md,markdown} into Astro
// content collection entries under src/content/blog/<slug>/index.md.
//
// - slug = filename with the leading YYYY-MM-DD- stripped and extension removed
// - pubDate = the post's stated frontmatter date (NOT the URL date, which Jekyll
//   shifted via the America/Vancouver timezone — those live in the CSV instead)
// - redirectFrom = every old path (github.io + Medium) for this slug, taken from
//   migration/url-inventory.csv (the single source of truth)
// - Liquid cross-post links ({% post_url %} / {% link %}) are rewritten to /blog/<slug>/
//
// Re-runnable: it overwrites the generated index.md files.

import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

const ROOT = path.resolve(import.meta.dirname, '..');
const POSTS_DIR = path.join(ROOT, '_legacy-jekyll', '_posts');
const IMG_DIR = path.join(ROOT, '_legacy-jekyll', 'img');
const OUT_DIR = path.join(ROOT, 'src', 'content', 'blog');
const CSV = path.join(ROOT, 'migration', 'url-inventory.csv');

// Hand-authored one-line descriptions (the old posts have no subtitle field).
const DESCRIPTIONS = {
	'functional-programming-for-the-object-oriented-minds':
		'An introduction to functional programming and how it can improve the everyday work of object-oriented developers.',
	'using-optional-to-specify-presence-or-absence-of-a-value':
		"How Java 8's Optional helps model the presence or absence of a value and write null-safe code.",
	'understanding-thread-interruption-in-java':
		'How thread interruption works in Java and how to use it to stop long-running tasks cleanly.',
	'writing-test-data-builders-made-easy-with-kotlin':
		"Using Kotlin's language features to write concise, readable Test Data Builders for your tests.",
	'scoped-objects-in-dagger-2':
		'How Dagger 2 lets you manage objects with different life-cycles using scopes.',
	'testing-rest-apis-with-rest-assured':
		"Using REST-assured's Java DSL to write expressive tests for REST APIs.",
	'rxjava-part-1-a-quick-introduction':
		'A quick introduction to reactive programming and RxJava for writing asynchronous, resilient applications.',
	'rxjava-part-2-creating-an-observable':
		"A mental map of RxJava's many Observable factory methods and when to use each one.",
	'rxjava-part-3-multithreading':
		'Writing multithreaded RxJava programs using Schedulers and the subscribeOn and observeOn operators.',
	'writing-comparators-the-java8-way':
		"Writing expressive Comparators declaratively using Java 8's default and static factory methods.",
	'rest-error-responses-in-spring-boot':
		'How Spring Boot formats REST error responses, and how to shape them so clients can handle errors gracefully.',
	'java-8-optional-as-a-monad':
		"Looking at Java 8's Optional through the lens of monads, and blending functional and object-oriented styles.",
	'book-review-soft-skills':
		"A review of 'Soft Skills: The Software Developer's Life Manual' and how it helped me grow professionally and personally.",
	'using-asynchrony-to-reduce-response-times':
		"Using Java 8's CompletableFuture to write asynchronous code and reduce backend service response times.",
	'how-functional-programming-helps-me-write-clean-code':
		'How functional programming techniques help me write code that is easy to read and reason about.',
	'spring-up-an-application-quickly-with-spring-boot':
		'A video walkthrough of how Spring Boot lets you spring up an application quickly with sensible defaults.',
	'practical-guide-to-java-8-s-date-time-api':
		"A practical guide to the everyday features of Java 8's Date Time API (JSR-310).",
	'using-java-8-function-interface-for-extension':
		"Extending existing interfaces without breaking code using Java 8's Function interface and its apply, compose and andThen methods.",
	'offline-installation-of-python-packages-and-ruby-gems':
		'How to install Python packages and Ruby gems offline on systems without internet access.',
	'practical-guide-to-java-stream-api':
		"An introduction to Java 8's Stream API and how it brings a declarative approach to operations over collections.",
};

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
			if (c === '\r' && text[i + 1] === '\n') i++;
			if (field !== '' || record.length > 0) {
				record.push(field);
				rows.push(record);
				record = [];
				field = '';
			}
		} else {
			field += c;
		}
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

function stripDate(name) {
	return name
		.replace(/^\d{4}-\d{2}-\d{2}-/, '')
		.replace(/\.(md|markdown)$/, '');
}

function rewriteLiquid(body) {
	let out = body;
	// {% post_url 2016-02-21-rxjava-part-2-... %}  ->  /blog/rxjava-part-2-.../
	out = out.replace(
		/\{%\s*post_url\s+([^\s%]+?)\s*%\}/g,
		(_, n) => `/blog/${stripDate(n)}/`,
	);
	// {{ site.baseurl }}{% link _posts/2016-07-14-....markdown %}  ->  /blog/.../
	out = out.replace(
		/(?:\{\{\s*site\.baseurl\s*\}\}\s*)?\{%\s*link\s+_posts\/([^\s%]+?)\s*%\}/g,
		(_, n) => `/blog/${stripDate(n)}/`,
	);
	// Any stray site.url / site.baseurl interpolations.
	out = out.replace(/\{\{\s*site\.(?:url|baseurl)\s*\}\}/g, '');
	return out;
}

function toPubDate(raw) {
	if (raw instanceof Date) return raw.toISOString().slice(0, 10);
	return String(raw).trim().slice(0, 10);
}

// Build slug -> Set(old_path) from the inventory (post rows with a real new_slug).
const csv = parseCSV(fs.readFileSync(CSV, 'utf8'));
const redirectMap = new Map();
for (const row of csv) {
	if (row.kind !== 'post' || !row.new_slug) continue;
	if (!redirectMap.has(row.new_slug)) redirectMap.set(row.new_slug, new Set());
	redirectMap.get(row.new_slug).add(row.old_path);
}

const files = fs
	.readdirSync(POSTS_DIR)
	.filter((f) => /\.(md|markdown)$/.test(f));
let count = 0;
for (const file of files) {
	const slug = stripDate(file);
	const { data, content } = matter(
		fs.readFileSync(path.join(POSTS_DIR, file), 'utf8'),
	);

	const description = DESCRIPTIONS[slug];
	if (!description) throw new Error(`Missing description for slug: ${slug}`);

	const title = String(data.title);
	const pubDate = toPubDate(data.date);
	const tags = Array.isArray(data.tags) ? data.tags : [];
	const redirectFrom = [...(redirectMap.get(slug) ?? new Set())].sort();
	if (redirectFrom.length === 0)
		console.warn(`WARN: no redirectFrom for ${slug}`);

	const outDir = path.join(OUT_DIR, slug);
	fs.mkdirSync(outDir, { recursive: true });

	let cover = null;
	const bigimg = data.bigimg || data.image;
	if (bigimg) {
		const srcAbs = path.join(IMG_DIR, String(bigimg).replace(/^\/img\//, ''));
		const ext = path.extname(srcAbs) || '.jpg';
		const coverFile = `cover${ext}`;
		fs.copyFileSync(srcAbs, path.join(outDir, coverFile));
		cover = {
			file: `./${coverFile}`,
			alt: `Cover image for the post "${title}".`,
		};
	}

	const fm = ['---'];
	fm.push(`title: ${JSON.stringify(title)}`);
	fm.push(`description: ${JSON.stringify(description)}`);
	fm.push(`pubDate: ${JSON.stringify(pubDate)}`);
	if (tags.length) fm.push(`tags: [${tags.join(', ')}]`);
	if (redirectFrom.length) {
		fm.push('redirectFrom:');
		for (const p of redirectFrom) fm.push(`  - ${JSON.stringify(p)}`);
	}
	if (cover) {
		fm.push('cover:');
		fm.push(`  src: ${JSON.stringify(cover.file)}`);
		fm.push(`  alt: ${JSON.stringify(cover.alt)}`);
	}
	fm.push('---', '');

	const body = rewriteLiquid(content).replace(/^\s+/, '');
	fs.writeFileSync(
		path.join(outDir, 'index.md'),
		fm.join('\n') + body.replace(/\s*$/, '') + '\n',
	);
	count++;
	console.log(
		`migrated ${slug}${cover ? ' (+cover)' : ''} [${redirectFrom.length} redirects]`,
	);
}
console.log(`\nDone: ${count} posts migrated.`);
