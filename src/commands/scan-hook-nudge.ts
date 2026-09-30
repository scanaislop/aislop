interface HookNudgeContext {
	installedAgentCount: number;
	isTty: boolean;
	isCi: boolean;
	invocation: string;
}

export const shouldShowHookNudge = (ctx: HookNudgeContext): boolean =>
	ctx.isTty && !ctx.isCi && ctx.installedAgentCount === 0;

export const buildHookNudge = (ctx: HookNudgeContext): string | null => {
	if (!shouldShowHookNudge(ctx)) return null;
	return [
		"",
		"Next: install the per-edit hook so your coding agent fixes slop before it lands.",
		ctx.invocation === "aislop"
			? "  aislop hook install"
			: "  npm install -g aislop && aislop hook install",
		"",
	].join("\n");
};
