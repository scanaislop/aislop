import { describe, expect, it } from "vitest";
import { siteUrl } from "../../src/ui/site-url.js";

describe("siteUrl", () => {
	it("tags a site path with the CLI as the source", () => {
		expect(siteUrl("/contact?intent=team-baseline", "team-cta")).toBe(
			"https://scanaislop.com/contact?intent=team-baseline&utm_source=aislop&utm_medium=cli&utm_content=team-cta",
		);
	});

	it("keeps the anchor after the query", () => {
		expect(siteUrl("/patterns#narrative-comment", "rule-docs", "mcp")).toBe(
			"https://scanaislop.com/patterns?utm_source=aislop&utm_medium=mcp&utm_content=rule-docs#narrative-comment",
		);
	});
});
