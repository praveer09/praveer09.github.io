// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';
import rehypeMermaid from '@beoe/rehype-mermaid';

// https://astro.build/config
export default defineConfig({
	site: 'https://praveergupta.in',
	integrations: [mdx(), sitemap()],
	markdown: {
		// Let ```mermaid blocks pass through Astro's Shiki highlighter untouched so
		// rehype-mermaid can transform them (otherwise they're rendered as code).
		syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
		// Render ```mermaid code blocks to static inline SVG at build time
		// (zero client JS) via headless Chromium, emitting
		// <figure class="beoe mermaid"><svg>…</svg></figure>.
		rehypePlugins: [
			[
				rehypeMermaid,
				{
					strategy: 'inline',
					// Keep SVGO minification but preserve the accessible <title> that
					// Mermaid's accTitle generates (SVGO's preset-default removeTitle
					// would otherwise strip it and leave a dangling aria-labelledby).
					svgo: {
						plugins: [
							{
								name: 'preset-default',
								params: {
									overrides: {
										removeViewBox: false,
										convertShapeToPath: false,
										removeTitle: false,
									},
								},
							},
						],
					},
					mermaidConfig: { theme: 'neutral', fontFamily: 'arial,sans-serif' },
				},
			],
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
