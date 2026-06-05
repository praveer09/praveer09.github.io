// Guards against the "diagram silently failed to render" failure mode.
//
// Mermaid diagrams are rendered to SVG at build time by @beoe/rehype-mermaid,
// which needs a headless browser (Chromium). If the browser is missing or a
// render fails, a build can drop the diagram — or empty the ENTIRE post body.
//
// This script runs in `postbuild`, so it fires locally and in CI (both build
// with Chromium installed). For every non-draft post it compares the number of
// ```mermaid fences in the source against the number of rendered
// <figure class="beoe mermaid"> in the built HTML, and FAILS the build loudly
// on any mismatch instead of shipping a blank page.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const blogDir = join(root, 'src', 'content', 'blog');
const distDir = join(root, 'dist');

const countMatches = (text, regex) => (text.match(regex) || []).length;

const errors = [];
let postsWithDiagrams = 0;
let totalDiagrams = 0;

for (const slug of readdirSync(blogDir, { withFileTypes: true })
	.filter((d) => d.isDirectory())
	.map((d) => d.name)) {
	const sourcePath = ['index.md', 'index.mdx']
		.map((f) => join(blogDir, slug, f))
		.find((p) => existsSync(p));
	if (!sourcePath) continue;

	const { data, content } = matter(readFileSync(sourcePath, 'utf8'));
	if (data.draft) continue;

	// Count opening ```mermaid fences (line start, allowing leading whitespace).
	const expected = countMatches(content, /^[ \t]*```mermaid\b/gm);
	if (expected === 0) continue;

	postsWithDiagrams += 1;
	totalDiagrams += expected;

	const htmlPath = join(distDir, 'blog', slug, 'index.html');
	if (!existsSync(htmlPath)) {
		errors.push(`Built HTML not found for post "${slug}" (${htmlPath}).`);
		continue;
	}

	const html = readFileSync(htmlPath, 'utf8');
	const rendered = countMatches(html, /class="beoe mermaid"/g);
	if (rendered !== expected) {
		errors.push(
			`Post "${slug}": expected ${expected} rendered diagram(s) but found ${rendered} ` +
				`<figure class="beoe mermaid"> in dist — the Mermaid render likely failed ` +
				`(check that headless Chromium is installed for the build).`,
		);
		continue;
	}

	// Guard against a figure that rendered but is empty/broken, and against a
	// mermaid block that leaked through as raw highlighted code.
	const svgCount = countMatches(html, /<svg\b/g);
	if (svgCount < expected) {
		errors.push(
			`Post "${slug}": ${expected} diagram figure(s) but only ${svgCount} <svg> element(s) — ` +
				`a diagram rendered empty.`,
		);
	}
	if (/class="[^"]*language-mermaid/.test(html)) {
		errors.push(
			`Post "${slug}": a raw \`\`\`mermaid code block leaked into the HTML (not rendered to SVG).`,
		);
	}
}

if (errors.length > 0) {
	console.error('Diagram validation FAILED:');
	for (const e of errors) console.error(`  - ${e}`);
	process.exit(1);
}

console.log(
	`Diagram validation OK: ${totalDiagrams} diagram(s) across ${postsWithDiagrams} post(s) rendered.`,
);
