export { flushTelemetry, isTelemetryDisabled, track } from "./client.js";
export {
	buildHookScanCompletedProps,
	buildMcpToolCalledProps,
	type CommandName,
	type EngineCounts,
	type ErrorKind,
	errorKindFromException,
	type FailedStage,
} from "./events.js";
export { reportFatalError } from "./fatal.js";
export { ensureInstallId, resolveInstallIdPath } from "./identity.js";
export { withCommandLifecycle } from "./lifecycle.js";
