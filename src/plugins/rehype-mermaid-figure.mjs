import { visit } from 'unist-util-visit';

/**
 * Wraps each Mermaid SVG (emitted by rehype-mermaid's `inline-svg` strategy as a
 * bare `<svg id="mermaid-…">`) in a `<figure class="mermaid-figure">`.
 *
 * This gives a single, stable styling hook (independent of Mermaid's internal
 * id/class names) for the "light canvas" card, mobile overflow handling and any
 * future captions — and keeps the diagram styling scoped away from other SVGs.
 *
 * Must run AFTER rehype-mermaid in the rehypePlugins list.
 */
export default function rehypeMermaidFigure() {
	return (tree) => {
		visit(tree, 'element', (node, index, parent) => {
			if (
				node.tagName !== 'svg' ||
				!parent ||
				index === undefined ||
				typeof node.properties?.id !== 'string' ||
				!node.properties.id.startsWith('mermaid')
			) {
				return;
			}

			parent.children[index] = {
				type: 'element',
				tagName: 'figure',
				properties: { className: ['mermaid-figure'] },
				children: [node],
			};
		});
	};
}
