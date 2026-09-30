#!/usr/bin/env node

import path from "node:path";
import {
	DEFAULT_JOBS,
	DEFAULT_LANGUAGES,
	DEFAULT_LIMIT,
	DEFAULT_SINCE,
	optionValue,
	parseArgs,
	parseInteger,
	parseList,
	usage,
} from "./oss-benchmark/args.mjs";
import { runBenchmark } from "./oss-benchmark/benchmark.mjs";
import { captureTrendingCohort, latestManifestPath } from "./oss-benchmark/trending.mjs";

const COMMANDS = ["capture", "run", "cycle"];

const resolveManifestArg = (options) => {
	const manifestArg = optionValue(options, "--manifest", undefined);
	return manifestArg ? path.resolve(String(manifestArg)) : undefined;
};

const main = async () => {
	const { command, options } = parseArgs(process.argv.slice(2));
	if (command === "help" || options.has("--help")) {
		process.stdout.write(usage);
		return;
	}

	if (!COMMANDS.includes(command)) {
		throw new Error(`Unknown command: ${command}`);
	}

	const languages = parseList(optionValue(options, "--languages", undefined), DEFAULT_LANGUAGES);
	const since = String(optionValue(options, "--since", DEFAULT_SINCE));
	const limit = parseInteger(optionValue(options, "--limit", DEFAULT_LIMIT), DEFAULT_LIMIT, "--limit");
	const jobs = parseInteger(optionValue(options, "--jobs", DEFAULT_JOBS), DEFAULT_JOBS, "--jobs");
	const name = optionValue(options, "--name", undefined);
	const iteration = String(optionValue(options, "--iteration", "pass-1"));

	if (command === "capture") {
		await captureTrendingCohort({ languages, limit, since, name, manifestPath: undefined });
		return;
	}

	if (command === "run") {
		const manifestPath = resolveManifestArg(options) ?? latestManifestPath();
		await runBenchmark({ manifestPath, iteration, jobs });
		return;
	}

	const captureResult = await captureTrendingCohort({
		languages,
		limit,
		since,
		name,
		manifestPath: resolveManifestArg(options),
	});
	await runBenchmark({ manifestPath: captureResult.manifestPath, iteration, jobs });
};

main().catch((error) => {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`[oss-benchmark] ${message}`);
	process.exitCode = 1;
});
