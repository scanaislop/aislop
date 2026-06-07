import type { SessionStore } from "../../agents/session-state.js";

export interface TuiHandle {
	unmount(): void;
	waitUntilExit(): Promise<void>;
}

// Lazy-imports ink + react so they never touch the cold-start path of `scan`
// and the other commands. Enters the alt-screen buffer on mount and restores
// the main screen on unmount.
export const mountAgentTui = async (store: SessionStore): Promise<TuiHandle> => {
	const [{ render }, React, { AgentApp }] = await Promise.all([
		import("ink"),
		import("react"),
		import("./AgentApp.js"),
	]);

	process.stdout.write("\x1b[?1049h");
	const instance = render(React.createElement(AgentApp, { store }));

	return {
		unmount() {
			instance.unmount();
			process.stdout.write("\x1b[?1049l");
		},
		waitUntilExit: () => instance.waitUntilExit(),
	};
};
