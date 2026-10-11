import { cancel, confirm, intro, isCancel, multiselect, outro, select, text } from "@clack/prompts";

export { cancel, confirm, intro, isCancel, multiselect, outro, select, text };

export const runCancellable = async <T>(
	fn: () => Promise<T>,
): Promise<Exclude<T, symbol> | undefined> => {
	const value = await fn();
	if (isCancel(value)) return undefined;
	return value as Exclude<T, symbol>;
};
