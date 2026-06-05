// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeMermaid from 'rehype-mermaid';

import rehypeMermaidFigure from './src/plugins/rehype-mermaid-figure.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://praveergupta.in',
	integrations: [mdx(), sitemap()],
	markdown: {
		// Let ```mermaid blocks pass through Astro's Shiki highlighter untouched so
		// rehype-mermaid can transform them (otherwise they're rendered as code).
		syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
		// Render ```mermaid code blocks to static inline SVG at build time
		// (zero client JS). Wrapped in a <figure> by the local plugin afterwards.
		// Uses Playwright + headless Chromium during the build.
		rehypePlugins: [
			[
				rehypeMermaid,
				{
					strategy: 'inline-svg',
					mermaidConfig: { theme: 'neutral', fontFamily: 'arial,sans-serif' },
				},
			],
			rehypeMermaidFigure,
		],
	},
	vite: {
		plugins: [tailwindcss()],
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: 'Atkinson',
			cssVariable: '--font-atkinson',
			fallbacks: ['sans-serif'],
			options: {
				variants: [
					{
						src: ['./src/assets/fonts/atkinson-regular.woff'],
						weight: 400,
						style: 'normal',
						display: 'swap',
					},
					{
						src: ['./src/assets/fonts/atkinson-bold.woff'],
						weight: 700,
						style: 'normal',
						display: 'swap',
					},
				],
			},
		},
	],
});
