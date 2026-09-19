import { S as __toESM, _ as BLOCK_ALIGN, c as registeredRules, d as PLACEHOLDER_REGEX, f as diagnostics, g as ACTIVE_SIZE, h as getNodeByRangeIndex, i as resetStateAfterError, l as allOptions, m as getLineColumnFromOffset, o as registerPlugin, p as replacePlaceholders, r as lintFileImpl, s as registeredPluginNames, t as buffers, u as setOptions, v as BLOCK_SIZE, x as __commonJSMin, y as BUFFER_SIZE } from "./lint.js";
import { a as rawTransferSupported$1, i as parseRawSync, n as getBufferOffset, t as applyFixes } from "./bindings.js";
import assert, { AssertionError } from "node:assert";
import { dirname, isAbsolute, join } from "node:path";
import util from "node:util";
//#endregion
//#region src-js/package/parse.ts
var import_json_stable_stringify_without_jsonify = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = function(obj, opts) {
		opts ||= {}, typeof opts == "function" && (opts = { cmp: opts });
		var space = opts.space || "";
		typeof space == "number" && (space = Array(space + 1).join(" "));
		var cycles = typeof opts.cycles == "boolean" && opts.cycles, replacer = opts.replacer || function(key, value) {
			return value;
		}, cmp = opts.cmp && (function(f) {
			return function(node) {
				return function(a, b) {
					return f({
						key: a,
						value: node[a]
					}, {
						key: b,
						value: node[b]
					});
				};
			};
		})(opts.cmp), seen = [];
		return (function stringify(parent, key, node, level) {
			var indent = space ? "\n" + Array(level + 1).join(space) : "", colonSeparator = space ? ": " : ":";
			if (node && node.toJSON && typeof node.toJSON == "function" && (node = node.toJSON()), node = replacer.call(parent, key, node), node !== void 0) {
				if (typeof node != "object" || !node) return JSON.stringify(node);
				if (isArray(node)) {
					for (var out = [], i = 0; i < node.length; i++) {
						var item = stringify(node, i, node[i], level + 1) || JSON.stringify(null);
						out.push(indent + space + item);
					}
					return "[" + out.join(",") + indent + "]";
				}
				if (seen.indexOf(node) !== -1) {
					if (cycles) return JSON.stringify("__cycle__");
					throw TypeError("Converting circular structure to JSON");
				}
				seen.push(node);
				for (var keys = objectKeys(node).sort(cmp && cmp(node)), out = [], i = 0; i < keys.length; i++) {
					var key = keys[i], value = stringify(node, key, node[key], level + 1);
					if (value) {
						var keyValue = JSON.stringify(key) + colonSeparator + value;
						out.push(indent + space + keyValue);
					}
				}
				return seen.splice(seen.indexOf(node), 1), "{" + out.join(",") + indent + "}";
			}
		})({ "": obj }, "", obj, 0);
	};
	var isArray = Array.isArray || function(x) {
		return {}.toString.call(x) === "[object Array]";
	}, objectKeys = Object.keys || function(obj) {
		var has = Object.prototype.hasOwnProperty || function() {
			return !0;
		}, keys = [];
		for (var key in obj) has.call(obj, key) && keys.push(key);
		return keys;
	};
})))(), 1);
const ARRAY_BUFFER_SIZE = BLOCK_SIZE + BLOCK_ALIGN, textEncoder = new TextEncoder();
let buffer = null, blockBuffer = null, rawTransferIsSupported = null;
/**
* Parser source text into buffer.
* @param path - Path of file to parse
* @param sourceText - Source text to parse
* @param options - Parsing options
* @throws {Error} If raw transfer is not supported on this platform, or parsing failed
*/
function parse(path, sourceText, options) {
	if (!rawTransferSupported()) throw Error("`RuleTester` is not supported on 32-bit or big-endian systems, versions of NodeJS prior to v22.0.0, versions of Deno prior to v2.0.0, or other runtimes");
	buffer === null && initBuffer();
	let maxSourceByteLen = sourceText.length * 3;
	if (maxSourceByteLen > 1073741824) throw Error("Source text is too long");
	let sourceStartPos = ACTIVE_SIZE - maxSourceByteLen, sourceBuffer = new Uint8Array(buffer.buffer, buffer.byteOffset + sourceStartPos, maxSourceByteLen), { read, written: sourceByteLen } = textEncoder.encodeInto(sourceText, sourceBuffer);
	if (read !== sourceText.length) throw Error("Failed to write source text into buffer");
	if (parseRawSync(path, blockBuffer, sourceStartPos, sourceByteLen, options), buffer.int32[536870890] === 0) throw Error("Parsing failed");
}
/**
* Create a `Uint8Array` which is 2 GiB in size, with its start aligned on 4 GiB.
*
* Store it in `buffer`, and also in `buffers` array, so it's accessible to `lintFileImpl` by passing `0`as `bufferId`.
*
* Achieve this by creating a 6 GiB `ArrayBuffer`, getting the offset within it that's aligned to 4 GiB,
* chopping off that number of bytes from the start, and shortening to 2 GiB.
*
* It's always possible to obtain a 2 GiB slice aligned on 4 GiB within a 6 GiB buffer,
* no matter how the 6 GiB buffer is aligned.
*
* `buffer` itself, and `int32` and `float64` views of `buffer`, are `BUFFER_SIZE` bytes,
* which excludes `FixedSizeAllocatorMetadata` and `ChunkFooter`.
* This ensures this critical data cannot be accidentally overwritten on JS side.
* `blockBuffer` is `BLOCK_SIZE` bytes, which includes `FixedSizeAllocatorMetadata` and `ChunkFooter`.
* `blockBuffer` is what we pass to Rust, which needs to write them.
*
* Note: On systems with virtual memory, this only consumes 6 GiB of *virtual* memory.
* It does not consume physical memory until data is actually written to the `Uint8Array`.
* Physical memory consumed corresponds to the quantity of data actually written.
*/
function initBuffer() {
	let arrayBuffer = new ArrayBuffer(ARRAY_BUFFER_SIZE), offset = getBufferOffset(new Uint8Array(arrayBuffer));
	buffer = new Uint8Array(arrayBuffer, offset, BUFFER_SIZE), buffer.int32 = new Int32Array(arrayBuffer, offset, BUFFER_SIZE / 4), buffer.float64 = new Float64Array(arrayBuffer, offset, BUFFER_SIZE / 8), blockBuffer = new Uint8Array(arrayBuffer, offset, BLOCK_SIZE), buffers.push(buffer);
}
/**
* Returns `true` if raw transfer is supported.
*
* Raw transfer is only supported on 64-bit little-endian systems,
* and NodeJS >= v22.0.0 or Deno >= v2.0.0.
*
* Versions of NodeJS prior to v22.0.0 do not support creating an `ArrayBuffer` larger than 4 GiB.
* Bun (as at v1.2.4) also does not support creating an `ArrayBuffer` larger than 4 GiB.
* Support on Deno v1 is unknown and it's EOL, so treating Deno before v2.0.0 as unsupported.
*
* No easy way to determining pointer width (64 bit or 32 bit) in JS,
* so call a function on Rust side to find out.
*
* @returns {boolean} - `true` if raw transfer is supported on this platform
*/
function rawTransferSupported() {
	return rawTransferIsSupported === null && (rawTransferIsSupported = rawTransferRuntimeSupported() && rawTransferSupported$1()), rawTransferIsSupported;
}
function rawTransferRuntimeSupported() {
	let global;
	try {
		global = globalThis;
	} catch {
		return !1;
	}
	if (global.Bun || global.process?.versions?.bun) return !1;
	if (global.Deno) {
		let match = Deno.version?.deno?.match(/^(\d+)\./);
		return !!match && +match[1] >= 2;
	}
	if (global.process?.release?.name !== "node") return !1;
	let match = process.version?.match(/^v(\d+)\./);
	return !!match && +match[1] >= 22;
}
//#endregion
//#region src-js/package/rule_tester.ts
const ObjectKeys = Object.keys, ObjectValues = Object.values, ObjectHasOwn = Object.hasOwn, JSONStringify = JSON.stringify, ArrayFrom = Array.from, ObjectEntries = Object.entries, ObjectDefineProperty = Object.defineProperty, ArrayIsArray = Array.isArray;
/**
* Default `describe` function, if `describe` doesn't exist as a global.
* @param text - Description of the test case
* @param method - Test case logic
* @returns Returned value of `method`
*/
function defaultDescribe(text, method) {
	return method.call(this);
}
const globalObj = globalThis;
let describe = typeof globalObj.describe == "function" ? globalObj.describe : defaultDescribe;
/**
* Default `it` function, if `it` doesn't exist as a global.
* @param text - Description of the test case
* @param method - Test case logic
* @throws {Error} Any error upon execution of `method`
* @returns Returned value of `method`
*/
function defaultIt(text, method) {
	try {
		return method.call(this);
	} catch (err) {
		throw err instanceof AssertionError && (err.message += ` (${util.inspect(err.actual)} ${err.operator} ${util.inspect(err.expected)})`), err;
	}
}
let it = typeof globalObj.it == "function" ? globalObj.it : defaultIt, itOnly = it !== defaultIt && typeof it.only == "function" ? it.only.bind(it) : null;
/**
* Get `it` function.
* @param only - `true` if `it.only` should be used
* @throws {Error} If `it.only` is not available
* @returns `it` or `it.only` function
*/
function getIt(only) {
	return only ? getItOnly() : it;
}
/**
* Get `it.only` function.
* @throws {Error} If `it.only` is not available
* @returns `it.only` function
*/
function getItOnly() {
	if (itOnly === null) throw Error("To use `only`, use `RuleTester` with a test framework that provides `it.only()` like Mocha, or provide a custom `it.only` function by assigning it to `RuleTester.itOnly`");
	return itOnly;
}
const EMPTY_LANGUAGE_OPTIONS = {};
let sharedConfig = {};
const TEST_CASE_PROP_KEYS = /* @__PURE__ */ new Set([
	"code",
	"name",
	"only",
	"filename",
	"options",
	"settings",
	"before",
	"after",
	"output",
	"errors",
	"__proto__"
]), DEFAULT_CWD = dirname(import.meta.dirname);
/**
* Utility class for testing rules.
*/
var RuleTester = class {
	#config;
	/**
	* Creates a new instance of RuleTester.
	* @param config? - Extra configuration for the tester (optional)
	*/
	constructor(config) {
		if (config === void 0) config = null;
		else if (config !== null && typeof config != "object") throw TypeError("`config` must be an object if provided");
		this.#config = config;
	}
	/**
	* Set the configuration to use for all future tests.
	* @param config - The configuration to use
	* @throws {TypeError} If `config` is not an object
	*/
	static setDefaultConfig(config) {
		if (typeof config != "object" || !config) throw TypeError("`config` must be an object");
		sharedConfig = config;
	}
	/**
	* Get the current configuration used for all tests.
	* @returns The current configuration
	*/
	static getDefaultConfig() {
		return sharedConfig;
	}
	/**
	* Reset the configuration to the initial configuration of the tester removing
	* any changes made until now.
	* @returns {void}
	*/
	static resetDefaultConfig() {
		sharedConfig = {};
	}
	static get describe() {
		return describe;
	}
	static set describe(value) {
		describe = value;
	}
	static get it() {
		return it;
	}
	static set it(value) {
		it = value, itOnly = typeof it.only == "function" ? it.only.bind(it) : null;
	}
	static get itOnly() {
		return getItOnly();
	}
	static set itOnly(value) {
		itOnly = value;
	}
	/**
	* Add the `only` property to a test to run it in isolation.
	* @param item - A single test to run by itself
	* @returns The test with `only` set
	*/
	static only(item) {
		return typeof item == "string" ? {
			code: item,
			only: !0
		} : {
			...item,
			only: !0
		};
	}
	/**
	* Adds a new rule test to execute.
	* @param ruleName - Name of the rule to run
	* @param rule - Rule to test
	* @param tests - Collection of tests to run
	* @throws {TypeError|Error} If `rule` is not an object with a `create` method,
	*   or if non-object `test`, or if a required scenario of the given type is missing
	*/
	run(ruleName, rule, tests) {
		let plugin = {
			meta: { name: "rule-to-test" },
			rules: { [ruleName]: rule }
		}, config = createConfigForRun(this.#config);
		describe(ruleName, () => {
			tests.valid.length > 0 && describe("valid", () => {
				let seenTestCases = /* @__PURE__ */ new Set();
				for (let test of tests.valid) typeof test == "string" && (test = { code: test }), getIt(test.only)(getTestName(test), () => {
					runValidTestCase(test, plugin, config, seenTestCases);
				});
			}), tests.invalid.length > 0 && describe("invalid", () => {
				let seenTestCases = /* @__PURE__ */ new Set();
				for (let test of tests.invalid) getIt(test.only)(getTestName(test), () => {
					runInvalidTestCase(test, plugin, config, seenTestCases);
				});
			});
		});
	}
};
/**
* Run valid test case.
* @param test - Valid test case
* @param plugin - Plugin containing rule being tested
* @param config - Config from `RuleTester` instance
* @param seenTestCases - Set of serialized test cases to check for duplicates
* @throws {AssertionError} If the test case fails
*/
function runValidTestCase(test, plugin, config, seenTestCases) {
	try {
		runBeforeHook(test), assertValidTestCaseIsWellFormed(test, seenTestCases), assertValidTestCasePasses(test, plugin, config);
	} finally {
		runAfterHook(test);
	}
}
/**
* Assert that valid test case passes.
* @param test - Valid test case
* @param plugin - Plugin containing rule being tested
* @param config - Config from `RuleTester` instance
* @throws {AssertionError} If the test case fails
*/
function assertValidTestCasePasses(test, plugin, config) {
	test = mergeConfigIntoTestCase(test, config), assertErrorCountIsCorrect(lint(test, plugin), 0);
}
/**
* Run invalid test case.
* @param test - Invalid test case
* @param plugin - Plugin containing rule being tested
* @param config - Config from `RuleTester` instance
* @param seenTestCases - Set of serialized test cases to check for duplicates
* @throws {AssertionError} If the test case fails
*/
function runInvalidTestCase(test, plugin, config, seenTestCases) {
	let ruleName = ObjectKeys(plugin.rules)[0];
	try {
		runBeforeHook(test), assertInvalidTestCaseIsWellFormed(test, seenTestCases, ruleName), assertInvalidTestCasePasses(test, plugin, config);
	} finally {
		runAfterHook(test);
	}
}
/**
* Assert that invalid test case passes.
* @param test - Invalid test case
* @param plugin - Plugin containing rule being tested
* @param config - Config from `RuleTester` instance
* @throws {AssertionError} If the test case fails
*/
function assertInvalidTestCasePasses(test, plugin, config) {
	test = mergeConfigIntoTestCase(test, config);
	let diagnostics = lint(test, plugin), { errors } = test;
	if (typeof errors == "number") assertErrorCountIsCorrect(diagnostics, errors);
	else {
		assertErrorCountIsCorrect(diagnostics, errors.length), diagnostics.sort((diag1, diag2) => diag1.line - diag2.line || diag1.column - diag2.column);
		let messages = ObjectValues(plugin.rules)[0].meta?.messages ?? null;
		for (let errorIndex = 0; errorIndex < errors.length; errorIndex++) {
			let error = errors[errorIndex], diagnostic = diagnostics[errorIndex];
			typeof error == "string" || error instanceof RegExp ? (assertMessageMatches(diagnostic.message, error), assert(diagnostic.suggestions === null, `Error at index ${errorIndex} has suggestions. Please convert the test error into an object and specify \`suggestions\` property on it to test suggestions`)) : (assertInvalidTestCaseMessageIsCorrect(diagnostic, error, messages), assertInvalidTestCaseLocationIsCorrect(diagnostic, error, test), ObjectHasOwn(error, "suggestions") && (error.suggestions == null ? assert(diagnostic.suggestions === null, "Rule produced suggestions") : assertSuggestionsAreCorrect(diagnostic, error, messages, test)));
		}
	}
	let { code } = test, fixedCode = runFixes(diagnostics, code);
	fixedCode === null && (fixedCode = code);
	let { recursive } = test, extraPassCount = typeof recursive == "number" ? recursive : recursive === !0 ? 10 : 0;
	if (extraPassCount > 0 && fixedCode !== code) for (let pass = 0; pass < extraPassCount; pass++) {
		let newFixedCode = runFixes(lint({
			...test,
			code: fixedCode
		}, plugin), fixedCode);
		if (newFixedCode === null) break;
		fixedCode = newFixedCode;
	}
	if (ObjectHasOwn(test, "output")) {
		let expectedOutput = test.output;
		expectedOutput === null ? assert.strictEqual(fixedCode, code, "Expected no autofixes to be suggested") : (assert.strictEqual(fixedCode, expectedOutput, "Output is incorrect"), assert.notStrictEqual(code, expectedOutput, "Test property `output` matches `code`. If no autofix is expected, set output to `null`."));
	} else assert.strictEqual(fixedCode, code, "The rule fixed the code. Please add `output` property.");
}
/**
* Run fixes on code and return fixed code.
* If no fixes to apply, returns `null`.
*
* @param diagnostics - Array of `Diagnostic`s returned by `lint`
* @param code - Code to run fixes on
* @returns Fixed code, or `null` if no fixes to apply
* @throws {Error} If error when applying fixes
*/
function runFixes(diagnostics, code) {
	let fixGroups = [];
	for (let diagnostic of diagnostics) diagnostic.fixes !== null && fixGroups.push(diagnostic.fixes);
	if (fixGroups.length === 0) return null;
	let fixedCode = applyFixes(code, JSONStringify(fixGroups));
	if (fixedCode === null) throw Error("Failed to apply fixes");
	return fixedCode;
}
/**
* Assert that message reported by rule under test matches the expected message.
* @param diagnostic - Diagnostic emitted by rule under test
* @param error - Error object from test case
* @param messages - Messages from rule under test
* @throws {AssertionError} If `message` / `messageId` is not correct
*/
function assertInvalidTestCaseMessageIsCorrect(diagnostic, error, messages) {
	if (ObjectHasOwn(error, "message")) {
		assert(!ObjectHasOwn(error, "messageId"), "Error should not specify both `message` and a `messageId`"), assert(!ObjectHasOwn(error, "data"), "Error should not specify both `data` and `message`"), assertMessageMatches(diagnostic.message, error.message);
		return;
	}
	assert(ObjectHasOwn(error, "messageId"), "Test error must specify either a `messageId` or `message`"), assertMessageIdIsCorrect(diagnostic.messageId, diagnostic.message, error.messageId, error.data, messages, "");
}
/**
* Assert that a `messageId` used by the rule under test is correct, and validate `data` (if provided).
*
* @param reportedMessageId - `messageId` from the diagnostic or suggestion
* @param reportedMessage - Message from the diagnostic or suggestion
* @param messageId - Expected `messageId` from the test case
* @param data - Data from the test case (if provided)
* @param messages - Messages from the rule under test
* @param prefix - Prefix for assertion error messages (e.g. "" or "Suggestion at index 0: ")
* @throws {AssertionError} If messageId is not correct
* @throws {AssertionError} If message tenplate with placeholder data inserted does not match reported message
*/
function assertMessageIdIsCorrect(reportedMessageId, reportedMessage, messageId, data, messages, prefix) {
	if (assert(messages !== null, `${prefix}Cannot use 'messageId' if rule under test doesn't define 'meta.messages'`), !ObjectHasOwn(messages, messageId)) {
		let legalMessageIds = `[${ObjectKeys(messages).map((key) => `'${key}'`).join(", ")}]`;
		assert.fail(`${prefix}Invalid messageId '${messageId}'. Expected one of ${legalMessageIds}.`);
	}
	assert.strictEqual(reportedMessageId, messageId, `${prefix}messageId '${reportedMessageId}' does not match expected messageId '${messageId}'`);
	let ruleMessage = messages[messageId], unsubstitutedPlaceholders = getUnsubstitutedMessagePlaceholders(reportedMessage, ruleMessage, data);
	if (unsubstitutedPlaceholders.length !== 0 && assert.fail(`${prefix}The reported message has ` + (unsubstitutedPlaceholders.length > 1 ? `unsubstituted placeholders: ${unsubstitutedPlaceholders.map((name) => `'${name}'`).join(", ")}` : `an unsubstituted placeholder '${unsubstitutedPlaceholders[0]}'`) + `. Please provide the missing ${unsubstitutedPlaceholders.length > 1 ? "values" : "value"} via the \`data\` property.`), data !== void 0) {
		let rehydratedMessage = replacePlaceholders(ruleMessage, data);
		assert.strictEqual(reportedMessage, rehydratedMessage, `${prefix}Hydrated message "${rehydratedMessage}" does not match "${reportedMessage}"`);
	}
}
/**
* Assert that location reported by rule under test matches the expected location.
* @param diagnostic - Diagnostic emitted by rule under test
* @param error - Error object from test case
* @param config - Config for this test case
* @throws {AssertionError} If diagnostic's location does not match expected location
*/
function assertInvalidTestCaseLocationIsCorrect(diagnostic, error, test) {
	let actualLocation = {}, expectedLocation = {}, columnOffset = +(test.eslintCompat === !0);
	ObjectHasOwn(error, "line") && (actualLocation.line = diagnostic.line, expectedLocation.line = error.line), ObjectHasOwn(error, "column") && (actualLocation.column = diagnostic.column + columnOffset, expectedLocation.column = error.column);
	let canVoidEndLocation = test.eslintCompat === !0 && diagnostic.endLine === diagnostic.line && diagnostic.endColumn === diagnostic.column;
	ObjectHasOwn(error, "endLine") && (actualLocation.endLine = error.endLine === void 0 && canVoidEndLocation ? void 0 : diagnostic.endLine, expectedLocation.endLine = error.endLine), ObjectHasOwn(error, "endColumn") && (actualLocation.endColumn = error.endColumn === void 0 && canVoidEndLocation ? void 0 : diagnostic.endColumn + columnOffset, expectedLocation.endColumn = error.endColumn), ObjectKeys(expectedLocation).length > 0 && assert.deepStrictEqual(actualLocation, expectedLocation, "Actual error location does not match expected error location.");
}
/**
* Assert that suggestions reported by the rule under test match expected suggestions.
* @param diagnostic - Diagnostic emitted by the rule under test
* @param error - Error object from the test case
* @param messages - Messages from the rule under test
* @param test - Test case
* @throws {AssertionError} If suggestions do not match
*/
function assertSuggestionsAreCorrect(diagnostic, error, messages, test) {
	let actualSuggestions = diagnostic.suggestions ?? [], expectedSuggestions = error.suggestions;
	assert.strictEqual(actualSuggestions.length, expectedSuggestions.length, `Error should have ${expectedSuggestions.length} suggestion${expectedSuggestions.length > 1 ? "s" : ""}. Instead found ${actualSuggestions.length} suggestion${actualSuggestions.length > 1 ? "s" : ""}.`);
	for (let i = 0; i < expectedSuggestions.length; i++) {
		let actual = actualSuggestions[i], expected = expectedSuggestions[i], prefix = `Suggestion at index ${i}`;
		assertSuggestionMessageIsCorrect(actual, expected, messages, prefix), assert(ObjectHasOwn(expected, "output"), `${prefix}: \`output\` property is required`);
		let suggestedCode = applyFixes(test.code, JSONStringify([actual.fixes]));
		assert(suggestedCode !== null, `${prefix}: Failed to apply suggestion fix`), assert.strictEqual(suggestedCode, expected.output, `${prefix}: Expected the applied suggestion fix to match the test suggestion output`), assert.notStrictEqual(expected.output, test.code, `${prefix}: The output of a suggestion should differ from the original source code`);
	}
}
/**
* Assert that a suggestion's message matches expectations.
* @param actual - Actual suggestion from the diagnostic
* @param expected - Expected suggestion from the test case
* @param messages - Messages from the rule under test
* @param prefix - Prefix for assertion error messages
* @throws {AssertionError} If suggestion message does not match
*/
function assertSuggestionMessageIsCorrect(actual, expected, messages, prefix) {
	if (ObjectHasOwn(expected, "desc")) {
		assert(!ObjectHasOwn(expected, "messageId"), `${prefix}: Test should not specify both \`desc\` and \`messageId\``), assert(!ObjectHasOwn(expected, "data"), `${prefix}: Test should not specify both \`desc\` and \`data\``), assert.strictEqual(actual.message, expected.desc, `${prefix}: \`desc\` should be "${expected.desc}" but got "${actual.message}" instead`);
		return;
	}
	if (ObjectHasOwn(expected, "messageId")) {
		assertMessageIdIsCorrect(actual.messageId, actual.message, expected.messageId, expected.data, messages, `${prefix}: `);
		return;
	}
	ObjectHasOwn(expected, "data") && assert.fail(`${prefix}: Test must specify \`messageId\` if \`data\` is used`), assert.fail(`${prefix}: Test must specify either \`messageId\` or \`desc\``);
}
/**
* Assert that the number of errors reported for test case is as expected.
* @param diagnostics - Diagnostics reported by the rule under test
* @param expectedErrorCount - Expected number of diagnistics
* @throws {AssertionError} If the number of diagnostics is not as expected
*/
function assertErrorCountIsCorrect(diagnostics, expectedErrorCount) {
	diagnostics.length !== expectedErrorCount && assert.strictEqual(diagnostics.length, expectedErrorCount, util.format("Should have %s error%s but had %d: %s", expectedErrorCount === 0 ? "no" : expectedErrorCount, expectedErrorCount === 1 ? "" : "s", diagnostics.length, util.inspect(diagnostics)));
}
/**
* Assert that message is matched by matcher.
* Matcher can be a string or a regular expression.
* @param message - Message
* @param matcher - Matcher
* @throws {AssertionError} If message does not match
*/
function assertMessageMatches(message, matcher) {
	typeof matcher == "string" ? assert.strictEqual(message, matcher) : assert(matcher.test(message), `Expected '${message}' to match ${matcher}`);
}
/**
* Get placeholders in the reported messages but only includes the placeholders available in the raw message
* and not in the provided data.
* @param message - Reported message
* @param raw - Raw message specified in the rule's `meta.messages`
* @param data - Data from the test case's error object
* @returns Missing placeholder names
*/
function getUnsubstitutedMessagePlaceholders(message, raw, data) {
	let unsubstituted = getMessagePlaceholders(message);
	if (unsubstituted.length === 0) return [];
	let known = getMessagePlaceholders(raw), provided = data === void 0 ? [] : ObjectKeys(data);
	return unsubstituted.filter((name) => known.includes(name) && !provided.includes(name));
}
/**
* Extract names of `{{ name }}` placeholders from a message.
* @param message - Message
* @returns Array of placeholder names
*/
function getMessagePlaceholders(message) {
	return ArrayFrom(message.matchAll(PLACEHOLDER_REGEX), ([, name]) => name.trim());
}
/**
* Create config for a test run.
* Merges config from `RuleTester` instance on top of shared config.
* Removes properties which are not allowed in `Config`s, as they can only be properties of `TestCase`.
*
* @param config - Config from `RuleTester` instance
* @returns Merged config
*/
function createConfigForRun(config) {
	let merged = {};
	return addConfigPropsFrom(sharedConfig, merged), config !== null && addConfigPropsFrom(config, merged), merged;
}
function addConfigPropsFrom(config, merged) {
	for (let key of ObjectKeys(config)) TEST_CASE_PROP_KEYS.has(key) || (key === "languageOptions" ? merged.languageOptions = mergeLanguageOptions(config.languageOptions, merged.languageOptions) : merged[key] = config[key]);
}
/**
* Create config for a test case.
* Merges properties of test case on top of config from `RuleTester` instance.
*
* @param test - Test case
* @param config - Config from `RuleTester` instance / shared config
* @returns Merged config
*/
function mergeConfigIntoTestCase(test, config) {
	return {
		...config,
		...test,
		languageOptions: mergeLanguageOptions(test.languageOptions, config.languageOptions)
	};
}
/**
* Merge language options from test case / config onto language options from base config.
* @param localLanguageOptions - Language options from test case / config
* @param baseLanguageOptions - Language options from base config
* @returns Merged language options, or `undefined` if neither has language options
*/
function mergeLanguageOptions(localLanguageOptions, baseLanguageOptions) {
	return localLanguageOptions == null ? baseLanguageOptions ?? void 0 : baseLanguageOptions == null ? localLanguageOptions : {
		...baseLanguageOptions,
		...localLanguageOptions,
		parserOptions: mergeParserOptions(localLanguageOptions.parserOptions, baseLanguageOptions.parserOptions),
		globals: mergeGlobals(localLanguageOptions.globals, baseLanguageOptions.globals)
	};
}
/**
* Merge parser options from test case / config onto language options from base config.
* @param localParserOptions - Parser options from test case / config
* @param baseParserOptions - Parser options from base config
* @returns Merged parser options, or `undefined` if neither has parser options
*/
function mergeParserOptions(localParserOptions, baseParserOptions) {
	return localParserOptions == null ? baseParserOptions ?? void 0 : baseParserOptions == null ? localParserOptions : {
		...baseParserOptions,
		...localParserOptions,
		ecmaFeatures: mergeEcmaFeatures(localParserOptions.ecmaFeatures, baseParserOptions.ecmaFeatures)
	};
}
/**
* Merge ecma features from test case / config onto ecma features from base config.
* @param localEcmaFeatures - Ecma features from test case / config
* @param baseEcmaFeatures - Ecma features from base config
* @returns Merged ecma features, or `undefined` if neither has ecma features
*/
function mergeEcmaFeatures(localEcmaFeatures, baseEcmaFeatures) {
	return localEcmaFeatures == null ? baseEcmaFeatures ?? void 0 : baseEcmaFeatures == null ? localEcmaFeatures : {
		...baseEcmaFeatures,
		...localEcmaFeatures
	};
}
/**
* Merge globals from test case / config onto globals from base config.
* @param localGlobals - Globals from test case / config
* @param baseGlobals - Globals from base config
* @returns Merged globals
*/
function mergeGlobals(localGlobals, baseGlobals) {
	return localGlobals == null ? baseGlobals ?? void 0 : baseGlobals == null ? localGlobals : {
		...baseGlobals,
		...localGlobals
	};
}
/**
* Lint a test case.
* @param test - Test case
* @param plugin - Plugin containing rule being tested
* @returns Array of diagnostics
*/
function lint(test, plugin) {
	let parseOptions = getParseOptions(test), path, { filename, cwd } = test;
	if (filename != null && isAbsolute(filename)) cwd ??= dirname(filename), path = filename;
	else {
		if (filename == null) {
			let ext = parseOptions.lang;
			ext == null ? ext = "js" : ext === "dts" && (ext = "d.ts"), filename = `file.${ext}`;
		}
		cwd ??= DEFAULT_CWD, path = join(cwd, filename);
	}
	try {
		registerPlugin(plugin, null, !1, null);
		let optionsId = setupOptions(test, cwd);
		parse(path, test.code, parseOptions);
		let globalsJSON = getGlobalsJson(test), settingsJSON = JSONStringify(test.settings ?? {});
		lintFileImpl(path, 0, null, [0], [optionsId], settingsJSON, globalsJSON, null);
		let ruleId = `${plugin.meta.name}/${ObjectKeys(plugin.rules)[0]}`;
		return diagnostics.map((diagnostic) => {
			let line, column, endLine, endColumn;
			({line, column} = getLineColumnFromOffset(diagnostic.start)), {line: endLine, column: endColumn} = getLineColumnFromOffset(diagnostic.end);
			let node = getNodeByRangeIndex(diagnostic.start);
			return {
				ruleId,
				message: diagnostic.message,
				messageId: diagnostic.messageId,
				severity: 1,
				nodeType: node === null ? null : node.type,
				line,
				column,
				endLine,
				endColumn,
				fixes: diagnostic.fixes,
				suggestions: diagnostic.suggestions
			};
		});
	} finally {
		registeredRules.length = 0, registeredPluginNames.clear(), allOptions !== null && (allOptions.length = 1), resetStateAfterError();
	}
}
/**
* Get parse options for a test case.
* @param test - Test case
* @returns Parse options
*/
function getParseOptions(test) {
	let parseOptions = {}, languageOptions = test.languageOptions;
	if (languageOptions ??= EMPTY_LANGUAGE_OPTIONS, languageOptions.parser != null) throw Error("Custom parsers are not supported");
	let { sourceType } = languageOptions;
	if (sourceType != null) {
		if (test.eslintCompat === !0 && sourceType === "unambiguous") throw Error("'unambiguous' source type is not supported in ESLint compatibility mode.\nDisable ESLint compatibility mode by setting `eslintCompat` to `false` in the config / test case.");
		parseOptions.sourceType = sourceType;
	} else test.eslintCompat === !0 && (parseOptions.sourceType = "module");
	let { parserOptions } = languageOptions;
	if (parserOptions != null && (parserOptions.ignoreNonFatalErrors === !0 && (parseOptions.ignoreNonFatalErrors = !0), test.filename == null)) {
		let { lang } = parserOptions;
		lang == null ? parserOptions.ecmaFeatures?.jsx === !0 && (parseOptions.lang = "jsx") : parseOptions.lang = lang;
	}
	return parseOptions;
}
/**
* Get globals and envs as JSON for test case.
*
* Normalizes globals values to "readonly", "writable", or "off", same as Rust side does.
* `null` is only supported in ESLint compatibility mode.
*
* Removes envs which are false, same as Rust side does.
*
* @param test - Test case
* @returns Globals and envs as JSON string of form `{ "globals": { ... }, "envs": { ... } }`
*/
function getGlobalsJson(test) {
	let globals = { ...test.languageOptions?.globals }, eslintCompat = !!test.eslintCompat;
	for (let key in globals) {
		let value = globals[key];
		switch (value) {
			case "readonly":
			case "writable":
			case "off": continue;
			case "writeable":
			case "true":
			case !0:
				value = "writable";
				break;
			case "readable":
			case "false":
			case !1:
				value = "readonly";
				break;
			case null: if (eslintCompat) {
				value = "readonly";
				break;
			}
			default: throw Error(`'${value}' is not a valid configuration for a global (use 'readonly', 'writable', or 'off')`);
		}
		globals[key] = value;
	}
	let originalEnvs = test.languageOptions?.env, envs = {};
	if (originalEnvs != null) for (let [key, value] of ObjectEntries(originalEnvs)) value !== !1 && ObjectDefineProperty(envs, key, {
		value: !0,
		writable: !0,
		enumerable: !0,
		configurable: !0
	});
	return JSONStringify({
		globals,
		envs
	});
}
/**
* Set up options for the test case.
*
* In linter, all options for all rules are sent over from Rust as a JSON string,
* and `setOptions` is called to merge them with the default options for each rule.
* The merged options are stored in a global variable `allOptions`.
*
* This function builds a JSON string in same format as Rust does, and calls `setOptions` with it.
*
* Returns the options ID to pass to `lintFileImpl` (either 0 for default options, or 1 for user-provided options).
*
* @param test - Test case
* @param cwd - Current working directory for test case
* @returns Options ID to pass to `lintFileImpl`
*/
function setupOptions(test, cwd) {
	let allOptions = [[]], allRuleIds = [0], optionsId = 0, testOptions = test.options;
	testOptions != null && (allOptions.push(testOptions), allRuleIds.push(0), optionsId = 1);
	let allOptionsJson;
	try {
		allOptionsJson = JSONStringify({
			options: allOptions,
			ruleIds: allRuleIds,
			cwd,
			workspaceUri: null
		});
	} catch (err) {
		throw Error(`Failed to serialize options: ${err}`);
	}
	return setOptions(allOptionsJson), optionsId;
}
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/gu;
/**
* Get name of test case.
* Control characters in name are replaced with `\u00xx` form.
* @param test - Test case
* @returns Name of test case
*/
function getTestName(test) {
	let name = test.name || test.code;
	return typeof name == "string" ? name.replace(CONTROL_CHAR_REGEX, (c) => `\\u${c.codePointAt(0).toString(16).padStart(4, "0")}`) : "";
}
/**
* Runs before hook on the given test case.
* @param test - Test to run the hook on
* @throws {Error} - If the hook is not a function
* @throws {*} - Value thrown by the hook function
*/
function runBeforeHook(test) {
	ObjectHasOwn(test, "before") && runHook(test, test.before, "before");
}
/**
* Runs after hook on the given test case.
* @param test - Test to run the hook on
* @throws {Error} - If the hook is not a function
* @throws {*} - Value thrown by the hook function
*/
function runAfterHook(test) {
	ObjectHasOwn(test, "after") && runHook(test, test.after, "after");
}
/**
* Runs a hook on the given test case.
* @param test - Test to run the hook on
* @param hook - Hook function
* @param name - Name of the hook
* @throws {Error} - If the property is not a function
* @throws {*} - Value thrown by the hook function
*/
function runHook(test, hook, name) {
	assert.strictEqual(typeof hook, "function", `Optional test case property \`${name}\` must be a function`), hook.call(test);
}
/**
* Assert that a valid test case object is valid.
* A valid test case must specify a string value for `code`.
* Optional properties are checked for correct types.
*
* @param test - Valid test case object to check
* @param seenTestCases - Set of serialized test cases to check for duplicates
* @throws {AssertionError} If the test case is not valid
*/
function assertValidTestCaseIsWellFormed(test, seenTestCases) {
	assertTestCaseCommonPropertiesAreWellFormed(test), assert(!("errors" in test) || test.errors === void 0, "Valid test case must not have `errors` property"), assert(!("output" in test) || test.output === void 0, "Valid test case must not have `output` property"), assertNotDuplicateTestCase(test, seenTestCases);
}
/**
* Assert that an invalid test case object is valid.
* An invalid test case must specify a string value for `code` and must have an `errors` property.
* Optional properties are checked for correct types.
*
* @param test - Invalid test case object to check
* @param seenTestCases - Set of serialized test cases to check for duplicates
* @param ruleName - Name of the rule being tested
* @throws {AssertionError} If the test case is not valid
*/
function assertInvalidTestCaseIsWellFormed(test, seenTestCases, ruleName) {
	assertTestCaseCommonPropertiesAreWellFormed(test);
	let { errors } = test;
	typeof errors == "number" ? assert(errors > 0, "Invalid cases must have `errors` value greater than 0") : (assert(errors !== void 0, `Did not specify errors for an invalid test of rule \`${ruleName}\``), assert(ArrayIsArray(errors), `Invalid 'errors' property for invalid test of rule \`${ruleName}\`:expected a number or an array but got ${errors === null ? "null" : typeof errors}`), assert(errors.length !== 0, "Invalid cases must have at least one error")), ObjectHasOwn(test, "output") && assert(test.output === null || typeof test.output == "string", "Test property `output`, if specified, must be a string or null. If no autofix is expected, then omit the `output` property or set it to null."), assertNotDuplicateTestCase(test, seenTestCases);
}
/**
* Assert that the common properties of a valid/invalid test case have the correct types.
* @param {Object} test - Test case object to check
* @throws {AssertionError} If the test case is not valid
*/
function assertTestCaseCommonPropertiesAreWellFormed(test) {
	assert(typeof test.code == "string", "Test case must specify a string value for `code`"), test.name && assert(typeof test.name == "string", "Optional test case property `name` must be a string"), ObjectHasOwn(test, "only") && assert(typeof test.only == "boolean", "Optional test case property `only` must be a boolean"), ObjectHasOwn(test, "filename") && assert(typeof test.filename == "string", "Optional test case property `filename` must be a string"), ObjectHasOwn(test, "options") && assert(ArrayIsArray(test.options), "Optional test case property `options` must be an array");
}
const DUPLICATION_IGNORED_PROPS = /* @__PURE__ */ new Set([
	"name",
	"errors",
	"output"
]);
/**
* Assert that this test case is not a duplicate of one we have seen before.
* @param test - Test case object
* @param seenTestCases - Set of serialized test cases we have seen so far (managed by this function)
* @throws {AssertionError} If the test case is a duplicate
*/
function assertNotDuplicateTestCase(test, seenTestCases) {
	if (!isSerializable(test)) return;
	let serializedTestCase = (0, import_json_stable_stringify_without_jsonify.default)(test, { replacer(key, value) {
		return test !== this || !DUPLICATION_IGNORED_PROPS.has(key) ? value : void 0;
	} });
	assert(!seenTestCases.has(serializedTestCase), "Detected duplicate test case"), seenTestCases.add(serializedTestCase);
}
/**
* Check if a value is serializable.
* Functions or objects like RegExp cannot be serialized by JSON.stringify().
* Inspired by: https://stackoverflow.com/questions/30579940/reliable-way-to-check-if-objects-is-serializable-in-javascript
* @param value - Value
* @param seenObjects - Objects already seen in this path from the root object.
* @returns {boolean} `true` if the value is serializable
*/
function isSerializable(value, seenObjects = /* @__PURE__ */ new Set()) {
	if (!isSerializablePrimitiveOrPlainObject(value)) return !1;
	if (typeof value != "object" || !value) return !0;
	if (seenObjects.has(value)) return !1;
	for (let property in value) {
		if (!ObjectHasOwn(value, property)) continue;
		let prop = value[property];
		if (!isSerializablePrimitiveOrPlainObject(prop) || !(typeof prop != "object" || !prop) && !isSerializable(prop, /* @__PURE__ */ new Set([...seenObjects, value]))) return !1;
	}
	return !0;
}
/**
* Check if a value is a primitive or plain object created by the `Object` constructor.
* @param value - Value to check
* @returns `true` if `value` is a primitive or plain object
*/
function isSerializablePrimitiveOrPlainObject(value) {
	return value === null || typeof value == "string" || typeof value == "boolean" || typeof value == "number" || typeof value == "object" && (value.constructor === Object || ArrayIsArray(value));
}
//#endregion
export { RuleTester };
