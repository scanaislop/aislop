import { flushTelemetry, type TelemetryConfig, track } from "./client.js";
import { buildCommandFailedProps, type FailedStage } from "./events.js";

const reportedErrors = new Set<unknown>();
let activeTelemetryConfig: TelemetryConfig | undefined;

export const markErrorReported = (error: unknown): void => {
	reportedErrors.add(error);
};

export const rememberTelemetryConfig = (config: TelemetryConfig | undefined): void => {
	activeTelemetryConfig = config;
};

export const reportFatalError = async (
	error: unknown,
	stage: FailedStage,
	config?: TelemetryConfig,
): Promise<void> => {
	if (reportedErrors.has(error)) return;
	track({
		event: "cli_command_failed",
		properties: buildCommandFailedProps({ error, stage }),
		config: activeTelemetryConfig ?? config,
	});
	await flushTelemetry(2000);
};
