import type { AislopConfig } from "../config/index.js";
import type { LiveRail } from "../ui/live-rail.js";
import { renderHintLine } from "../ui/logger.js";
import type { FixOptions } from "./fix-options.js";
import type { ProjectInfo } from "./fix-pipeline.js";
import { buildFixPlan, skippedFixSteps } from "./fix-plan.js";
import { NO_CHANGES_APPLIED } from "./fix-render.js";
import { describeSkippedStep, type FixStepResult } from "./fix-steps.js";

export const finishDryRun = (input: {
	rail: LiveRail;
	steps: FixStepResult[];
	projectInfo: ProjectInfo;
	config: AislopConfig;
	options: FixOptions;
	checks: readonly string[];
}): { exitCode: number; fixSteps: number; fixResolved: number } => {
	const plan = buildFixPlan(input.projectInfo, input.config, {
		force: Boolean(input.options.force),
		safe: Boolean(input.options.safe),
	});
	const ran = new Set(input.steps.map((step) => step.name));
	for (const step of skippedFixSteps(plan)) {
		if (ran.has(step.name)) continue;
		input.rail.complete({
			status: "skipped",
			label: describeSkippedStep(step.name, step.reason ?? "skipped"),
		});
	}
	if (input.steps.length === 0 && skippedFixSteps(plan).length === 0) {
		input.rail.complete({ status: "skipped", label: "No applicable auto-fixers found" });
	}
	if (input.checks.length > 0) {
		input.rail.complete({
			status: "skipped",
			label: "Project checks skipped during dry-run",
		});
	}
	input.rail.finish({ footer: "Preview · no changes applied" });
	process.stdout.write(`\n${renderHintLine(NO_CHANGES_APPLIED)}`);
	return {
		exitCode: 0,
		fixSteps: input.steps.length,
		fixResolved: 0,
	};
};
