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
import { parseString } from './primitive.js';
import { extractValue } from './extract.js';
import { indexOfNewline, skipVoid } from './util.js';
import { TomlError } from './error.js';
let KEY_PART_RE = /^[a-zA-Z0-9-_]+[ \t]*$/;
/** @internal */
export function parseKey(ctx, end = '=') {
    let start = ctx.p;
    let dot = start - 1;
    let parsed = [];
    let endPtr = ctx.s.indexOf(end, start);
    if (endPtr < 0) {
        throw new TomlError('incomplete key-value: cannot find end of key', {
            toml: ctx.s,
            ptr: start,
        });
    }
    do {
        let c = ctx.s.charCodeAt(ctx.p = ++dot);
        // If it's whitespace, ignore
        if (c !== 0x20 && c !== 0x9 /* \t */) {
            // If it's a string
            if (c === 0x22 /* " */ || c === 0x27 /* ' */) {
                if (c === ctx.s.charCodeAt(ctx.p + 1) && c === ctx.s.charCodeAt(ctx.p + 2)) {
                    throw new TomlError('multiline strings are not allowed in keys', {
                        toml: ctx.s,
                        ptr: ctx.p,
                    });
                }
                let part = parseString(ctx);
                dot = ctx.s.indexOf('.', ctx.p);
                let strEnd = ctx.s.slice(ctx.p, dot < 0 || dot > endPtr ? endPtr : dot);
                let newLine = indexOfNewline(strEnd);
                if (newLine > -1) {
                    throw new TomlError('newlines are not allowed in keys', {
                        toml: ctx.s,
                        ptr: newLine,
                    });
                }
                if (strEnd.trimStart()) {
                    throw new TomlError('found extra tokens after the string part', {
                        toml: ctx.s,
                        ptr: ctx.p,
                    });
                }
                if (endPtr < ctx.p) {
                    endPtr = ctx.s.indexOf(end, ctx.p);
                    if (endPtr < 0) {
                        throw new TomlError('incomplete key-value: cannot find end of key', {
                            toml: ctx.s,
                            ptr: start,
                        });
                    }
                }
                parsed.push(part);
            }
            else {
                // Normal raw key part consumption and validation
                dot = ctx.s.indexOf('.', ctx.p);
                let part = ctx.s.slice(ctx.p, dot < 0 || dot > endPtr ? endPtr : dot);
                if (!KEY_PART_RE.test(part)) {
                    throw new TomlError('only letter, numbers, dashes and underscores are allowed in keys', {
                        toml: ctx.s,
                        ptr: ctx.p,
                    });
                }
                parsed.push(part.trimEnd());
            }
        }
        // Until there's no more dot
    } while (dot + 1 && dot < endPtr);
    ctx.p = endPtr + 1;
    skipVoid(ctx, true, true);
    return parsed;
}
/** @internal */
export function parseInlineTable(ctx, integersAsBigInt) {
    let res = {};
    let seen = new Set();
    let c;
    ctx.p++;
    while (ctx.p < ctx.s.length) {
        skipVoid(ctx);
        if ((c = ctx.s.charCodeAt(ctx.p)) === 0x7d /* } */) {
            ctx.p++;
            return res;
        }
        let k;
        let t = res;
        let hasOwn = false;
        let p = ctx.p;
        let key = parseKey(ctx);
        for (let i = 0; i < key.length; i++) {
            if (i)
                t = hasOwn ? t[k] : (t[k] = {});
            k = key[i];
            if ((hasOwn = Object.hasOwn(t, k)) && (typeof t[k] !== 'object' || seen.has(t[k]))) {
                throw new TomlError('trying to redefine an already defined value', {
                    toml: ctx.s,
                    ptr: p,
                });
            }
            if (!hasOwn && k === '__proto__') {
                Object.defineProperty(t, k, { enumerable: true, configurable: true, writable: true });
            }
        }
        if (hasOwn) {
            throw new TomlError('trying to redefine an already defined value', {
                toml: ctx.s,
                ptr: ctx.p,
            });
        }
        let value = extractValue(ctx, 0x7d /* } */, integersAsBigInt);
        seen.add(t[k] = value);
        skipVoid(ctx);
        if ((c = ctx.s.charCodeAt(ctx.p++)) === 0x7d /* } */) {
            return res;
        }
        if (c !== 0x2c /* , */) {
            throw new TomlError('expected comma or end of structure', { toml: ctx.s, ptr: ctx.p - 1 });
        }
    }
    throw new TomlError('unfinished table encountered', {
        toml: ctx.s,
        ptr: ctx.p,
    });
}
/** @internal */
export function parseArray(ctx, integersAsBigInt) {
    let res = [];
    let c;
    ctx.p++;
    while (ctx.p < ctx.s.length) {
        skipVoid(ctx);
        if ((c = ctx.s.charCodeAt(ctx.p)) === 0x5d /* ] */) {
            ctx.p++;
            return res;
        }
        res.push(extractValue(ctx, 0x5d /* ] */, integersAsBigInt));
        skipVoid(ctx);
        if ((c = ctx.s.charCodeAt(ctx.p++)) === 0x5d /* ] */) {
            return res;
        }
        if (c !== 0x2c /* , */) {
            throw new TomlError('expected comma or end of structure', { toml: ctx.s, ptr: ctx.p - 1 });
        }
    }
    throw new TomlError('unfinished array encountered', {
        toml: ctx.s,
        ptr: ctx.p,
    });
}
