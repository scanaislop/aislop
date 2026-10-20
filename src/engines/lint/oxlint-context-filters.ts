import fs from "node:fs";
import path from "node:path";
import { maskComments, maskStringsAndComments } from "../../utils/source-masker.js";

const AMBIENT_GLOBAL_DEPS = ["unplugin-icons", "@types/bun", "bun-types"] as const;
type AmbientSource = (typeof AMBIENT_GLOBAL_DEPS)[number];

const SST_PLATFORM_REF_RE =
	/\/\/\/\s*<reference\s+path=["'][^"']*sst[\\/]+platform[\\/]+config\.d\.ts["']/;
const ICON_AUTOIMPORT_RE = /^Icon[A-Z]/;
const NO_UNDEF_IDENT_RE = /^['‘"`]([^'’"`]+)['’"`]/;
const SUPABASE_FUNCTION_PATH_RE = /(?:^|\/)supabase\/functions\/[^/]+\/.+\.[cm]?[jt]sx?$/;

export const detectAmbientSources = (rootDir: string): Set<AmbientSource> => {
	const found = new Set<AmbientSource>();
	const skipDirs = new Set([
		"node_modules",
		".git",
		"dist",
		"build",
		"out",
		"target",
		"coverage",
		".next",
		".turbo",
	]);
	const walk = (dir: string, depth: number): void => {
		if (depth > 4 || found.size === AMBIENT_GLOBAL_DEPS.length) return;
		let entries: import("node:fs").Dirent[];
		try {
			entries = fs.readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}
		for (const entry of entries) {
			if (found.size === AMBIENT_GLOBAL_DEPS.length) return;
			if (entry.name.startsWith(".") && entry.name !== ".github") continue;
			if (skipDirs.has(entry.name)) continue;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full, depth + 1);
			} else if (entry.name === "package.json") {
				try {
					const pkg = JSON.parse(fs.readFileSync(full, "utf-8")) as Record<string, unknown>;
					const allDeps = {
						...((pkg.dependencies ?? {}) as Record<string, unknown>),
						...((pkg.devDependencies ?? {}) as Record<string, unknown>),
						...((pkg.peerDependencies ?? {}) as Record<string, unknown>),
					};
					for (const dep of AMBIENT_GLOBAL_DEPS) {
						if (dep in allDeps) found.add(dep);
					}
				} catch {
					// ignore malformed manifests
				}
			}
		}
	};
	walk(rootDir, 0);
	return found;
};

const extractNoUndefIdentifier = (message: string): string | null => {
	const match = NO_UNDEF_IDENT_RE.exec(message);
	return match?.[1] ?? null;
};

const looksLikeChromeExtensionManifest = (filePath: string): boolean => {
	try {
		const manifest = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
		return (
			typeof manifest.manifest_version === "number" &&
			("background" in manifest || "content_scripts" in manifest || "permissions" in manifest)
		);
	} catch {
		return false;
	}
};

const chromeExtensionFileCache = new Map<string, boolean>();

const isChromeExtensionFile = (rootDir: string, relativeFilePath: string): boolean => {
	const normalized = relativeFilePath.split(path.sep).join("/");
	const cacheKey = `${rootDir}:${normalized}`;
	const cached = chromeExtensionFileCache.get(cacheKey);
	if (cached !== undefined) return cached;

	const absolute = path.isAbsolute(relativeFilePath)
		? relativeFilePath
		: path.join(rootDir, relativeFilePath);
	const root = path.resolve(rootDir);
	let dir = path.dirname(path.resolve(absolute));
	let matched = false;

	while (true) {
		const relativeToRoot = path.relative(root, dir);
		if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) break;
		if (looksLikeChromeExtensionManifest(path.join(dir, "manifest.json"))) {
			matched = true;
			break;
		}
		if (dir === root) break;
		dir = path.dirname(dir);
	}

	chromeExtensionFileCache.set(cacheKey, matched);
	return matched;
};

export const isAmbientFalsePositive = (
	rule: string,
	message: string,
	sources: Set<AmbientSource>,
): boolean => {
	if (rule !== "eslint/no-undef") return false;
	const ident = extractNoUndefIdentifier(message);
	if (!ident) return false;
	if (sources.has("unplugin-icons") && ICON_AUTOIMPORT_RE.test(ident)) return true;
	if ((sources.has("@types/bun") || sources.has("bun-types")) && ident === "Bun") return true;
	return false;
};

export const isRuntimeGlobalFalsePositive = (
	rule: string,
	message: string,
	rootDir: string,
	relativeFilePath: string,
): boolean => {
	if (rule !== "eslint/no-undef") return false;
	const ident = extractNoUndefIdentifier(message);
	if (!ident) return false;
	const normalized = relativeFilePath.split(path.sep).join("/");
	if (ident === "Deno" && SUPABASE_FUNCTION_PATH_RE.test(normalized)) return true;
	if (ident === "chrome" && isChromeExtensionFile(rootDir, relativeFilePath)) return true;
	return false;
};

const GLOBAL_DIRECTIVE_RE = /\/\*\s*globals?\s+([^*]*?)\*\//g;
const globalDirectiveCache = new Map<string, Set<string>>();
const sstReferencedFiles = new Map<string, boolean>();

export const clearSstReferenceCache = (): void => {
	sstReferencedFiles.clear();
	globalDirectiveCache.clear();
	chromeExtensionFileCache.clear();
};

export const fileReferencesSstPlatform = (rootDir: string, relativeFilePath: string): boolean => {
	const cached = sstReferencedFiles.get(relativeFilePath);
	if (cached !== undefined) return cached;
	const absolute = path.isAbsolute(relativeFilePath)
		? relativeFilePath
		: path.join(rootDir, relativeFilePath);
	let referenced = false;
	try {
		const fd = fs.openSync(absolute, "r");
		try {
			const buf = Buffer.alloc(512);
			const bytesRead = fs.readSync(fd, buf, 0, 512, 0);
			referenced = SST_PLATFORM_REF_RE.test(buf.toString("utf-8", 0, bytesRead));
		} finally {
			fs.closeSync(fd);
		}
	} catch {
		referenced = false;
	}
	sstReferencedFiles.set(relativeFilePath, referenced);
	return referenced;
};

// Blank string, template and regex bodies but keep comments, so directive text quoted in code is not read as a directive.
const maskLiteralsOnly = (content: string, ext: string): string => {
	const commentsMasked = maskComments(content, ext);
	const allMasked = maskStringsAndComments(content, ext);
	const out = content.split("");
	for (let k = 0; k < out.length; k++) {
		if (commentsMasked[k] === content[k]) out[k] = allMasked[k];
	}
	return out.join("");
};

const readDeclaredGlobals = (absolutePath: string): Set<string> => {
	const cached = globalDirectiveCache.get(absolutePath);
	if (cached) return cached;
	const names = new Set<string>();
	try {
		const raw = fs.readFileSync(absolutePath, "utf-8");
		const content = maskLiteralsOnly(raw, path.extname(absolutePath).toLowerCase());
		for (const match of content.matchAll(GLOBAL_DIRECTIVE_RE)) {
			for (const entry of match[1].split(",")) {
				for (const token of entry
					.replace(/\s*:\s*/g, ":")
					.trim()
					.split(/\s+/)) {
					const [name, value] = token.split(":");
					// ESLint treats NAME:off as undeclared.
					if (name && value?.trim() !== "off") names.add(name);
				}
			}
		}
	} catch {
		// unreadable file: leave the finding in place
	}
	globalDirectiveCache.set(absolutePath, names);
	return names;
};

// ESLint honours global-directive block comments; oxlint does not, so drop those findings.
export const isDeclaredGlobalFalsePositive = (
	rule: string,
	message: string,
	rootDir: string,
	filePath: string,
): boolean => {
	if (rule !== "eslint/no-undef") return false;
	const ident = extractNoUndefIdentifier(message);
	if (!ident) return false;
	const absolute = path.isAbsolute(filePath) ? filePath : path.join(rootDir, filePath);
	return readDeclaredGlobals(absolute).has(ident);
};
