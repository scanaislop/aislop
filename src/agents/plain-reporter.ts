import { fmtFileList, fmtTokens } from "../ui/agent-tui/format.js";
import { computeCostUsd, resolvePricing } from "./pricing.js";
import type { SessionStore } from "./session-state.js";

interface Sink {
	write(text: string): void;
}

export const attachPlainReporter = (
	store: SessionStore,
	sink: Sink = process.stdout,
): (() => void) => {
	let headerPrinted = false;
	let lastPass = 0;
	let summaryPrinted = false;

	return store.subscribe(() => {
		const s = store.getState();

		if (!headerPrinted) {
			headerPrinted = true;
			sink.write(
				` aislop agent · ${s.provider} (${s.providerSource}) · target ${s.targetScore}/100\n`,
			);
			if (s.worktree) sink.write(`   worktree ${s.worktree}\n`);
			sink.write("\n");
		}

		if (s.passes > lastPass) {
			lastPass = s.passes;
			const cost = computeCostUsd(resolvePricing(s.provider, s.model), s.tokens);
			const costStr = cost == null ? "" : ` · $${cost.toFixed(2)}`;
			sink.write(
				` pass ${s.passes}  ${s.scoreStart ?? "?"}→${s.score ?? "?"} · ` +
					`${s.findingsRemaining ?? "?"} left · ${s.filesChanged.size} files · ` +
					`${fmtTokens(s.tokens.total)} tok${costStr}\n`,
			);
			const changed = [...s.filesChanged];
			if (changed.length > 0) sink.write(`   ↳ ${fmtFileList(changed, 3)}\n`);
		}

		if (s.phase === "done" && s.summary && !summaryPrinted) {
			summaryPrinted = true;
			const m = s.summary;
			sink.write(
				`\n Summary  ${m.scoreStart ?? "?"}→${m.score ?? "?"} · ` +
					`${m.passes} pass${m.passes === 1 ? "" : "es"} · ${m.changedFiles.length} files · ` +
					`${m.findingsRemaining ?? "?"} left\n`,
			);
			sink.write(`   Changed  ${fmtFileList(m.changedFiles, 6)}\n`);
			if (m.sessionId) {
				sink.write(`   Review   aislop agent show ${m.sessionId}\n`);
				sink.write(`   Apply    aislop agent apply ${m.sessionId}\n`);
			}
		}
	});
};
