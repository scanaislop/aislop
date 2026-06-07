import { describe, expect, it } from "vitest";
import { fmtElapsed, fmtFileList, fmtTokens } from "../../../src/ui/agent-tui/format.js";

describe("agent-tui format", () => {
	it("abbreviates tokens", () => {
		expect(fmtTokens(678_962)).toBe("679k");
		expect(fmtTokens(900)).toBe("900");
	});
	it("formats elapsed", () => {
		expect(fmtElapsed(64_000)).toBe("1m04s");
		expect(fmtElapsed(9_000)).toBe("9s");
	});
	it("summarizes a file list with overflow", () => {
		expect(fmtFileList(["a.ts", "b.ts", "c.ts"], 2)).toBe("a.ts, b.ts, +1 more");
		expect(fmtFileList(["a.ts"], 2)).toBe("a.ts");
	});
});
