import { describe, expect, it } from "vitest";
import { attachPlainReporter } from "../../src/agents/plain-reporter.js";
import { createSessionState } from "../../src/agents/session-state.js";

describe("plain reporter", () => {
	it("streams a header, per-pass deltas, and one summary without repetition", () => {
		const writes: string[] = [];
		const store = createSessionState({
			provider: "Codex",
			providerSource: "auto",
			targetScore: 90,
			targetRepo: "/repo",
			worktree: "/wt",
		});
		attachPlainReporter(store, { write: (s) => writes.push(s) });

		store.update({ scoreStart: 14, score: 24, findingsRemaining: 51 });
		store.recordEdit("a.ts");
		store.recordEdit("b.ts");
		store.incPass();
		store.finish({
			scoreStart: 14,
			score: 24,
			passes: 1,
			findingsRemaining: 51,
			changedFiles: ["a.ts", "b.ts"],
			worktree: "/wt",
			sessionId: "2680",
		});

		const out = writes.join("");
		expect(out).toContain("aislop agent · Codex");
		expect(out.match(/pass 1/g)?.length).toBe(1);
		expect(out.match(/Summary/g)?.length).toBe(1);
		expect(out).toContain("aislop agent apply 2680");
	});
});
