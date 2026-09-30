import { describe, expect, it } from "vitest";
import { buildHookNudge, shouldShowHookNudge } from "../../src/commands/scan-hook-nudge.js";

const ctx = (overrides: Partial<Parameters<typeof shouldShowHookNudge>[0]> = {}) => ({
	installedAgentCount: 0,
	isTty: true,
	isCi: false,
	invocation: "aislop",
	...overrides,
});

describe("hook nudge gating", () => {
	it("shows for an interactive scan with no hook installed", () => {
		expect(shouldShowHookNudge(ctx())).toBe(true);
		const nudge = buildHookNudge(ctx());
		expect(nudge).toContain("aislop hook install");
	});

	it("asks npx users to install globally, since the hook calls aislop directly", () => {
		const nudge = buildHookNudge(ctx({ invocation: "npx aislop@latest" }));
		expect(nudge).toContain("npm install -g aislop && aislop hook install");
		expect(nudge).not.toContain("npx aislop@latest hook install");
	});

	it("stays silent when a hook is already installed", () => {
		expect(shouldShowHookNudge(ctx({ installedAgentCount: 1 }))).toBe(false);
		expect(buildHookNudge(ctx({ installedAgentCount: 1 }))).toBeNull();
	});

	it("stays silent in CI", () => {
		expect(buildHookNudge(ctx({ isCi: true }))).toBeNull();
	});

	it("stays silent when output is not a TTY", () => {
		expect(buildHookNudge(ctx({ isTty: false }))).toBeNull();
	});
});
