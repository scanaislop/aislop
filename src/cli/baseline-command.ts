import type { Command } from "commander";
import { baselinePruneCommand, baselineWriteCommand } from "../commands/baseline.js";
import { loadConfig } from "../config/index.js";
import { withCommandLifecycle } from "../telemetry/index.js";

export const registerBaselineCommand = (program: Command): void => {
	const baseline = program
		.command("baseline")
		.description("Record accepted findings so ci fails only on new ones");

	baseline
		.command("write [directory]")
		.description("Scan the project and record every current finding in the baseline")
		.action(async (directory = ".") => {
			const config = loadConfig(directory);
			const { exitCode } = await withCommandLifecycle(
				{ command: "baseline_write", config: config.telemetry },
				() => baselineWriteCommand(directory, config),
			);
			if (exitCode !== 0) process.exitCode = exitCode;
		});

	baseline
		.command("prune [directory]")
		.description("Remove baseline entries for findings that no longer occur")
		.action(async (directory = ".") => {
			const config = loadConfig(directory);
			const { exitCode } = await withCommandLifecycle(
				{ command: "baseline_prune", config: config.telemetry },
				() => baselinePruneCommand(directory, config),
			);
			if (exitCode !== 0) process.exitCode = exitCode;
		});
};
