import { render } from "ink-testing-library";
import { describe, expect, it } from "vitest";
import { createSessionState } from "../../../src/agents/session-state.js";
import { AgentApp } from "../../../src/ui/agent-tui/AgentApp.js";

describe("AgentApp", () => {
	it("renders the header and provider without a TTY", () => {
		const store = createSessionState({
			provider: "Mystery",
			providerSource: "auto",
			targetScore: 90,
			targetRepo: "/r",
		});
		const { lastFrame, unmount } = render(<AgentApp store={store} />);
		const frame = lastFrame() ?? "";
		expect(frame).toContain("aislop agent");
		expect(frame).toContain("Mystery");
		unmount();
	});
});
