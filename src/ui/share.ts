import type { GithubSlug } from "../utils/github-slug.js";
import { renderDisplaySection } from "./display.js";
import { siteUrl } from "./site-url.js";
import { theme as defaultTheme, style, type Theme } from "./theme.js";

export interface ShareInput {
	slug: GithubSlug | null;
}

export const renderShareBlock = (input: ShareInput, deps: { theme?: Theme } = {}): string => {
	const t = deps.theme ?? defaultTheme;
	if (!input.slug) {
		return `\n ${style(t, "muted", "Share links need a GitHub repo: set a github.com origin remote and run again.")}\n`;
	}
	const { owner, repo } = input.slug;
	const pageUrl = `https://scanaislop.com/${owner}/${repo}`;
	const badgeUrl = `https://badges.scanaislop.com/score/${owner}/${repo}.svg`;
	const label = (text: string): string => style(t, "muted", text.padEnd(6));
	const report = `   ${label("Report")}  ${siteUrl(`/${owner}/${repo}`, "share")}`;
	const badge = `   ${label("Badge")}  [![aislop](${badgeUrl})](${pageUrl})`;
	const note = `   ${style(t, "muted", "Public repos only. Anyone with the link can see the score for the default branch.")}`;
	return `\n ${renderDisplaySection("Share", { theme: t })}\n${report}\n${note}\n${badge}\n`;
};

export const renderShareHint = (invocation: string, deps: { theme?: Theme } = {}): string => {
	const t = deps.theme ?? defaultTheme;
	return `\n ${style(t, "muted", `Share this report: ${invocation} scan --share`)}\n`;
};
