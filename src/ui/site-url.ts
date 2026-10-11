const SITE_ORIGIN = "https://scanaislop.com";

export const siteUrl = (path: string, content: string, medium = "cli"): string => {
	const url = new URL(path, SITE_ORIGIN);
	url.searchParams.set("utm_source", "aislop");
	url.searchParams.set("utm_medium", medium);
	url.searchParams.set("utm_content", content);
	return url.toString();
};
