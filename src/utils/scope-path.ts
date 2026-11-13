import os from "node:os";

const WINDOWS_NAMESPACE = /^\/\/\?\/(?:UNC\/)?/i;
const WINDOWS_ABSOLUTE = /^[a-zA-Z]:\//;
const WINDOWS_HOME = /^[a-zA-Z]:\/Users\/[^/]+/i;
const POSIX_HOME = /^\/(?:home|Users)\/[^/]+/;

export const normalizeScopePath = (filePath: string): string =>
	filePath.replace(/\\/g, "/").replace(/^\.\//, "");

const stripNamespace = (filePath: string): string => {
	const normalized = normalizeScopePath(filePath);
	if (!WINDOWS_NAMESPACE.test(normalized)) return normalized;
	return normalized.replace(/^\/\/\?\/UNC\//i, "//").replace(/^\/\/\?\//, "");
};

const looksWindows = (filePath: string): boolean => WINDOWS_ABSOLUTE.test(filePath);

const comparable = (filePath: string): string =>
	looksWindows(filePath) ? filePath.toLowerCase() : filePath;

const addHome = (homes: Set<string>, value: string | undefined): void => {
	if (!value) return;
	const cleaned = stripNamespace(value).replace(/\/+$/, "");
	if (cleaned.length > 1) homes.add(cleaned);
};

const homePrefixes = (filePath: string, homeDirectory: string | undefined): string[] => {
	const homes = new Set<string>();
	addHome(homes, homeDirectory);
	addHome(homes, WINDOWS_HOME.exec(filePath)?.[0]);
	addHome(homes, POSIX_HOME.exec(filePath)?.[0]);
	return [...homes].sort((left, right) => right.length - left.length);
};

export const redactHomeDirectory = (
	filePath: string,
	homeDirectory: string = os.homedir(),
): string => {
	const normalized = stripNamespace(filePath);
	const pathKey = comparable(normalized);
	for (const home of homePrefixes(normalized, homeDirectory)) {
		const homeKey = comparable(home);
		if (pathKey === homeKey) return "~";
		if (!pathKey.startsWith(`${homeKey}/`)) continue;
		const rest = normalized.slice(home.length).replace(/^\//, "");
		return rest.length === 0 ? "~" : `~/${rest}`;
	}
	return normalized;
};

const HOME_TEXT = /(?:[A-Za-z]:[\\/]Users[\\/][^\\/\s]+|\/(?:home|Users)\/[^/\s]+)(?=[\\/]|$)/g;

export const redactHomeInText = (text: string, homeDirectory: string = os.homedir()): string => {
	let redacted = text;
	const homes = [homeDirectory, normalizeScopePath(homeDirectory)]
		.filter((home, index, all) => home.length > 1 && all.indexOf(home) === index)
		.sort((left, right) => right.length - left.length);
	for (const home of homes) redacted = redacted.split(home).join("~");
	return redacted.replace(HOME_TEXT, "~");
};

const isAbsoluteScopePath = (filePath: string): boolean => {
	const normalized = normalizeScopePath(filePath);
	return normalized.startsWith("/") || WINDOWS_ABSOLUTE.test(normalized);
};

export const displayScopePath = (filePath: string, homeDirectory?: string): string => {
	const normalized = normalizeScopePath(filePath);
	if (!isAbsoluteScopePath(normalized)) return normalized;
	return redactHomeDirectory(normalized, homeDirectory);
};
