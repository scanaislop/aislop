import { describe, expect, it } from "vitest";
import { shouldShowShareHint } from "../../src/commands/scan-output.js";
import { renderShareBlock, renderShareHint } from "../../src/ui/share.js";
import { stripAnsi as strip } from "../helpers/ansi.js";

describe("renderShareBlock", () => {
	it("prints the report URL, visibility note, and badge markdown for a GitHub repo", () => {
		const out = strip(renderShareBlock({ slug: { owner: "acme", repo: "app" } }));
		expect(out).toContain(
			"https://scanaislop.com/acme/app?utm_source=aislop&utm_medium=cli&utm_content=share",
		);
		expect(out).toContain("Public repos only. Anyone with the link can see the score for the default branch");
		expect(out).toContain(
			"[![aislop](https://badges.scanaislop.com/score/acme/app.svg)](https://scanaislop.com/acme/app)",
		);
	});

	it("explains that share links need a GitHub repo when there is no GitHub remote", () => {
		const out = strip(renderShareBlock({ slug: null }));
		expect(out).toContain("Share links need a GitHub repo");
		expect(out).not.toContain("scanaislop.com");
		expect(out.trim().split("\n")).toHaveLength(1);
	});
});

describe("renderShareHint", () => {
	it("is a single line using the current invocation", () => {
		const out = strip(renderShareHint("npx aislop@latest"));
		expect(out.trim()).toBe("Share this report: npx aislop@latest scan --share");
	});
});

describe("shouldShowShareHint", () => {
	const ctx = {
		isTty: true,
		isCi: false,
		share: false,
		machineOutput: false,
		command: "scan" as const,
		printBrand: true,
	};

	it("shows for an interactive human scan", () => {
		expect(shouldShowShareHint(ctx)).toBe(true);
	});

	it("stays silent for JSON/SARIF output, CI, non-TTY, the ci command, or --share", () => {
		expect(shouldShowShareHint({ ...ctx, machineOutput: true })).toBe(false);
		expect(shouldShowShareHint({ ...ctx, isCi: true })).toBe(false);
		expect(shouldShowShareHint({ ...ctx, isTty: false })).toBe(false);
		expect(shouldShowShareHint({ ...ctx, command: "ci" })).toBe(false);
		expect(shouldShowShareHint({ ...ctx, share: true })).toBe(false);
		expect(shouldShowShareHint({ ...ctx, printBrand: false })).toBe(false);
	});
});
