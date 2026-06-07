import { Box, Text } from "ink";
import { computeCostUsd, contextPct, resolvePricing } from "../../agents/pricing.js";
import type { AgentSessionState } from "../../agents/session-state.js";
import { fmtElapsed, fmtTokens } from "./format.js";

const Row = ({ label, value, color }: { label: string; value: string; color?: string }) => (
	<Box>
		<Box width={9}>
			<Text dimColor>{label}</Text>
		</Box>
		<Text color={color}>{value}</Text>
	</Box>
);

const scoreColor = (score: number | null, target: number): string => {
	if (score == null) return "white";
	if (score >= target) return "green";
	if (score >= target * 0.7) return "yellow";
	return "red";
};

export const Sidebar = ({ state }: { state: AgentSessionState }) => {
	const pricing = resolvePricing(state.provider, state.model);
	const cost = computeCostUsd(pricing, state.tokens);
	const ctx = contextPct(pricing, state.tokens);
	const title = state.model ? `${state.provider} · ${state.model}` : state.provider;

	return (
		<Box flexDirection="column" width={30} paddingX={1} borderStyle="round" borderColor="gray">
			<Text bold>{title}</Text>
			<Box marginTop={1} flexDirection="column">
				<Row
					label="Score"
					value={`${state.score ?? "--"}→${state.targetScore}`}
					color={scoreColor(state.score, state.targetScore)}
				/>
				<Row
					label="Left"
					value={state.findingsRemaining == null ? "--" : String(state.findingsRemaining)}
				/>
				<Row label="Files" value={String(state.filesChanged.size)} />
				<Row label="Passes" value={String(state.passes)} />
				<Row label="Tokens" value={fmtTokens(state.tokens.total)} />
				{cost != null ? <Row label="Cost" value={`$${cost.toFixed(2)}`} /> : null}
				{ctx != null ? <Row label="Context" value={`${Math.round(ctx)}%`} /> : null}
				<Row label="Elapsed" value={fmtElapsed(Date.now() - state.startedAt)} />
			</Box>
		</Box>
	);
};
