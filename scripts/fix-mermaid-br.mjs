// Fixes Mermaid's double-spaced multi-line labels in the built HTML.
//
// @beoe/rehype-mermaid renders diagrams to inline SVG. Inside a foreignObject
// label, a line break is a `<br>` element, which hast-util-to-html serializes
// in SVG space as `<br></br>`. When that inline SVG is then parsed as part of
// an HTML page, the browser's HTML parser treats the stray `</br>` end tag as
// a SECOND `<br>` (per the HTML "any other end tag" rule for <br>), so every
// label line break becomes a double break — multi-line nodes balloon
// vertically (looks fine in editors that parse the SVG as XML, broken on the
// site). VS Code's Mermaid preview parses it as a single break, which is why
// the two views disagree.
//
// Runs in `postbuild`, so it fires locally and in CI for both the Cloudflare
// preview/production build and the GitHub Pages mirror. It rewrites the
// invalid `<br></br>` to a single self-closing `<br/>` across all built HTML.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

function* htmlFiles(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) yield* htmlFiles(full);
		else if (entry.isFile() && entry.name.endsWith('.html')) yield full;
	}
}

let filesChanged = 0;
let breaksFixed = 0;

for (const file of htmlFiles(distDir)) {
	const html = readFileSync(file, 'utf8');
	const matches = html.match(/<br><\/br>/g);
	if (!matches) continue;
	writeFileSync(file, html.replaceAll('<br></br>', '<br/>'));
	filesChanged += 1;
	breaksFixed += matches.length;
}

console.log(
	`Mermaid line-break fix OK: rewrote ${breaksFixed} <br></br> in ${filesChanged} file(s).`,
);
