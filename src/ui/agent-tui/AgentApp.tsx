import { Box, Text, useStdout } from "ink";
import type { SessionStore } from "../../agents/session-state.js";
import { ActivityPane } from "./ActivityPane.js";
import { DecisionBar } from "./DecisionBar.js";
import { FilesPanel } from "./FilesPanel.js";
import { FooterBar } from "./FooterBar.js";
import { Sidebar } from "./Sidebar.js";
import { StepsPanel } from "./StepsPanel.js";
import { useStore } from "./useStore.js";

export const AgentApp = ({ store }: { store: SessionStore }) => {
	const state = useStore(store);
	const { stdout } = useStdout();
	const totalRows = stdout?.rows ?? 24;
	const activityRows = Math.max(3, Math.floor((totalRows - 10) / 2));

	return (
		<Box flexDirection="column" height={totalRows}>
			<Box flexGrow={1}>
				<Box flexDirection="column" flexGrow={1}>
					<StepsPanel steps={state.steps} />
					<Box paddingX={1}>
						<Text dimColor>Live output</Text>
					</Box>
					<ActivityPane activity={state.activity} rows={activityRows} />
					<FilesPanel files={state.files} />
				</Box>
				<Sidebar state={state} />
			</Box>
			{state.pendingDecision ? <DecisionBar decision={state.pendingDecision} /> : null}
			<FooterBar repo={state.targetRepo} branch={state.branch} worktree={state.worktree} />
		</Box>
	);
};
