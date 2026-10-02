export const DEFAULT_LANGUAGES = ["typescript", "python", "go", "rust", "ruby", "php", "java"];
export const DEFAULT_LIMIT = 10;
export const DEFAULT_JOBS = 1;
export const DEFAULT_SINCE = "daily";

export const usage = `Trending OSS benchmark runner

Usage:
  node tools/oss-benchmark.mjs capture [--languages ts,php,...] [--limit 10] [--since daily] [--name NAME]
  node tools/oss-benchmark.mjs run [--manifest PATH] [--iteration NAME] [--jobs 2]
  node tools/oss-benchmark.mjs cycle [--languages ts,php,...] [--limit 10] [--since daily] [--name NAME] [--iteration NAME] [--jobs 2]

Defaults:
  languages: ${DEFAULT_LANGUAGES.join(",")}
  limit: ${DEFAULT_LIMIT}
  since: ${DEFAULT_SINCE}
  jobs: ${DEFAULT_JOBS}
`;

export const parseArgs = (argv) => {
	const options = new Map();
	const positionals = [];

	for (let index = 0; index < argv.length; index++) {
		const arg = argv[index];
		if (!arg.startsWith("--")) {
			positionals.push(arg);
			continue;
		}

		const eqIndex = arg.indexOf("=");
		if (eqIndex !== -1) {
			options.set(arg.slice(0, eqIndex), arg.slice(eqIndex + 1));
			continue;
		}

		const next = argv[index + 1];
		if (next && !next.startsWith("--")) {
			options.set(arg, next);
			index++;
			continue;
		}

		options.set(arg, true);
	}

	return {
		command: positionals[0] ?? "help",
		options,
	};
};

export const optionValue = (options, name, fallback) => {
	if (!options.has(name)) return fallback;
	return options.get(name);
};

export const parseList = (value, fallback) => {
	if (!value) return [...fallback];
	return String(value)
		.split(",")
		.map((item) => item.trim().toLowerCase())
		.filter(Boolean);
};

export const parseInteger = (value, fallback, name) => {
	if (value === undefined || value === true) return fallback;
	const parsed = Number.parseInt(String(value), 10);
	if (!Number.isFinite(parsed) || parsed <= 0) {
		throw new Error(`Expected ${name} to be a positive integer, got: ${value}`);
	}
	return parsed;
};
