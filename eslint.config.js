import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
	{
		ignores: [
			'dist/',
			'.astro/',
			'node_modules/',
			'_legacy-jekyll/',
			'migration/',
			'docs/',
		],
	},
	...eslintPluginAstro.configs.recommended,
	{
		files: ['**/*.astro'],
		languageOptions: {
			parserOptions: {
				parser: tseslint.parser,
			},
		},
	},
];
