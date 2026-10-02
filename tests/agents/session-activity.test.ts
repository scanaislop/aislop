import { describe, expect, it } from "vitest";
import {
	addProviderUsage,
	createSessionStats,
	createUsageTotals,
	formatDiffStat,
	formatToolCalls,
	formatUsageTotals,
	isProviderToolLine,
	mergeProviderUsage,
} from "../../src/agents/session-activity.js";

describe("agent session activity", () => {
	it("merges provider usage as latest known totals", () => {
		const usage = createUsageTotals();
		Object.assign(
			usage,
			mergeProviderUsage(usage, {
				inputTokens: 1000,
				cachedInputTokens: 500,
				outputTokens: 80,
				totalTokens: 1580,
			}),
		);
		Object.assign(
			usage,
			mergeProviderUsage(usage, {
				inputTokens: 1200,
				outputTokens: 120,
				totalTokens: 1820,
				costUsd: 0.0123,
			}),
		);

		expect(usage).toMatchObject({
			inputTokens: 1200,
			cachedInputTokens: 500,
			outputTokens: 120,
			totalTokens: 1820,
			costUsd: 0.0123,
		});
		expect(formatUsageTotals(usage)).toContain("2k total");
		expect(formatUsageTotals(usage)).toContain("$0.01");
	});

	it("tracks provider pass and tool-call counters", () => {
		const stats = createSessionStats();
		stats.providerPasses = 2;
		stats.toolCalls = 14;
		stats.outputEvents = 30;

		expect(formatToolCalls(stats.toolCalls)).toBe("14 tool calls");
		expect(isProviderToolLine("exec: pnpm test")).toBe(true);
		expect(isProviderToolLine("tool: Edit")).toBe(true);
		expect(isProviderToolLine("assistant: done")).toBe(false);
	});

	it("formats edited file diff stats", () => {
		expect(formatDiffStat({ additions: 12, deletions: 3 })).toBe("+12 -3");
		expect(formatDiffStat({ additions: null, deletions: null, binary: true })).toBe("binary");
		expect(formatDiffStat({})).toBe("changed");
	});
});

describe("addProviderUsage", () => {
	it("sums per-response usage and cost across responses", () => {
		const empty = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0 };
		const first = addProviderUsage(empty, {
			inputTokens: 500,
			outputTokens: 100,
			totalTokens: 600,
			costUsd: 0.03,
		});
		const second = addProviderUsage(first, {
			inputTokens: 300,
			outputTokens: 50,
			totalTokens: 350,
			costUsd: 0.02,
		});
		expect(second).toMatchObject({ inputTokens: 800, outputTokens: 150, totalTokens: 950 });
		expect(second.costUsd).toBeCloseTo(0.05);
	});
});
