import { flushTelemetry, type TelemetryConfig, track } from "./client.js";
import { buildCommandFailedProps, type FailedStage } from "./events.js";

const REPORTED = Symbol.for("aislop.telemetry.error-reported");

export const markErrorReported = (error: unknown): void => {
	if (error !== null && typeof error === "object" && Object.isExtensible(error)) {
		Object.defineProperty(error, REPORTED, { value: true, configurable: true });
	}
};

const isErrorReported = (error: unknown): boolean =>
	error !== null &&
	typeof error === "object" &&
	(error as Record<symbol, unknown>)[REPORTED] === true;

export const reportFatalError = async (
	error: unknown,
	stage: FailedStage,
	config?: TelemetryConfig,
): Promise<void> => {
	if (isErrorReported(error)) return;
	track({
		event: "cli_command_failed",
		properties: buildCommandFailedProps({ error, stage }),
		config,
	});
	await flushTelemetry(2000);
};
