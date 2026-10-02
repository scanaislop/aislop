import { afterEach, describe, expect, it } from "vitest";
import { detectInvocation } from "../../src/ui/invocation.js";

describe("detectInvocation", () => {
	const originalArgv1 = process.argv[1];

	afterEach(() => {
		process.argv[1] = originalArgv1 as string;
	});

	it("suggests the npx form when running from the npx cache", () => {
		process.argv[1] = "/Users/me/.npm/_npx/6a1b2c/node_modules/aislop/dist/cli.js";
		expect(detectInvocation()).toBe("npx aislop@latest");
	});

	it("suggests the bare binary for a global or local install", () => {
		process.argv[1] = "/usr/local/lib/node_modules/aislop/dist/cli.js";
		expect(detectInvocation()).toBe("aislop");
	});
});
