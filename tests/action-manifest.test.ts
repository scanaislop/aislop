import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import YAML from "yaml";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

type ActionManifest = {
	inputs?: {
		version?: {
			default?: unknown;
			description?: unknown;
		};
	};
	runs?: {
		steps?: Array<{ run?: unknown }>;
	};
};

type Workflow = {
	jobs?: Record<
		string,
		{
			strategy?: {
				matrix?: {
					include?: Array<{ case?: unknown }>;
				};
			};
			steps?: Array<{
				name?: unknown;
				uses?: unknown;
				with?: Record<string, unknown>;
			}>;
		}
	>;
};

describe("GitHub action manifest", () => {
	it("derives the CLI version from the action ref unless an input is set", () => {
		const manifest = YAML.parse(
			fs.readFileSync(path.join(rootDir, "action.yml"), "utf-8"),
		) as ActionManifest;

		expect(manifest.inputs?.version?.default).toBe("");
		expect(manifest.inputs?.version?.description).toContain("latest release");
		const runScript = manifest.runs?.steps?.map((step) => step.run?.toString()).join("\n");
		expect(runScript).toContain(
			'bash "$GITHUB_ACTION_PATH/action/resolve-version.sh" "$AISLOP_VERSION_INPUT" "$GITHUB_ACTION_PATH" "$AISLOP_ACTION_REF"',
		);
		expect(runScript).toContain('npm exec --yes --package "aislop@${aislop_version}"');
		expect(runScript).toContain('scan_dir="$GITHUB_WORKSPACE/$scan_dir"');
		expect(runScript).toContain('npm_exec_dir="$(mktemp -d)"');
	});

	it("exercises default, latest, and pinned action modes in CI", () => {
		const workflow = YAML.parse(
			fs.readFileSync(path.join(rootDir, ".github/workflows/aislop.yml"), "utf-8"),
		) as Workflow;
		const actionSmoke = workflow.jobs?.["action-smoke"];
		const cases = actionSmoke?.strategy?.matrix?.include?.map((item) => item.case);
		expect(cases).toEqual(["default-latest-json", "explicit-latest-human", "pinned-current-json"]);

		const steps = actionSmoke?.steps ?? [];

		const defaultStep = steps.find((step) => step.name === "Default latest JSON");
		expect(defaultStep?.uses).toBe("./");
		expect(defaultStep?.with).not.toHaveProperty("version");

		const latestStep = steps.find((step) => step.name === "Explicit latest human");
		expect(latestStep?.uses).toBe("./");
		expect(latestStep?.with?.version).toBe("latest");
		expect(latestStep?.with?.format).toBe("human");
		expect(latestStep?.with?.["node-version"]).toBe("22");

		const pinnedStep = steps.find((step) => step.name === "Pinned current JSON");
		expect(pinnedStep?.uses).toBe("./");
		expect(pinnedStep?.with?.version).toBe("0.11.0");
	});
});
