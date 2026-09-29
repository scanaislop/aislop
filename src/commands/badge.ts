import { renderDisplayRows, renderDisplaySection } from "../ui/display.js";
import { renderHeader } from "../ui/header.js";
import { detectGithubSlug } from "../utils/github-slug.js";
import { APP_VERSION } from "../version.js";

interface BadgeOptions {
	owner?: string;
	repo?: string;
	directory?: string;
	json?: boolean;
}

interface BadgeRenderInput {
	owner: string;
	repo: string;
	svgUrl: string;
	pageUrl: string;
}

interface BadgeResult {
	owner: string;
	repo: string;
	svgUrl: string;
	pageUrl: string;
	output: string;
}

export const renderBadgeOutput = ({ owner, repo, svgUrl, pageUrl }: BadgeRenderInput): string => {
	const slug = `${owner}/${repo}`;
	const markdown = `[![aislop](${svgUrl})](${pageUrl})`;
	return [
		renderHeader({ version: APP_VERSION, command: "Badge", context: [slug] }).trimEnd(),
		"",
		renderDisplaySection("Badge"),
		...renderDisplayRows([
			{ label: "Repository", value: slug },
			{ label: "Badge URL", value: svgUrl },
			{ label: "Page", value: pageUrl },
		]),
		"",
		renderDisplaySection("Markdown"),
		...renderDisplayRows([{ label: "README", value: markdown }]),
		"",
		renderDisplaySection("Next"),
		...renderDisplayRows([
			{
				label: "Add",
				value: "put the README markdown near your project title",
			},
			{
				label: "Refresh",
				value: "run a public scan to update the score behind the badge",
			},
		]),
		"",
	].join("\n");
};

export const badgeCommand = async (options: BadgeOptions = {}): Promise<BadgeResult> => {
	let owner = options.owner?.trim();
	let repo = options.repo?.trim();

	if (!owner || !repo) {
		const detected = detectGithubSlug(options.directory ?? ".");
		if (!detected) {
			throw new Error(
				"Could not detect a GitHub remote. Run from a repo with `git remote get-url origin` set, or pass --owner and --repo.",
			);
		}
		owner ??= detected.owner;
		repo ??= detected.repo;
	}

	const svgUrl = `https://badges.scanaislop.com/score/${owner}/${repo}.svg`;
	const pageUrl = `https://scanaislop.com/${owner}/${repo}`;
	const output = renderBadgeOutput({ owner, repo, svgUrl, pageUrl });

	if (options.json) {
		process.stdout.write(`${JSON.stringify({ owner, repo, svgUrl, pageUrl })}\n`);
	} else {
		process.stdout.write(output);
	}

	return { owner, repo, svgUrl, pageUrl, output };
};
