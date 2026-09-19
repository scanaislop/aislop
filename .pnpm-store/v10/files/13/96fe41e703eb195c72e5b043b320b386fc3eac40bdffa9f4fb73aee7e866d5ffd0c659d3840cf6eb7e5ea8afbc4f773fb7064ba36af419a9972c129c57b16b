/*!
* Copyright (c) Squirrel Chat et al., All rights reserved.
* SPDX-License-Identifier: BSD-3-Clause
*
* Redistribution and use in source and binary forms, with or without
* modification, are permitted provided that the following conditions are met:
*
* 1. Redistributions of source code must retain the above copyright notice, this
*    list of conditions and the following disclaimer.
* 2. Redistributions in binary form must reproduce the above copyright notice,
*    this list of conditions and the following disclaimer in the
*    documentation and/or other materials provided with the distribution.
* 3. Neither the name of the copyright holder nor the names of its contributors
*    may be used to endorse or promote products derived from this software without
*    specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
* ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
* WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
* DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
* FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
* DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
* SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
* CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
* OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
* OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
"use strict";
Object.defineProperties(exports, {
	__esModule: { value: true },
	[Symbol.toStringTag]: { value: "Module" }
});
//#region src/date.ts
let DATE_TIME_RE = /^(\d{4}-\d{2}-\d{2})?[T ]?(?:(\d{2}):\d{2}(?::\d{2}(?:\.\d+)?)?)?(Z|[-+]\d{2}:\d{2})?$/i;
var TomlDate = class TomlDate extends Date {
	#hasDate = false;
	#hasTime = false;
	#offset = null;
	constructor(date) {
		let hasDate = true;
		let hasTime = true;
		let offset = "Z";
		if (typeof date === "string") {
			let match = date.match(DATE_TIME_RE);
			if (match) {
				if (!match[1]) {
					hasDate = false;
					date = `0000-01-01T${date}`;
				}
				hasTime = !!match[2];
				hasTime && date[10] === " " && (date = date.replace(" ", "T"));
				if (match[2] && +match[2] > 23) date = "";
				else {
					offset = match[3] || null;
					date = date.toUpperCase();
					if (!offset && hasTime) date += "Z";
				}
			} else date = "";
		}
		super(date);
		if (!isNaN(this.getTime())) {
			this.#hasDate = hasDate;
			this.#hasTime = hasTime;
			this.#offset = offset;
		}
	}
	isDateTime() {
		return this.#hasDate && this.#hasTime;
	}
	isLocal() {
		return !this.#hasDate || !this.#hasTime || !this.#offset;
	}
	isDate() {
		return this.#hasDate && !this.#hasTime;
	}
	isTime() {
		return this.#hasTime && !this.#hasDate;
	}
	isValid() {
		return this.#hasDate || this.#hasTime;
	}
	toISOString() {
		let iso = super.toISOString();
		if (this.isDate()) return iso.slice(0, 10);
		if (this.isTime()) return iso.slice(11, 23);
		if (this.#offset === null) return iso.slice(0, -1);
		if (this.#offset === "Z") return iso;
		let offset = +this.#offset.slice(1, 3) * 60 + +this.#offset.slice(4, 6);
		offset = this.#offset[0] === "-" ? offset : -offset;
		return (/* @__PURE__ */ new Date(this.getTime() - offset * 6e4)).toISOString().slice(0, -1) + this.#offset;
	}
	static wrapAsOffsetDateTime(jsDate, offset = "Z") {
		let date = new TomlDate(jsDate);
		date.#offset = offset;
		return date;
	}
	static wrapAsLocalDateTime(jsDate) {
		let date = new TomlDate(jsDate);
		date.#offset = null;
		return date;
	}
	static wrapAsLocalDate(jsDate) {
		let date = new TomlDate(jsDate);
		date.#hasTime = false;
		date.#offset = null;
		return date;
	}
	static wrapAsLocalTime(jsDate) {
		let date = new TomlDate(jsDate);
		date.#hasDate = false;
		date.#offset = null;
		return date;
	}
};
//#endregion
//#region src/error.ts
function getLineColFromPtr(string, ptr) {
	let lines = string.slice(0, ptr).split(/\r\n|\n|\r/g);
	return [lines.length, lines.pop().length + 1];
}
function makeCodeBlock(string, line, column) {
	let lines = string.split(/\r\n|\n|\r/g);
	let codeblock = "";
	let numberLen = (Math.log10(line + 1) | 0) + 1;
	for (let i = line - 1; i <= line + 1; i++) {
		let l = lines[i - 1];
		if (!l) continue;
		codeblock += i.toString().padEnd(numberLen, " ");
		codeblock += ":  ";
		codeblock += l;
		codeblock += "\n";
		if (i === line) {
			codeblock += " ".repeat(numberLen + column + 2);
			codeblock += "^\n";
		}
	}
	return codeblock;
}
var TomlError = class extends Error {
	line;
	column;
	codeblock;
	constructor(message, options) {
		const [line, column] = getLineColFromPtr(options.toml, options.ptr);
		const codeblock = makeCodeBlock(options.toml, line, column);
		super(`Invalid TOML document: ${message}\n\n${codeblock}`, options);
		this.line = line;
		this.column = column;
		this.codeblock = codeblock;
	}
};
//#endregion
//#region src/util.ts
/** @internal */
function indexOfNewline(str, start = 0) {
	let idx = str.indexOf("\n", start);
	if (str.charCodeAt(idx - 1) === 13) idx--;
	return idx;
}
/** @internal */
function skipComment(ctx) {
	for (; ctx.p < ctx.s.length; ctx.p++) {
		let c = ctx.s.charCodeAt(ctx.p);
		if (c === 10) break;
		if (c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10) {
			ctx.p++;
			break;
		}
		if (c < 32 && c !== 9 || c === 127) throw new TomlError("control characters are not allowed in comments", {
			toml: ctx.s,
			ptr: ctx.p
		});
	}
}
/** @internal */
function skipVoid(ctx, banNewLines, banComments) {
	let c;
	while (1) {
		while ((c = ctx.s.charCodeAt(ctx.p)) === 32 || c === 9 || !banNewLines && (c === 10 || c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10)) ctx.p++;
		if (banComments || c !== 35) break;
		skipComment(ctx);
	}
}
/** @internal */
function skipUntil(ctx, sep, end) {
	let ptr = ctx.p;
	if (!end) {
		ptr = indexOfNewline(ctx.s, ptr);
		ctx.p = ptr < 0 ? ctx.s.length : ptr;
		return;
	}
	for (; ctx.p < ctx.s.length; ctx.p++) {
		let c = ctx.s.charCodeAt(ctx.p);
		if (c === 35) skipComment(ctx);
		else if (c === end || c === sep) return;
	}
	throw new TomlError("cannot find end of structure", {
		toml: ctx.s,
		ptr
	});
}
//#endregion
//#region src/primitive.ts
let INT_REGEX = /^((0x[0-9a-fA-F](_?[0-9a-fA-F])*)|(([+-]|0[ob])?\d(_?\d)*))$/;
let FLOAT_REGEX = /^[+-]?\d(_?\d)*(\.\d(_?\d)*)?([eE][+-]?\d(_?\d)*)?$/;
let LEADING_ZERO = /^[+-]?0[0-9_]/;
/** @internal */
function parseString(ctx) {
	let start = ctx.p;
	let c = ctx.s.charCodeAt(ctx.p++);
	let first = c;
	let isLiteral = c === 39;
	let isMultiline = c === ctx.s.charCodeAt(ctx.p) && c === ctx.s.charCodeAt(ctx.p + 1);
	if (isMultiline) {
		if ((c = ctx.s.charCodeAt(ctx.p += 2)) === 10) ctx.p++;
		else if (c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10) ctx.p += 2;
	}
	let parsed = "";
	let sliceStart = ctx.p;
	let state = 0;
	for (; ctx.p < ctx.s.length; ctx.p++) {
		c = ctx.s.charCodeAt(ctx.p);
		if (isMultiline && (c === 10 || c === 13 && ctx.s.charCodeAt(ctx.p + 1) === 10)) state = state && 3;
		else if (c < 32 && c !== 9 || c === 127) throw new TomlError("control characters are not allowed in strings", {
			toml: ctx.s,
			ptr: ctx.p
		});
		else if ((!state || state === 3) && c === first && (!isMultiline || ctx.s.charCodeAt(ctx.p + 1) === first && ctx.s.charCodeAt(ctx.p + 2) === first)) {
			if (isMultiline) {
				if (ctx.s.charCodeAt(ctx.p + 3) === first) ctx.p++;
				if (ctx.s.charCodeAt(ctx.p + 3) === first) ctx.p++;
			}
			if (!state) parsed += ctx.s.slice(sliceStart, ctx.p);
			ctx.p += isMultiline ? 3 : 1;
			return parsed;
		} else if (!state) {
			if (!isLiteral && c === 92) {
				parsed += ctx.s.slice(sliceStart, sliceStart = ctx.p);
				state = 1;
			}
		} else if (state === 1) {
			if (c === 120 || c === 117 || c === 85) {
				let value = 0;
				let len = c === 120 ? 2 : c === 117 ? 4 : 8;
				for (let j = 0; j < len; j++, ctx.p++) {
					let hex = ctx.s.charCodeAt(ctx.p + 1);
					let digit = hex >= 48 && hex <= 57 ? hex - 48 : hex >= 65 && hex <= 70 ? hex - 65 + 10 : hex >= 97 && hex <= 102 ? hex - 97 + 10 : -1;
					if (digit < 0) throw new TomlError("invalid non-hex character in unicode escape", {
						toml: ctx.s,
						ptr: ctx.p + 1
					});
					value = value << 4 | digit;
				}
				if (value < 0 || value > 1114111 || value >= 55296 && value <= 57343) throw new TomlError("invalid unicode escape", {
					toml: ctx.s,
					ptr: ctx.p
				});
				parsed += String.fromCodePoint(value);
				sliceStart = ctx.p + 1;
				state = 0;
			} else if (c === 32 || c === 9) state = 2;
			else {
				if (c === 98) parsed += "\b";
				else if (c === 116) parsed += "	";
				else if (c === 110) parsed += "\n";
				else if (c === 102) parsed += "\f";
				else if (c === 114) parsed += "\r";
				else if (c === 101) parsed += "\x1B";
				else if (c === 34) parsed += "\"";
				else if (c === 92) parsed += "\\";
				else throw new TomlError("unrecognized escape sequence", {
					toml: ctx.s,
					ptr: ctx.p
				});
				sliceStart = ctx.p + 1;
				state = 0;
			}
		} else if (c !== 32 && c !== 9) {
			if (state === 2) throw new TomlError("invalid escape: only line-ending whitespace may be escaped", {
				toml: ctx.s,
				ptr: sliceStart
			});
			state = !isLiteral && c === 92 ? 1 : 0;
			sliceStart = ctx.p;
		}
	}
	throw new TomlError("unfinished string", {
		toml: ctx.s,
		ptr: start
	});
}
function sliceAndTrimEndOf(ctx, start, end) {
	let value = ctx.s.slice(start, end);
	let commentIdx = value.indexOf("#");
	if (commentIdx > 0) {
		skipComment({
			s: value,
			p: commentIdx,
			d: 0
		});
		value = value.slice(0, commentIdx);
	}
	return value.trimEnd();
}
/** @internal */
function parseValue(ctx, integersAsBigInt, end) {
	let ptr = ctx.p;
	let err = {
		toml: ctx.s,
		ptr
	};
	skipUntil(ctx, 44, end);
	let value = sliceAndTrimEndOf(ctx, ptr, ctx.p);
	if (!value) throw new TomlError("incomplete declaration: value expected", err);
	if (value === "-inf") return -Infinity;
	if (value === "inf" || value === "+inf") return Infinity;
	if (value === "nan" || value === "+nan" || value === "-nan") return NaN;
	if (value === "-0") return integersAsBigInt ? 0n : 0;
	let isInt = INT_REGEX.test(value);
	if (isInt || FLOAT_REGEX.test(value)) {
		if (LEADING_ZERO.test(value)) throw new TomlError("leading zeroes are not allowed", err);
		value = value.replace(/_/g, "");
		let numeric = +value;
		if (isNaN(numeric)) throw new TomlError("invalid number", err);
		if (isInt) {
			if ((isInt = !Number.isSafeInteger(numeric)) && !integersAsBigInt) throw new TomlError("integer value cannot be represented losslessly", err);
			if (isInt || integersAsBigInt === true) numeric = BigInt(value);
		}
		return numeric;
	}
	const date = new TomlDate(value);
	if (!date.isValid()) throw new TomlError("invalid value", err);
	return date;
}
//#endregion
//#region src/extract.ts
/** @internal */
function extractValue(ctx, end, integersAsBigInt) {
	let ptr = ctx.p;
	let c = ctx.s.charCodeAt(ptr);
	if (c === 91 || c === 123) {
		if (!ctx.d--) throw new TomlError("document contains excessively nested structures. aborting.", {
			toml: ctx.s,
			ptr
		});
		let value = c === 91 ? parseArray(ctx, integersAsBigInt) : parseInlineTable(ctx, integersAsBigInt);
		ctx.d++;
		return value;
	}
	if (c === 34 || c === 39) return parseString(ctx);
	if (c === 116) {
		if (ctx.s.charCodeAt(++ctx.p) !== 114 || ctx.s.charCodeAt(++ctx.p) !== 117 || ctx.s.charCodeAt(++ctx.p) !== 101) throw new TomlError("invalid value", {
			toml: ctx.s,
			ptr
		});
		ctx.p++;
		return true;
	}
	if (c === 102) {
		if (ctx.s.charCodeAt(++ctx.p) !== 97 || ctx.s.charCodeAt(++ctx.p) !== 108 || ctx.s.charCodeAt(++ctx.p) !== 115 || ctx.s.charCodeAt(++ctx.p) !== 101) throw new TomlError("invalid value", {
			toml: ctx.s,
			ptr
		});
		ctx.p++;
		return false;
	}
	return parseValue(ctx, integersAsBigInt, end);
}
//#endregion
//#region src/struct.ts
let KEY_PART_RE = /^[a-zA-Z0-9-_]+[ \t]*$/;
/** @internal */
function parseKey(ctx, end = "=") {
	let start = ctx.p;
	let dot = start - 1;
	let parsed = [];
	let endPtr = ctx.s.indexOf(end, start);
	if (endPtr < 0) throw new TomlError("incomplete key-value: cannot find end of key", {
		toml: ctx.s,
		ptr: start
	});
	do {
		let c = ctx.s.charCodeAt(ctx.p = ++dot);
		if (c !== 32 && c !== 9) {
			if (c === 34 || c === 39) {
				if (c === ctx.s.charCodeAt(ctx.p + 1) && c === ctx.s.charCodeAt(ctx.p + 2)) throw new TomlError("multiline strings are not allowed in keys", {
					toml: ctx.s,
					ptr: ctx.p
				});
				let part = parseString(ctx);
				dot = ctx.s.indexOf(".", ctx.p);
				let strEnd = ctx.s.slice(ctx.p, dot < 0 || dot > endPtr ? endPtr : dot);
				let newLine = indexOfNewline(strEnd);
				if (newLine > -1) throw new TomlError("newlines are not allowed in keys", {
					toml: ctx.s,
					ptr: newLine
				});
				if (strEnd.trimStart()) throw new TomlError("found extra tokens after the string part", {
					toml: ctx.s,
					ptr: ctx.p
				});
				if (endPtr < ctx.p) {
					endPtr = ctx.s.indexOf(end, ctx.p);
					if (endPtr < 0) throw new TomlError("incomplete key-value: cannot find end of key", {
						toml: ctx.s,
						ptr: start
					});
				}
				parsed.push(part);
			} else {
				dot = ctx.s.indexOf(".", ctx.p);
				let part = ctx.s.slice(ctx.p, dot < 0 || dot > endPtr ? endPtr : dot);
				if (!KEY_PART_RE.test(part)) throw new TomlError("only letter, numbers, dashes and underscores are allowed in keys", {
					toml: ctx.s,
					ptr: ctx.p
				});
				parsed.push(part.trimEnd());
			}
		}
	} while (dot + 1 && dot < endPtr);
	ctx.p = endPtr + 1;
	skipVoid(ctx, true, true);
	return parsed;
}
/** @internal */
function parseInlineTable(ctx, integersAsBigInt) {
	let res = {};
	let seen = /* @__PURE__ */ new Set();
	let c;
	ctx.p++;
	while (ctx.p < ctx.s.length) {
		skipVoid(ctx);
		if ((c = ctx.s.charCodeAt(ctx.p)) === 125) {
			ctx.p++;
			return res;
		}
		let k;
		let t = res;
		let hasOwn = false;
		let p = ctx.p;
		let key = parseKey(ctx);
		for (let i = 0; i < key.length; i++) {
			if (i) t = hasOwn ? t[k] : t[k] = {};
			k = key[i];
			if ((hasOwn = Object.hasOwn(t, k)) && (typeof t[k] !== "object" || seen.has(t[k]))) throw new TomlError("trying to redefine an already defined value", {
				toml: ctx.s,
				ptr: p
			});
			if (!hasOwn && k === "__proto__") Object.defineProperty(t, k, {
				enumerable: true,
				configurable: true,
				writable: true
			});
		}
		if (hasOwn) throw new TomlError("trying to redefine an already defined value", {
			toml: ctx.s,
			ptr: ctx.p
		});
		let value = extractValue(ctx, 125, integersAsBigInt);
		seen.add(t[k] = value);
		skipVoid(ctx);
		if ((c = ctx.s.charCodeAt(ctx.p++)) === 125) return res;
		if (c !== 44) throw new TomlError("expected comma or end of structure", {
			toml: ctx.s,
			ptr: ctx.p - 1
		});
	}
	throw new TomlError("unfinished table encountered", {
		toml: ctx.s,
		ptr: ctx.p
	});
}
/** @internal */
function parseArray(ctx, integersAsBigInt) {
	let res = [];
	let c;
	ctx.p++;
	while (ctx.p < ctx.s.length) {
		skipVoid(ctx);
		if ((c = ctx.s.charCodeAt(ctx.p)) === 93) {
			ctx.p++;
			return res;
		}
		res.push(extractValue(ctx, 93, integersAsBigInt));
		skipVoid(ctx);
		if ((c = ctx.s.charCodeAt(ctx.p++)) === 93) return res;
		if (c !== 44) throw new TomlError("expected comma or end of structure", {
			toml: ctx.s,
			ptr: ctx.p - 1
		});
	}
	throw new TomlError("unfinished array encountered", {
		toml: ctx.s,
		ptr: ctx.p
	});
}
//#endregion
//#region src/parse.ts
function peekTable(key, table, meta, type) {
	let t = table;
	let m = meta;
	let k;
	let hasOwn = false;
	let state;
	for (let i = 0; i < key.length; i++) {
		if (i) {
			t = hasOwn ? t[k] : t[k] = {};
			m = (state = m[k]).c;
			if (type === 0 && (state.t === 1 || state.t === 2)) return null;
			if (state.t === 2) {
				let l = t.length - 1;
				t = t[l];
				m = m[l].c;
			}
		}
		k = key[i];
		if ((hasOwn = Object.hasOwn(t, k)) && m[k]?.t === 0 && m[k]?.d) return null;
		if (!hasOwn) {
			if (k === "__proto__") {
				Object.defineProperty(t, k, {
					enumerable: true,
					configurable: true,
					writable: true
				});
				Object.defineProperty(m, k, {
					enumerable: true,
					configurable: true,
					writable: true
				});
			}
			m[k] = {
				t: i < key.length - 1 && type === 2 ? 3 : type,
				d: false,
				i: 0,
				c: {}
			};
		}
	}
	state = m[k];
	if (state.t !== type && !(type === 1 && state.t === 3)) return null;
	if (type === 2) {
		if (!state.d) {
			state.d = true;
			t[k] = [];
		}
		t[k].push(t = {});
		state.c[state.i++] = state = {
			t: 1,
			d: false,
			i: 0,
			c: {}
		};
	}
	if (state.d) return null;
	state.d = true;
	if (type === 1) t = hasOwn ? t[k] : t[k] = {};
	else if (type === 0 && hasOwn) return null;
	return [
		k,
		t,
		state.c
	];
}
function parse(toml, { maxDepth = 1e3, integersAsBigInt } = {}) {
	let ctx = {
		s: toml,
		p: 0,
		d: maxDepth
	};
	let res = {};
	let meta = {};
	let tmp;
	let tbl = res;
	let m = meta;
	skipVoid(ctx);
	while (ctx.p < toml.length) {
		if (toml.charCodeAt(ctx.p) === 91) {
			let isTableArray = toml.charCodeAt(++ctx.p) === 91;
			tmp = ctx.p += +isTableArray;
			let k = parseKey(ctx, "]");
			if (isTableArray) {
				if (toml.charCodeAt(ctx.p - 1) !== 93) throw new TomlError("expected end of table declaration", {
					toml,
					ptr: ctx.p - 1
				});
				ctx.p++;
			}
			let p = peekTable(k, res, meta, isTableArray ? 2 : 1);
			if (!p) throw new TomlError("trying to redefine an already defined table or value", {
				toml,
				ptr: tmp
			});
			m = p[2];
			tbl = p[1];
		} else {
			tmp = ctx.p;
			let p = peekTable(parseKey(ctx), tbl, m, 0);
			if (!p) throw new TomlError("trying to redefine an already defined table or value", {
				toml,
				ptr: tmp
			});
			p[1][p[0]] = extractValue(ctx, void 0, integersAsBigInt);
		}
		skipVoid(ctx, true);
		if (ctx.p < toml.length && (tmp = toml.charCodeAt(ctx.p)) !== 10 && tmp !== 13) throw new TomlError("each key-value declaration must be followed by an end-of-line", {
			toml,
			ptr: ctx.p
		});
		skipVoid(ctx);
	}
	return res;
}
//#endregion
//#region src/stringify.ts
let BARE_KEY = /^[a-z0-9-_]+$/i;
function extendedTypeOf(obj) {
	let type = typeof obj;
	if (type === "object") {
		if (Array.isArray(obj)) return "array";
		if (typeof obj?.getUTCDate === "function" && obj instanceof Date) return "date";
		if (globalThis.Temporal && typeof obj?.since === "function" && (obj instanceof Temporal.Instant || obj instanceof Temporal.PlainDate || obj instanceof Temporal.PlainDateTime || obj instanceof Temporal.PlainTime || obj instanceof Temporal.ZonedDateTime)) return "temporal";
	}
	return type;
}
function isArrayOfTables(obj) {
	for (let i = 0; i < obj.length; i++) if (extendedTypeOf(obj[i]) !== "object") return false;
	return obj.length != 0;
}
function formatString(s) {
	return JSON.stringify(s).replace(/\x7f/g, "\\u007f");
}
function stringifyTemporal(temporal) {
	return temporal.toString({
		calendarName: "never",
		timeZoneName: "never"
	});
}
function stringifyValue(val, type, depth, numberAsFloat) {
	if (depth === 0) throw new Error("Could not stringify the object: maximum object depth exceeded");
	switch (type) {
		case "number":
			if (isNaN(val)) return "nan";
			if (val === Infinity) return "inf";
			if (val === -Infinity) return "-inf";
			if (Number.isInteger(val) && (numberAsFloat || !Number.isSafeInteger(val))) return val.toFixed(1);
		case "bigint":
		case "boolean": return val.toString();
		case "string": return formatString(val);
		case "date":
			if (isNaN(val.getTime())) throw new TypeError("cannot serialize invalid date");
			return val.toISOString();
		case "object": return stringifyInlineTable(val, depth, numberAsFloat);
		case "array": return stringifyArray(val, depth, numberAsFloat);
		case "temporal": return stringifyTemporal(val);
	}
}
function stringifyInlineTable(obj, depth, numberAsFloat) {
	let keys = Object.keys(obj);
	if (keys.length === 0) return "{}";
	let res = "{ ";
	for (let i = 0; i < keys.length; i++) {
		let k = keys[i];
		if (i) res += ", ";
		res += BARE_KEY.test(k) ? k : formatString(k);
		res += " = ";
		res += stringifyValue(obj[k], extendedTypeOf(obj[k]), depth - 1, numberAsFloat);
	}
	return res + " }";
}
function stringifyArray(array, depth, numberAsFloat) {
	if (array.length === 0) return "[]";
	let res = "[ ";
	for (let i = 0; i < array.length; i++) {
		if (i) res += ", ";
		if (array[i] === null || array[i] === void 0) throw new TypeError("arrays cannot contain null or undefined values");
		res += stringifyValue(array[i], extendedTypeOf(array[i]), depth - 1, numberAsFloat);
	}
	return res + " ]";
}
function stringifyArrayTable(array, key, depth, numberAsFloat) {
	if (depth === 0) throw new Error("Could not stringify the object: maximum object depth exceeded");
	let res = "";
	for (let i = 0; i < array.length; i++) {
		res += `${res && "\n"}[[${key}]]\n`;
		res += stringifyTable(0, array[i], key, depth, numberAsFloat);
	}
	return res;
}
function stringifyTable(tableKey, obj, prefix, depth, numberAsFloat) {
	if (depth === 0) throw new Error("Could not stringify the object: maximum object depth exceeded");
	let preamble = "";
	let tables = "";
	let keys = Object.keys(obj);
	for (let i = 0; i < keys.length; i++) {
		let k = keys[i];
		if (obj[k] !== null && obj[k] !== void 0) {
			let type = extendedTypeOf(obj[k]);
			if (type === "symbol" || type === "function") throw new TypeError(`cannot serialize values of type '${type}'`);
			let key = BARE_KEY.test(k) ? k : formatString(k);
			if (type === "array" && isArrayOfTables(obj[k])) tables += (tables && "\n") + stringifyArrayTable(obj[k], prefix ? `${prefix}.${key}` : key, depth - 1, numberAsFloat);
			else if (type === "object") {
				let tblKey = prefix ? `${prefix}.${key}` : key;
				tables += (tables && "\n") + stringifyTable(tblKey, obj[k], tblKey, depth - 1, numberAsFloat);
			} else {
				preamble += key;
				preamble += " = ";
				preamble += stringifyValue(obj[k], type, depth, numberAsFloat);
				preamble += "\n";
			}
		}
	}
	if (tableKey && (preamble || !tables)) preamble = preamble ? `[${tableKey}]\n${preamble}` : `[${tableKey}]`;
	return preamble && tables ? `${preamble}\n${tables}` : preamble || tables;
}
function stringify(obj, { maxDepth = 1e3, numbersAsFloat = false } = {}) {
	if (extendedTypeOf(obj) !== "object") throw new TypeError("stringify can only be called with an object");
	let str = stringifyTable(0, obj, "", maxDepth, numbersAsFloat);
	if (str[str.length - 1] !== "\n") return str + "\n";
	return str;
}
//#endregion
//#region src/index.ts
var src_default = {
	parse,
	stringify,
	TomlDate,
	TomlError
};
//#endregion
exports.TomlDate = TomlDate;
exports.TomlError = TomlError;
exports.default = src_default;
exports.parse = parse;
exports.stringify = stringify;
