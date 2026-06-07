import type { SessionStore } from "../../agents/session-state.js";

export interface TuiHandle {
	unmount(): void;
}

// Lazy-imports ink + react so they never touch the cold-start path of `scan`
// and the other commands. Ink renders inline and manages its own region, so the
// final frame stays in scrollback after unmount (no alt-screen takeover).
export const mountAgentTui = async (store: SessionStore): Promise<TuiHandle> => {
	const [{ render }, React, { AgentApp }] = await Promise.all([
		import("ink"),
		import("react"),
		import("./AgentApp.js"),
	]);

	const instance = render(React.createElement(AgentApp, { store }));

	return {
		unmount: () => instance.unmount(),
	};
};
