import { Box, useStdout } from "ink";
import type { SessionStore } from "../../agents/session-state.js";
import { ActivityPane } from "./ActivityPane.js";
import { DecisionBar } from "./DecisionBar.js";
import { FooterBar } from "./FooterBar.js";
import { Sidebar } from "./Sidebar.js";
import { useStore } from "./useStore.js";

export const AgentApp = ({ store }: { store: SessionStore }) => {
	const state = useStore(store);
	const { stdout } = useStdout();
	const totalRows = stdout?.rows ?? 24;
	const reserved = state.pendingDecision ? 8 : 3;
	const activityRows = Math.max(3, totalRows - reserved);

	return (
		<Box flexDirection="column" height={totalRows}>
			<Box flexGrow={1}>
				<ActivityPane activity={state.activity} rows={activityRows} />
				<Sidebar state={state} />
			</Box>
			{state.pendingDecision ? <DecisionBar decision={state.pendingDecision} /> : null}
			<FooterBar repo={state.targetRepo} branch={state.branch} worktree={state.worktree} />
		</Box>
	);
};
