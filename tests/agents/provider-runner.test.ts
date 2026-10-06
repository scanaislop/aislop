import { describe, expect, it } from "vitest";
import { runProvider } from "../../src/agents/provider-runner.js";
import type { AgentProvider } from "../../src/agents/providers.js";

const providerWithExitCode = (exitCode: number): AgentProvider => ({
	id: "opencode",
	label: "OpenCode",
	bin: process.execPath,
	loginCommand: { command: "opencode", args: ["auth", "login"] },
	loginHint: "Run `opencode auth login`.",
	buildArgs: () => ["-e", `process.exitCode = ${exitCode}`],
});

const providerRunning = (script: string): AgentProvider => ({
	...providerWithExitCode(0),
	buildArgs: () => ["-e", script],
});

describe("provider runner", () => {
	it("resolves when the provider process exits successfully", async () => {
		await expect(
			runProvider(providerWithExitCode(0), {
				cwd: process.cwd(),
				prompt: "repair",
				maxTurns: 1,
			}),
		).resolves.toBe(0);
	});

	it("rejects when the provider process exits non-zero", async () => {
		await expect(
			runProvider(providerWithExitCode(7), {
				cwd: process.cwd(),
				prompt: "repair",
				maxTurns: 1,
			}),
		).rejects.toMatchObject({
			name: "ProviderExitError",
			providerId: "opencode",
			exitCode: 7,
		});
	});

	it("emits a final line without a newline and splits carriage returns", async () => {
		const events: string[] = [];
		await expect(
			runProvider(
				providerRunning(
					'process.stderr.write("progress 1\\rprogress 2\\nError: no model configured"); process.exitCode = 1',
				),
				{
					cwd: process.cwd(),
					prompt: "repair",
					maxTurns: 1,
					onEvent: (event) => events.push(`${event.stream}:${event.line}`),
				},
			),
		).rejects.toMatchObject({ exitCode: 1 });
		expect(events).toEqual([
			"stderr:progress 1",
			"stderr:progress 2",
			"stderr:Error: no model configured",
		]);
	});
});
