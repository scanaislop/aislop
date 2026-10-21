// A reader that closes early (`aislop scan | head`, `jq` exiting on bad input,
// an agent hook that stops reading) makes every later write fail with EPIPE.
// That is not a failure of aislop: drop the remaining output and let the
// command finish, so the exit code still reflects the scan result.

const isBrokenPipeError = (error: unknown): boolean =>
	typeof error === "object" && error !== null && (error as { code?: unknown }).code === "EPIPE";

const silenceStream = (stream: NodeJS.WriteStream): void => {
	stream.on("error", (error) => {
		if (!isBrokenPipeError(error)) throw error;
		stream.write = (() => true) as typeof stream.write;
	});
};

export const ignoreBrokenPipes = (): void => {
	silenceStream(process.stdout);
	silenceStream(process.stderr);
};
