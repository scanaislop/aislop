export function parseLintReport(
	tool: string,
	result: { stdout: string; exitCode: number | null },
): unknown {
	if (result.exitCode !== 0 && result.exitCode !== 1) {
		throw new Error(`${tool} failed (exit ${result.exitCode ?? "signal"})`);
	}
	try {
		return JSON.parse(result.stdout);
	} catch {
		throw new Error(`${tool} did not return a JSON report`);
	}
}
