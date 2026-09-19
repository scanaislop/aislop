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
import { parseString, parseValue } from './primitive.js';
import { parseArray, parseInlineTable } from './struct.js';
import { TomlError } from './error.js';
/** @internal */
export function extractValue(ctx, end, integersAsBigInt) {
    let ptr = ctx.p;
    let c = ctx.s.charCodeAt(ptr);
    // Structs
    if (c === 0x5b /* [ */ || c === 0x7b /* { */) {
        if (!ctx.d--) {
            throw new TomlError('document contains excessively nested structures. aborting.', {
                toml: ctx.s,
                ptr,
            });
        }
        let value = c === 0x5b /* [ */
            ? parseArray(ctx, integersAsBigInt)
            : parseInlineTable(ctx, integersAsBigInt);
        ctx.d++;
        return value;
    }
    // Strings
    if (c === 0x22 /* " */ || c === 0x27 /* ' */) {
        return parseString(ctx);
    }
    // Booleans
    // We can fast-path because the first character is enough to know the only possible value
    if (c === 0x74 /* t */) { // Only possible valid value is `true`
        if (ctx.s.charCodeAt(++ctx.p) !== 0x72 || ctx.s.charCodeAt(++ctx.p) !== 0x75 || ctx.s.charCodeAt(++ctx.p) !== 0x65)
            throw new TomlError('invalid value', { toml: ctx.s, ptr });
        ctx.p++;
        return true;
    }
    if (c === 0x66 /* f */) { // Only possible valid value is `false`
        if (ctx.s.charCodeAt(++ctx.p) !== 0x61 || ctx.s.charCodeAt(++ctx.p) !== 0x6c || ctx.s.charCodeAt(++ctx.p) !== 0x73 || ctx.s.charCodeAt(++ctx.p) !== 0x65)
            throw new TomlError('invalid value', { toml: ctx.s, ptr });
        ctx.p++;
        return false;
    }
    // Legacy logic for numbers and dates. Slow and needs to be rewritten.
    return parseValue(ctx, integersAsBigInt, end);
}
