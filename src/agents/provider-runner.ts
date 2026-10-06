import { spawn } from "node:child_process";
import type { AgentProvider, AgentProviderId } from "./providers.js";

class ProviderExitError extends Error {
	readonly name = "ProviderExitError";

	constructor(
		readonly providerId: AgentProviderId,
		providerLabel: string,
		readonly exitCode: number | null,
	) {
		super(
			exitCode === null
				? `${providerLabel} exited without reporting a status code.`
				: `${providerLabel} exited with code ${exitCode}.`,
		);
	}
}

interface ProviderRunEvent {
	stream: "stdout" | "stderr";
	line: string;
}

export const runProvider = (
	provider: AgentProvider,
	input: {
		cwd: string;
		prompt: string;
		maxTurns: number;
		onEvent?: (event: ProviderRunEvent) => void;
	},
): Promise<number | null> =>
	new Promise((resolve, reject) => {
		const child = spawn(
			provider.bin,
			provider.buildArgs(input.prompt, { maxTurns: input.maxTurns }),
			{
				cwd: input.cwd,
				stdio: ["ignore", "pipe", "pipe"],
				env: { ...process.env, NO_COLOR: "1" },
			},
		);

		const lineReader = (stream: "stdout" | "stderr") => {
			let buffer = "";
			const emit = (line: string) => {
				const trimmed = line.trimEnd();
				if (trimmed.trim().length > 0) input.onEvent?.({ stream, line: trimmed });
			};
			return {
				push: (chunk: Buffer) => {
					buffer += chunk.toString("utf-8");
					const lines = buffer.split(/\r\n|\n|\r/);
					buffer = lines.pop() ?? "";
					for (const line of lines) emit(line);
				},
				flush: () => {
					emit(buffer);
					buffer = "";
				},
			};
		};

		const stdout = lineReader("stdout");
		const stderr = lineReader("stderr");
		child.stdout?.on("data", stdout.push);
		child.stdout?.on("end", stdout.flush);
		child.stderr?.on("data", stderr.push);
		child.stderr?.on("end", stderr.flush);
		child.once("error", (error) => reject(error));
		child.once("close", (code) => {
			if (code === 0) {
				resolve(code);
				return;
			}
			reject(new ProviderExitError(provider.id, provider.label, code));
		});
	});
