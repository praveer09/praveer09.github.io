// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "Praveer's Musings";
export const SITE_DESCRIPTION =
	'A place where Praveer shares his learnings on software craftsmanship.';

// giscus (GitHub Discussions-backed comments). Fill repoId + categoryId from
// https://giscus.app after enabling Discussions and installing the giscus app.
// While the IDs start with "REPLACE", the Comments island renders nothing.
export const GISCUS = {
	repo: 'praveer09/praveer09.github.io',
	repoId: 'MDEwOlJlcG9zaXRvcnkyMDE4ODk1MA==',
	category: 'Announcements',
	categoryId: 'DIC_kwDOATQPFs4C-kIG',
};

// Cloudflare Web Analytics beacon token (public — it ships in client HTML).
// Get it from Cloudflare dashboard > Analytics & Logs > Web Analytics > add
// praveergupta.in. While it starts with "REPLACE", no beacon is emitted.
// Cloudflare Web Analytics is cookieless, so no consent banner is required.
export const CF_ANALYTICS_TOKEN = 'REPLACE_WITH_CF_BEACON_TOKEN';
