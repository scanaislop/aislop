import { decodeAnsiCQuoted } from "./ansi-c.js";
import { parseArithmeticExpression } from "./arithmetic.js";
import { WordImpl } from "./word.js";
import { CH_TAB, CH_NL, CH_SPACE, CH_BANG, CH_DQUOTE, CH_HASH, CH_DOLLAR, CH_PERCENT, CH_AMP, CH_SQUOTE, CH_LPAREN, CH_RPAREN, CH_STAR, CH_PLUS, CH_COMMA, CH_DASH, CH_SLASH, CH_0, CH_9, CH_COLON, CH_SEMI, CH_LT, CH_EQ, CH_GT, CH_QUESTION, CH_AT, CH_A, CH_Z, CH_LBRACKET, CH_BACKSLASH, CH_RBRACKET, CH_CARET, CH_UNDERSCORE, CH_BACKTICK, CH_a, CH_z, CH_LBRACE, CH_PIPE, CH_RBRACE, } from "./chars.js";
// Shared nesting budget for compound syntax and for structure materialized on demand
// (sub-field words, nested substitution scripts). 256 nested levels stay lossless; past
// that the lexer stops descending instead of overflowing the stack: deeper sub-fields
// keep their raw text without parts, and substitution scripts stay unresolved past one
// boundary script flagged with "maximum substitution nesting depth exceeded". The
// iterative scanners additionally report the depth error where their counters can see
// it (nested `${`, `$((`, and `$(`); cut-offs those counters cannot see (e.g. chains
// interleaved with double quotes) degrade to plain text without an error.
export const MAX_SYNTAX_NESTING = 256;
export const Token = {
    Word: 0,
    Assignment: 1,
    Semi: 2,
    Newline: 3,
    Pipe: 4,
    And: 5,
    Or: 6,
    Amp: 7,
    LParen: 8,
    RParen: 9,
    LBrace: 10,
    RBrace: 11,
    Bang: 12,
    If: 13,
    Then: 14,
    Else: 15,
    Elif: 16,
    Fi: 17,
    Do: 18,
    Done: 19,
    For: 20,
    While: 21,
    Until: 22,
    In: 23,
    Case: 24,
    Esac: 25,
    Function: 26,
    DoubleSemi: 27,
    SemiAmp: 28,
    DoubleSemiAmp: 29,
    Select: 30,
    DblLBracket: 31,
    DblRBracket: 32,
    EOF: 33,
    ArithCmd: 34,
    Coproc: 35,
    Redirect: 36,
};
export class TokenValue {
    token = Token.EOF;
    // Materialized token value, or null for word tokens whose value has not been
    // requested yet (computed from [pos, end) on demand via the owning lexer).
    _value = "";
    _owner;
    pos = 0;
    end = 0;
    fileDescriptor = undefined;
    variableName = undefined;
    content = undefined;
    targetPos = 0;
    targetEnd = 0;
    assignmentOperatorPos = -1;
    // True when `value` is exactly the raw source span [pos, end) — lets consumers
    // reuse the string instead of slicing the source again.
    raw = false;
    // True when a word contains no quoting, escaped characters, or expansions.
    // Backslash-newline continuations preserve keyword eligibility.
    keywordEligible = false;
    constructor(owner = null) {
        this._owner = owner;
    }
    get value() {
        return (this._value ?? (this._value = this._owner === null ? "" : this._owner._tokenValue(this.pos, this.end, this.raw)));
    }
    set value(v) {
        this._value = v;
    }
    reset() {
        this.token = Token.EOF;
        this._value = "";
        this.pos = 0;
        this.end = 0;
        this.fileDescriptor = undefined;
        this.variableName = undefined;
        this.content = undefined;
        this.targetPos = 0;
        this.targetEnd = 0;
        this.assignmentOperatorPos = -1;
        this.raw = false;
        this.keywordEligible = false;
    }
    copyFrom(other) {
        this.token = other.token;
        this._value = other._value;
        this.pos = other.pos;
        this.end = other.end;
        this.fileDescriptor = other.fileDescriptor;
        this.variableName = other.variableName;
        this.content = other.content;
        this.targetPos = other.targetPos;
        this.targetEnd = other.targetEnd;
        this.assignmentOperatorPos = other.assignmentOperatorPos;
        this.raw = other.raw;
        this.keywordEligible = other.keywordEligible;
    }
}
const RESERVED_WORDS = new Map([
    ["if", Token.If],
    ["then", Token.Then],
    ["else", Token.Else],
    ["elif", Token.Elif],
    ["fi", Token.Fi],
    ["do", Token.Do],
    ["done", Token.Done],
    ["for", Token.For],
    ["while", Token.While],
    ["until", Token.Until],
    ["in", Token.In],
    ["case", Token.Case],
    ["esac", Token.Esac],
    ["function", Token.Function],
    ["select", Token.Select],
    ["coproc", Token.Coproc],
    ["!", Token.Bang],
    ["{", Token.LBrace],
    ["}", Token.RBrace],
]);
// `name()` is a syntax error for these; `time`, `[[` and `]]` are matched positionally
// rather than through RESERVED_WORDS.
export function requiresFunctionKeyword(name) {
    return RESERVED_WORDS.has(name) || name === "time" || name === "[[" || name === "]]";
}
// Combined character type table — bit 0: metachar, bit 1: word-special
const charType = new Uint8Array(128);
charType[CH_PIPE] = 1;
charType[CH_AMP] = 1;
charType[CH_SEMI] = 1;
charType[CH_LPAREN] = 1;
charType[CH_RPAREN] = 1;
charType[CH_LT] = 1;
charType[CH_GT] = 1;
charType[CH_SPACE] = 1;
charType[CH_TAB] = 1;
charType[CH_NL] = 1;
charType[CH_BACKSLASH] = 2;
charType[CH_SQUOTE] = 2;
charType[CH_DQUOTE] = 2;
charType[CH_DOLLAR] = 2;
charType[CH_BACKTICK] = 2;
charType[CH_LBRACE] = 2;
function skipLineContinuations(source, pos, end) {
    while (pos + 1 < end && source.charCodeAt(pos) === CH_BACKSLASH && source.charCodeAt(pos + 1) === CH_NL)
        pos += 2;
    return pos;
}
const arithmeticWordDelimiter = new Uint8Array(128);
for (const ch of [
    CH_TAB,
    CH_NL,
    CH_SPACE,
    CH_BANG,
    CH_PERCENT,
    CH_AMP,
    CH_LPAREN,
    CH_RPAREN,
    CH_STAR,
    CH_PLUS,
    CH_COMMA,
    CH_DASH,
    CH_SLASH,
    CH_COLON,
    CH_LT,
    CH_EQ,
    CH_GT,
    CH_QUESTION,
    CH_CARET,
    CH_PIPE,
]) {
    arithmeticWordDelimiter[ch] = 1;
}
export function hasEmbeddedWordStructure(source, start, end) {
    for (let pos = start; pos < end; pos++) {
        const ch = source.charCodeAt(pos);
        if (ch === CH_BACKSLASH ||
            ch === CH_SQUOTE ||
            ch === CH_DQUOTE ||
            ch === CH_DOLLAR ||
            ch === CH_BACKTICK ||
            ((ch === CH_LT || ch === CH_GT) && pos + 1 < end && source.charCodeAt(pos + 1) === CH_LPAREN)) {
            return true;
        }
    }
    return false;
}
function findUnnested(s, target, pairTernaries = false, findNestedEnd) {
    let depth = 0;
    let ternaryDepth = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (c === CH_BACKSLASH) {
            i++;
            continue;
        }
        if (c === CH_LBRACE) {
            depth++;
            continue;
        }
        if (c === CH_RBRACE) {
            if (depth > 0)
                depth--;
            continue;
        }
        if (c === CH_SQUOTE) {
            i++;
            while (i < s.length && s.charCodeAt(i) !== CH_SQUOTE)
                i++;
            continue;
        }
        if (c === CH_DQUOTE) {
            i++;
            while (i < s.length) {
                const quoted = s.charCodeAt(i);
                if (quoted === CH_DQUOTE)
                    break;
                if (quoted === CH_BACKSLASH) {
                    i += 2;
                    continue;
                }
                const nestedEnd = findNestedEnd?.(i, true) ?? i;
                if (nestedEnd > i) {
                    i = nestedEnd;
                    continue;
                }
                i++;
            }
            continue;
        }
        const nestedEnd = findNestedEnd?.(i, false) ?? i;
        if (nestedEnd > i) {
            i = nestedEnd - 1;
            continue;
        }
        if (pairTernaries && depth === 0) {
            if (c === CH_QUESTION) {
                ternaryDepth++;
                continue;
            }
            if (c === CH_COLON && ternaryDepth > 0) {
                ternaryDepth--;
                continue;
            }
        }
        if (c === target && depth === 0)
            return i;
    }
    return -1;
}
// Lookup: identifier chars (a-z, A-Z, 0-9, _) — bit 0: start, bit 1: continue
const isIdChar = new Uint8Array(128);
for (let i = CH_a; i <= CH_z; i++)
    isIdChar[i] = 3;
for (let i = CH_A; i <= CH_Z; i++)
    isIdChar[i] = 3;
for (let i = CH_0; i <= CH_9; i++)
    isIdChar[i] = 2;
isIdChar[CH_UNDERSCORE] = 3;
const extglobPrefix = new Uint8Array(128);
extglobPrefix[CH_QUESTION] = 1;
extglobPrefix[CH_AT] = 1;
extglobPrefix[CH_STAR] = 1;
extglobPrefix[CH_PLUS] = 1;
extglobPrefix[CH_BANG] = 1;
extglobPrefix[CH_EQ] = 1;
const extglobOp = {
    [CH_QUESTION]: "?",
    [CH_AT]: "@",
    [CH_STAR]: "*",
    [CH_PLUS]: "+",
    [CH_BANG]: "!",
};
function isDQChild(p) {
    const t = p.type;
    return (t === "Literal" ||
        t === "SimpleExpansion" ||
        t === "ParameterExpansion" ||
        t === "CommandExpansion" ||
        t === "ArithmeticExpansion");
}
function isAllDigits(text) {
    for (let i = 0; i < text.length; i++) {
        const c = text.charCodeAt(i);
        if (c < CH_0 || c > CH_9)
            return false;
    }
    return text.length > 0;
}
function isAllDigitsRange(src, start, end) {
    for (let i = start; i < end; i++) {
        const c = src.charCodeAt(i);
        if (c < CH_0 || c > CH_9)
            return false;
    }
    return end > start;
}
const ASSIGNMENT_INVALID = -1;
const ASSIGNMENT_NAME_START = 0;
const ASSIGNMENT_NAME = 1;
const ASSIGNMENT_AFTER_INDEX = 2;
const ASSIGNMENT_AFTER_PLUS = 3;
const ASSIGNMENT_INDEX_BASE = 4;
function isMatchedAssignment(state) {
    return state < ASSIGNMENT_INVALID;
}
function assignmentOperatorPos(state) {
    return -state - 2;
}
function scanAssignmentPrefix(src, start, end, initialState) {
    let state = initialState;
    for (let i = start; i < end && state >= 0; i++) {
        const c = src.charCodeAt(i);
        if (state >= ASSIGNMENT_INDEX_BASE) {
            if (c === CH_LBRACKET)
                state++;
            else if (c === CH_RBRACKET && --state === ASSIGNMENT_INDEX_BASE)
                state = ASSIGNMENT_AFTER_INDEX;
        }
        else if (state === ASSIGNMENT_NAME_START) {
            state = c < 128 && isIdChar[c] & 1 ? ASSIGNMENT_NAME : ASSIGNMENT_INVALID;
        }
        else if (state === ASSIGNMENT_NAME) {
            if (c < 128 && isIdChar[c] & 2)
                continue;
            if (c === CH_LBRACKET)
                state = ASSIGNMENT_INDEX_BASE + 1;
            else if (c === CH_PLUS)
                state = ASSIGNMENT_AFTER_PLUS;
            else
                state = c === CH_EQ ? -i - 2 : ASSIGNMENT_INVALID;
        }
        else if (state === ASSIGNMENT_AFTER_INDEX) {
            if (c === CH_PLUS)
                state = ASSIGNMENT_AFTER_PLUS;
            else
                state = c === CH_EQ ? -i - 2 : ASSIGNMENT_INVALID;
        }
        else {
            state = c === CH_EQ ? -i - 2 : ASSIGNMENT_INVALID;
        }
    }
    return state;
}
const NO_EXPANSIONS = [];
function setToken(out, token, value, pos = 0, end = 0) {
    out.token = token;
    out._value = value;
    out.pos = pos;
    out.end = end;
    out.fileDescriptor = undefined;
    out.variableName = undefined;
    out.content = undefined;
    out.assignmentOperatorPos = -1;
    out.raw = false;
    out.keywordEligible = false;
}
// Word token over [pos, end) whose value materializes on first access.
function setSpanToken(out, token, pos, end, raw) {
    out.token = token;
    out._value = null;
    out.pos = pos;
    out.end = end;
    out.fileDescriptor = undefined;
    out.variableName = undefined;
    out.content = undefined;
    out.assignmentOperatorPos = -1;
    out.raw = raw;
    out.keywordEligible = false;
}
// Positional reserved-word match over src[start, start+len) — no slice. Mirrors
// RESERVED_WORDS; first-char dispatch plus length checks reject fast.
function matchReservedWord(src, start, len) {
    switch (src.charCodeAt(start)) {
        case CH_BANG:
            return len === 1 ? Token.Bang : undefined;
        case CH_LBRACE:
            return len === 1 ? Token.LBrace : undefined;
        case CH_RBRACE:
            return len === 1 ? Token.RBrace : undefined;
        case 0x69 /* i */: {
            if (len !== 2)
                return undefined;
            const c = src.charCodeAt(start + 1);
            return c === 0x66 /* f */ ? Token.If : c === 0x6e /* n */ ? Token.In : undefined;
        }
        case 0x66 /* f */:
            if (len === 2)
                return src.charCodeAt(start + 1) === 0x69 /* i */ ? Token.Fi : undefined;
            if (len === 3)
                return src.startsWith("for", start) ? Token.For : undefined;
            if (len === 8)
                return src.startsWith("function", start) ? Token.Function : undefined;
            return undefined;
        case 0x74 /* t */:
            return len === 4 && src.startsWith("then", start) ? Token.Then : undefined;
        case 0x65 /* e */:
            if (len !== 4)
                return undefined;
            if (src.startsWith("else", start))
                return Token.Else;
            if (src.startsWith("elif", start))
                return Token.Elif;
            if (src.startsWith("esac", start))
                return Token.Esac;
            return undefined;
        case 0x64 /* d */:
            if (len === 2)
                return src.charCodeAt(start + 1) === 0x6f /* o */ ? Token.Do : undefined;
            if (len === 4)
                return src.startsWith("done", start) ? Token.Done : undefined;
            return undefined;
        case 0x63 /* c */:
            if (len === 4)
                return src.startsWith("case", start) ? Token.Case : undefined;
            if (len === 6)
                return src.startsWith("coproc", start) ? Token.Coproc : undefined;
            return undefined;
        case 0x77 /* w */:
            return len === 5 && src.startsWith("while", start) ? Token.While : undefined;
        case 0x75 /* u */:
            return len === 5 && src.startsWith("until", start) ? Token.Until : undefined;
        case 0x73 /* s */:
            return len === 6 && src.startsWith("select", start) ? Token.Select : undefined;
        default:
            return undefined;
    }
}
export const LexContext = {
    Normal: 0,
    CommandStart: 1,
    TestMode: 2,
    // After a prefix element: assignments still recognized, reserved words not.
    CommandPrefix: 3,
};
function scanBraceExpansion(src, pos, len) {
    const nextCh = pos + 1 < len ? src.charCodeAt(pos + 1) : 0;
    if (nextCh <= CH_SPACE || nextCh === CH_RBRACE)
        return -1;
    let depth = 1;
    let hasSep = false;
    let scanPos = pos + 1;
    while (scanPos < len && depth > 0) {
        const bc = src.charCodeAt(scanPos);
        if (bc === CH_LBRACE)
            depth++;
        else if (bc === CH_RBRACE) {
            if (--depth === 0)
                break;
        }
        else if (bc <= CH_SPACE || bc === CH_SEMI || bc === CH_PIPE || bc === CH_AMP)
            return -1;
        else if (depth === 1 &&
            (bc === 0x2c /* , */ || (bc === 0x2e /* . */ && scanPos + 1 < len && src.charCodeAt(scanPos + 1) === 0x2e)))
            hasSep = true;
        if (bc === CH_BACKSLASH)
            scanPos++;
        scanPos++;
    }
    if (depth === 0 && hasSep)
        return scanPos + 1;
    return -1;
}
export class Lexer {
    src;
    srcEnd;
    pos;
    current;
    nextState;
    hasPeek;
    pendingHereDocs;
    collectedExpansions;
    _errors = null;
    _buildParts = false;
    // Build processed text while scanning. Off on the normal token path (values
    // materialize lazily); on for redirect targets, heredoc delimiters, arithmetic
    // command bodies, and bounded value re-lexes. _buildParts implies it.
    _buildValue = false;
    // Nesting depth of the window being lexed (enclosing sub-fields plus substitution
    // scripts), sharing the MAX_SYNTAX_NESTING budget across lazily created lexers.
    _nestingDepth = 0;
    // `start`/`end` bound the lexer to a window of `src` so substitution scripts can be
    // parsed in place against the original source — every position is then absolute, with
    // no slicing or re-basing. Defaults cover the whole string (the common top-level parse).
    constructor(src, start = 0, end = src.length) {
        this.src = src;
        this.srcEnd = end;
        this.pos = start;
        this.current = new TokenValue(this);
        this.nextState = new TokenValue(this);
        this.hasPeek = false;
        this.pendingHereDocs = null;
        this.collectedExpansions = null;
        if (start === 0 && src.charCodeAt(0) === CH_HASH && src.charCodeAt(1) === CH_BANG) {
            const nl = src.indexOf("\n");
            this.pos = nl === -1 ? this.srcEnd : nl + 1;
        }
    }
    getSource() {
        return this.src;
    }
    get errors() {
        return this._errors ?? (this._errors = []);
    }
    getCollectedExpansions() {
        return this.collectedExpansions ?? NO_EXPANSIONS;
    }
    // Collected expansions resolve after the enclosing scan unwinds, so each records the
    // depth it was found at; resolveCollected charges that depth against the shared budget.
    collect(part) {
        (this.collectedExpansions ??= []).push([part, this._nestingDepth]);
    }
    getPos() {
        return this.pos;
    }
    /** Materialize a word token's value: raw spans slice directly, others re-lex the span. */
    _tokenValue(pos, end, raw) {
        return raw ? this.src.slice(pos, end) : this.wordValueOf(pos, end);
    }
    // Re-lex [start, end) in value mode to produce the processed word text. Bounded
    // to the span, so every expansion the original scan consumed closes within it.
    // Errors were already reported by the original scan; suppress duplicates.
    wordValueOf(start, end) {
        const savedPos = this.pos;
        const savedEnd = this.srcEnd;
        const savedBuildValue = this._buildValue;
        const savedUnbalanced = this._unbalanced;
        const errorCount = this._errors === null ? 0 : this._errors.length;
        this.pos = start;
        this.srcEnd = end;
        this._buildValue = true;
        this.readWordText();
        const value = this._wordText;
        this.pos = savedPos;
        this.srcEnd = savedEnd;
        this._buildValue = savedBuildValue;
        this._unbalanced = savedUnbalanced;
        if (this._errors !== null)
            this._errors.length = errorCount;
        return value;
    }
    /** Find the closing bracket for a shell subscript, ignoring brackets inside nested shell syntax. */
    findClosingBracket(start, end = this.srcEnd) {
        return this.findClosingShellDelimiter(start, end, CH_RBRACKET);
    }
    /** Find the closing bracket of `$[ … ]`, which unlike a subscript does not recurse into `${ }`. */
    findClosingArithmeticBracket(start, end = this.srcEnd) {
        return this.findClosingShellDelimiter(start, end, CH_RBRACKET, false, false);
    }
    /** Find the closing brace for a parameter expansion, ignoring braces inside nested shell syntax. */
    findClosingBrace(start, end = this.srcEnd) {
        return this.findClosingShellDelimiter(start, end, CH_RBRACE);
    }
    /** Find the closing parenthesis for a shell substitution using the command-aware scanner. */
    findClosingParenthesis(start, end = this.srcEnd) {
        const savedPos = this.pos;
        const savedEnd = this.srcEnd;
        const savedUnbalanced = this._unbalanced;
        this.pos = start;
        this.srcEnd = Math.min(end, this.srcEnd);
        this.extractBalanced();
        const close = this._unbalanced ? -1 : this.pos - 1;
        this.pos = savedPos;
        this.srcEnd = savedEnd;
        this._unbalanced = savedUnbalanced;
        return close;
    }
    /** Find the end of one arithmetic expansion using the canonical lexer scanner. */
    findArithmeticExpansionEnd(start, end = this.srcEnd) {
        const scanner = new Lexer(this.src, start, end);
        scanner.pos = start + 1;
        scanner.scanArithmeticBody();
        return scanner.pos;
    }
    /** Find the end of one shell-expanded arithmetic word using the canonical lexer scanners. */
    findArithmeticWordEnd(start, end = this.srcEnd) {
        const scanner = new Lexer(this.src, start, end);
        scanner.pos = start;
        return scanner.scanArithmeticWordEnd();
    }
    scanArithmeticWordEnd() {
        while (this.pos < this.srcEnd) {
            const ch = this.src.charCodeAt(this.pos);
            if (ch === CH_DOLLAR) {
                this.readDollar();
                continue;
            }
            if (ch === CH_BACKTICK) {
                this.readBacktickExpansion();
                continue;
            }
            if (ch === CH_SQUOTE) {
                this.pos++;
                this.skipSQ();
                continue;
            }
            if (ch === CH_DQUOTE) {
                this.pos++;
                this.skipDQ();
                continue;
            }
            if (ch === CH_BACKSLASH) {
                this.pos += 2;
                continue;
            }
            if (ch === CH_LBRACKET) {
                const close = this.findClosingBracket(this.pos + 1);
                if (close !== -1) {
                    this.pos = close + 1;
                    continue;
                }
            }
            if ((ch === CH_LT || ch === CH_GT) && this.src.charCodeAt(this.pos + 1) === CH_LPAREN) {
                this.pos += 2;
                this.extractBalanced();
                continue;
            }
            if (ch < 128 && arithmeticWordDelimiter[ch])
                break;
            this.pos++;
        }
        return this.pos;
    }
    // Only array assignment bodies take comments; extglob shares this scanner, and `#` is
    // pattern data there.
    findClosingShellDelimiter(start, end, closing, comments = false, braces = true) {
        const savedPos = this.pos;
        const savedEnd = this.srcEnd;
        const savedUnbalanced = this._unbalanced;
        this.srcEnd = Math.min(end, this.srcEnd);
        const delimiters = [closing];
        let pos = start;
        let wordStart = true;
        while (pos < this.srcEnd) {
            const ch = this.src.charCodeAt(pos);
            if (ch === CH_BACKSLASH) {
                if (pos + 1 < this.srcEnd && this.src.charCodeAt(pos + 1) !== CH_NL)
                    wordStart = false;
                pos += 2;
                continue;
            }
            if (ch === CH_HASH && comments && delimiters.length === 1 && wordStart) {
                while (pos < this.srcEnd && this.src.charCodeAt(pos) !== CH_NL)
                    pos++;
                continue;
            }
            if (ch === CH_SQUOTE) {
                this.pos = pos + 1;
                this.skipSQ();
                pos = this.pos;
                wordStart = false;
                continue;
            }
            if (ch === CH_DQUOTE) {
                this.pos = pos + 1;
                this.skipDQ();
                pos = this.pos;
                wordStart = false;
                continue;
            }
            if (ch === CH_BACKTICK) {
                pos++;
                while (pos < this.srcEnd && this.src.charCodeAt(pos) !== CH_BACKTICK) {
                    if (this.src.charCodeAt(pos) === CH_BACKSLASH)
                        pos++;
                    pos++;
                }
                if (pos < this.srcEnd)
                    pos++;
                wordStart = false;
                continue;
            }
            if ((ch === CH_DOLLAR && pos + 1 < this.srcEnd && this.src.charCodeAt(pos + 1) === CH_LPAREN) ||
                ((ch === CH_LT || ch === CH_GT) && pos + 1 < this.srcEnd && this.src.charCodeAt(pos + 1) === CH_LPAREN)) {
                this.pos = pos + 2;
                this.extractBalanced();
                pos = this.pos;
                wordStart = false;
                continue;
            }
            const expected = delimiters[delimiters.length - 1];
            if (ch === CH_DOLLAR && pos + 1 < this.srcEnd) {
                const after = this.src.charCodeAt(pos + 1);
                if (after === CH_DOLLAR) {
                    pos += 2; // `$$` consumes its second `$`, so a `{` after it opens nothing
                    wordStart = false;
                    continue;
                }
                if (after === CH_LBRACE && braces) {
                    delimiters.push(CH_RBRACE);
                    pos += 2;
                    wordStart = false;
                    continue;
                }
            }
            if (expected === CH_RBRACKET && ch === CH_LBRACKET) {
                delimiters.push(CH_RBRACKET);
            }
            else if (expected === CH_RPAREN && ch === CH_LPAREN) {
                delimiters.push(CH_RPAREN);
            }
            else if (ch === expected) {
                delimiters.pop();
                if (delimiters.length === 0) {
                    this.pos = savedPos;
                    this.srcEnd = savedEnd;
                    this._unbalanced = savedUnbalanced;
                    return pos;
                }
                wordStart = false;
                pos++;
                continue;
            }
            wordStart = ch < 128 && (charType[ch] & 1) !== 0;
            pos++;
        }
        this.pos = savedPos;
        this.srcEnd = savedEnd;
        this._unbalanced = savedUnbalanced;
        return -1;
    }
    skipSubshellBody() {
        this.extractBalanced();
        return this._unbalanced ? -1 : this.pos;
    }
    skipCompoundBody(closeToken) {
        const frames = [
            { close: closeToken, phase: closeToken === Token.Esac ? "case-pattern" : "commands" },
        ];
        let commandStart = true;
        for (;;) {
            const value = this.next(commandStart ? LexContext.CommandStart : LexContext.Normal);
            const token = value.token;
            if (token === Token.EOF)
                return -1;
            const last = frames.length - 1;
            const frame = frames[last];
            if (frame.phase === "function-name") {
                if (token === Token.Newline)
                    continue;
                frame.phase = "function-body";
                commandStart = true;
                continue;
            }
            else if (frame.phase === "function-body") {
                if (token === Token.Newline)
                    continue;
                frame.phase = "commands";
                commandStart = true;
                if (token === Token.LParen && this.peek(LexContext.Normal).token === Token.RParen) {
                    this.next(LexContext.Normal);
                    frame.phase = "function-body";
                    continue;
                }
            }
            else if (frame.phase === "coproc-command") {
                if (token === Token.Newline)
                    continue;
                if (token === Token.Word) {
                    frame.phase = "coproc-body";
                    commandStart = true;
                    continue;
                }
                frame.phase = "commands";
                commandStart = true;
            }
            else if (frame.phase === "coproc-body") {
                if (token === Token.Newline)
                    continue;
                frame.phase =
                    token === Token.Word && value.keywordEligible && value.value === "time" ? "time-command" : "commands";
                commandStart = true;
                if (frame.phase === "time-command")
                    continue;
            }
            else if (frame.phase === "time-command") {
                if (token === Token.Word && value.keywordEligible && value.value === "-p") {
                    frame.phase = "time-command-after-p";
                    continue;
                }
                if (token === Token.Word && value.keywordEligible && value.value === "--") {
                    frame.phase = "commands";
                    continue;
                }
                frame.phase = "commands";
                commandStart = true;
            }
            else if (frame.phase === "time-command-after-p") {
                if (token === Token.Word && value.keywordEligible && value.value === "--") {
                    frame.phase = "commands";
                    continue;
                }
                frame.phase = "commands";
                commandStart = true;
            }
            else if (frame.phase === "for-header") {
                if (token === Token.ArithCmd || token === Token.Semi || token === Token.Newline) {
                    commandStart = true;
                    continue;
                }
                if (token === Token.Do || token === Token.LBrace) {
                    frame.close = token === Token.Do ? Token.Done : Token.RBrace;
                    frame.phase = "commands";
                    commandStart = true;
                    continue;
                }
            }
            else if (frame.phase === "case-word") {
                if (token === Token.Newline)
                    continue;
                frame.phase = "case-in";
                commandStart = false;
                continue;
            }
            else if (frame.phase === "case-in") {
                if (token === Token.Newline) {
                    commandStart = true;
                    continue;
                }
                frame.phase = "case-pattern";
                commandStart = true;
                continue;
            }
            else if (frame.phase === "case-pattern") {
                if (token === Token.Esac && commandStart) {
                    frames.pop();
                    if (frames.length === 0)
                        return value.end;
                    commandStart = false;
                    continue;
                }
                if (token === Token.RParen) {
                    frame.phase = "commands";
                    commandStart = true;
                }
                else {
                    commandStart = token === Token.Newline;
                }
                continue;
            }
            if (token === frame.close) {
                frames.pop();
                if (frames.length === 0)
                    return value.end;
                commandStart = false;
                continue;
            }
            if (commandStart) {
                switch (token) {
                    case Token.LParen:
                        frames.push({ close: Token.RParen, phase: "commands" });
                        break;
                    case Token.LBrace:
                        frames.push({ close: Token.RBrace, phase: "commands" });
                        break;
                    case Token.If:
                        frames.push({ close: Token.Fi, phase: "commands" });
                        break;
                    case Token.For:
                        frames.push({ close: Token.Done, phase: "for-header" });
                        break;
                    case Token.While:
                    case Token.Until:
                    case Token.Select:
                        frames.push({ close: Token.Done, phase: "commands" });
                        break;
                    case Token.Case:
                        frames.push({ close: Token.Esac, phase: "case-word" });
                        break;
                    case Token.DblLBracket:
                        if (!this.skipTestCommandBody())
                            return -1;
                        commandStart = false;
                        continue;
                    case Token.Assignment:
                    case Token.Redirect:
                    case Token.Bang:
                    case Token.Then:
                    case Token.Else:
                    case Token.Elif:
                    case Token.Do:
                    case Token.In:
                        break;
                    case Token.Semi:
                    case Token.Newline:
                    case Token.Pipe:
                    case Token.And:
                    case Token.Or:
                    case Token.Amp:
                    case Token.DoubleSemi:
                    case Token.SemiAmp:
                    case Token.DoubleSemiAmp:
                        break;
                    case Token.Function:
                        frame.phase = "function-name";
                        break;
                    case Token.Coproc:
                        frame.phase = "coproc-command";
                        break;
                    default:
                        if (token === Token.Word && value.keywordEligible && value.value === "time") {
                            frame.phase = "time-command";
                            commandStart = true;
                        }
                        else {
                            commandStart = false;
                        }
                        continue;
                }
            }
            switch (token) {
                case Token.Semi:
                case Token.Newline:
                case Token.Pipe:
                case Token.And:
                case Token.Or:
                case Token.Amp:
                    commandStart = true;
                    break;
                case Token.DoubleSemi:
                case Token.SemiAmp:
                case Token.DoubleSemiAmp:
                    if (frame.close === Token.Esac)
                        frame.phase = "case-pattern";
                    commandStart = true;
                    break;
                case Token.RParen:
                    commandStart = true;
                    break;
            }
        }
    }
    skipTestGroup() {
        let depth = 1;
        for (;;) {
            const value = this.next(LexContext.TestMode);
            if (value.token === Token.EOF)
                return -1;
            if (value.token === Token.DblRBracket) {
                this.unshift(value);
                return -1;
            }
            if (value.token === Token.LParen)
                depth++;
            else if (value.token === Token.RParen && --depth === 0)
                return value.end;
        }
    }
    skipTestCommandBody() {
        for (;;) {
            const token = this.next(LexContext.TestMode).token;
            if (token === Token.DblRBracket)
                return true;
            if (token === Token.EOF)
                return false;
        }
    }
    /** Set position and scan a word, building parts. Used by computeWordParts. */
    buildWordParts(startPos) {
        this._buildParts = true;
        this.pos = startPos;
        // Handle process substitution words <(...) and >(...)
        const ch = this.src.charCodeAt(startPos);
        if ((ch === 0x3c /* < */ || ch === 0x3e) /* > */ &&
            startPos + 1 < this.srcEnd &&
            this.src.charCodeAt(startPos + 1) === 0x28 /* ( */) {
            this.pos = startPos + 2;
            const inner = this.extractBalanced();
            if (this._unbalanced)
                this.errors.push({ message: "unterminated process substitution", pos: startPos });
            const text = this.src.slice(startPos, this.pos);
            const part = {
                type: "ProcessSubstitution",
                text,
                operator: ch === 0x3c ? "<" : ">",
                script: undefined,
                inner: inner ?? undefined,
                innerStart: startPos + 2,
            };
            this.collect(part);
            // Continue reading any trailing word text (e.g., suffix after proc sub)
            if (this.pos < this.srcEnd) {
                this.readWordText();
                if (this._wordParts) {
                    this._wordParts.unshift(part);
                }
                else {
                    this._wordParts = [part];
                }
            }
            else {
                this._wordParts = [part];
            }
        }
        else {
            this.readWordText();
        }
        return this._wordParts;
    }
    /** Scan a bounded word-like span without treating shell operators or whitespace as terminators. */
    buildEmbeddedWordParts(startPos) {
        this._buildParts = true;
        this.pos = startPos;
        this.readInnerWordText();
        return this._wordParts;
    }
    /** Scan a heredoc body for expansions, building parts. Spaces/newlines are literal. */
    buildHereDocParts(bodyPos, bodyEnd) {
        this._buildParts = true;
        const src = this.src;
        const parts = [];
        let litBuf = "";
        let litStart = bodyPos;
        let i = bodyPos;
        const flushLit = () => {
            if (litBuf) {
                parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, i) });
                litBuf = "";
            }
        };
        while (i < bodyEnd) {
            const ch = src.charCodeAt(i);
            if (ch === 0x5c /* \\ */) {
                // Backslash escape — in unquoted heredoc, \\$, \\`, \\\\ are special
                if (i + 1 < bodyEnd) {
                    const nc = src.charCodeAt(i + 1);
                    if (nc === 0x24 /* $ */ || nc === 0x60 /* ` */ || nc === 0x5c /* \\ */) {
                        litBuf += String.fromCharCode(nc);
                        i += 2;
                        continue;
                    }
                }
                litBuf += "\\";
                i++;
                continue;
            }
            if (ch === 0x24 /* $ */) {
                flushLit();
                litStart = i;
                this.pos = i;
                this.readDollar();
                if (this._resultPart) {
                    parts.push(this._resultPart);
                    litStart = this.pos;
                }
                else {
                    litBuf += src.slice(i, this.pos);
                }
                i = this.pos;
                continue;
            }
            if (ch === 0x60 /* ` */) {
                flushLit();
                litStart = i;
                this.pos = i;
                this.readBacktickExpansion();
                if (this._resultPart) {
                    parts.push(this._resultPart);
                    litStart = this.pos;
                }
                else {
                    litBuf += src.slice(i, this.pos);
                }
                i = this.pos;
                continue;
            }
            litBuf += src[i];
            i++;
        }
        flushLit();
        return parts.length > 1 || (parts.length === 1 && parts[0].type !== "Literal") ? parts : null;
    }
    registerHereDocTarget(target) {
        if (this.pendingHereDocs === null)
            return;
        for (const hd of this.pendingHereDocs) {
            if (!hd.target) {
                hd.target = target;
                return;
            }
        }
    }
    // Read the right-hand operand of =~ in [[ ]]. Bash ends the operand at
    // depth-zero whitespace, `)`, `;`, `&`, `<`, or `>` (but `<(`/`>(` open a
    // process substitution and `|` never delimits). An unquoted `(` opens a
    // group that consumes everything — `]]`, newlines, and metacharacters
    // included — until its matching `)`; inside a group only quotes stay opaque
    // and expansion parens count naively, matching bash. Quotes and expansions
    // at depth zero skip via the same readers normal words use, so their errors
    // and spans stay identical. The token is the raw source span; value and
    // parts resolve lazily like every other word.
    readTestRegexWord() {
        this.hasPeek = false;
        this.skipSpacesAndTabs();
        const src = this.src;
        const len = this.srcEnd;
        const start = this.pos;
        let depth = 0;
        while (this.pos < len) {
            const ch = src.charCodeAt(this.pos);
            if (ch === CH_LPAREN) {
                depth++;
                this.pos++;
                continue;
            }
            if (ch === CH_BACKSLASH) {
                this.pos += this.pos + 1 < len ? 2 : 1;
                continue;
            }
            if (ch === CH_SQUOTE) {
                const quotePos = this.pos++;
                const ansiC = quotePos > start && src.charCodeAt(quotePos - 1) === CH_DOLLAR;
                while (this.pos < len && src.charCodeAt(this.pos) !== CH_SQUOTE) {
                    if (ansiC && src.charCodeAt(this.pos) === CH_BACKSLASH && this.pos + 1 < len)
                        this.pos++;
                    this.pos++;
                }
                if (this.pos < len)
                    this.pos++;
                else
                    this.errors.push({
                        message: ansiC ? "unterminated ANSI-C quote" : "unterminated single quote",
                        pos: quotePos,
                    });
                continue;
            }
            if (ch === CH_DQUOTE) {
                this.pos++;
                this.readDoubleQuoted();
                continue;
            }
            if (ch === CH_BACKTICK) {
                this.readBacktickExpansion();
                continue;
            }
            if (depth > 0) {
                if (ch === CH_RPAREN)
                    depth--;
                this.pos++;
                continue;
            }
            if (ch === CH_DOLLAR) {
                this.readDollar();
                continue;
            }
            if ((ch === CH_LT || ch === CH_GT) && this.pos + 1 < len && src.charCodeAt(this.pos + 1) === CH_LPAREN) {
                const subPos = this.pos;
                this.pos += 2;
                this.extractBalanced();
                if (this._unbalanced)
                    this.errors.push({ message: "unterminated process substitution", pos: subPos });
                continue;
            }
            if (ch < 128 && charType[ch] & 1 && ch !== CH_PIPE)
                break;
            this.pos++;
        }
        setToken(this.current, Token.Word, src.slice(start, this.pos), start, this.pos);
        return this.current;
    }
    // Read C-style for expressions: called after first '(' consumed by parser.
    // Expects pos at second '('. Returns [init, test, update] raw text.
    readCStyleForExprs() {
        this.hasPeek = false; // discard any peeked token
        const src = this.src;
        const len = this.srcEnd;
        // Skip spaces to second '('
        while (this.pos < len && (src.charCodeAt(this.pos) === CH_SPACE || src.charCodeAt(this.pos) === CH_TAB))
            this.pos++;
        if (this.pos < len && src.charCodeAt(this.pos) === CH_LPAREN)
            this.pos++;
        const starts = [this.pos, 0, 0];
        const parts = ["", "", "", 0, 0, 0];
        let partIdx = 0;
        let depth = 1;
        let partStart = this.pos;
        while (this.pos < len && depth > 0) {
            const c = src.charCodeAt(this.pos);
            if (c === CH_LPAREN) {
                depth++;
                this.pos++;
            }
            else if (c === CH_RPAREN) {
                depth--;
                if (depth === 0) {
                    const raw = src.slice(partStart, this.pos);
                    parts[partIdx] = raw.trim();
                    parts[3 + partIdx] = starts[partIdx] + raw.length - raw.trimStart().length;
                    this.pos++; // skip closing )
                    // Skip the outer ) as well
                    while (this.pos < len && (src.charCodeAt(this.pos) === CH_SPACE || src.charCodeAt(this.pos) === CH_TAB))
                        this.pos++;
                    if (this.pos < len && src.charCodeAt(this.pos) === CH_RPAREN)
                        this.pos++;
                    break;
                }
                this.pos++;
            }
            else if (c === CH_SEMI && depth === 1) {
                const raw = src.slice(partStart, this.pos);
                parts[partIdx] = raw.trim();
                parts[3 + partIdx] = starts[partIdx] + raw.length - raw.trimStart().length;
                if (partIdx < 2)
                    partIdx++;
                this.pos++;
                partStart = this.pos;
                starts[partIdx] = partStart;
            }
            else if (c === CH_SQUOTE) {
                this.pos++;
                this.skipSQ();
            }
            else if (c === CH_DQUOTE) {
                this.pos++;
                this.skipDQ();
            }
            else {
                this.pos++;
            }
        }
        return parts;
    }
    peek(ctx = LexContext.Normal) {
        if (!this.hasPeek) {
            this.readNext(this.nextState, ctx);
            this.hasPeek = true;
        }
        return this.nextState;
    }
    // Peek where the context depends on the token just consumed. peek() ignores its ctx once a
    // token is cached, so the caller's context must only be derived when a read actually happens.
    peekFollow(closers) {
        if (!this.hasPeek) {
            const ctx = closers[this.current.token] ? LexContext.CommandStart : LexContext.Normal;
            this.readNext(this.nextState, ctx);
            this.hasPeek = true;
        }
        return this.nextState;
    }
    next(ctx = LexContext.Normal) {
        if (this.hasPeek) {
            this.hasPeek = false;
            const temp = this.current;
            this.current = this.nextState;
            this.nextState = temp;
            return this.current;
        }
        this.readNext(this.current, ctx);
        return this.current;
    }
    unshift(tok) {
        this.nextState.copyFrom(tok);
        this.hasPeek = true;
    }
    readNext(out, ctx) {
        const src = this.src;
        const len = this.srcEnd;
        // Skip spaces and tabs (inlined for hot path)
        let pos = this.pos;
        while (pos < len) {
            const ch = src.charCodeAt(pos);
            if (ch === CH_SPACE || ch === CH_TAB) {
                pos++;
                continue;
            }
            if (ch === CH_BACKSLASH && pos + 1 < len && src.charCodeAt(pos + 1) === CH_NL) {
                pos += 2;
                continue;
            }
            // Inside [[ ]], newlines are whitespace
            if (ch === CH_NL && ctx === LexContext.TestMode) {
                pos++;
                continue;
            }
            break;
        }
        this.pos = pos;
        if (pos >= len) {
            this.consumePendingHereDocs();
            setToken(out, Token.EOF, "", pos, pos);
            return;
        }
        const tokenStart = pos;
        const ch = src.charCodeAt(pos);
        if (ch === CH_HASH) {
            // Skip comment
            while (this.pos < len && src.charCodeAt(this.pos) !== CH_NL)
                this.pos++;
            this.readNext(out, ctx);
            return;
        }
        if (ch === CH_NL) {
            this.pos++;
            this.consumePendingHereDocs();
            setToken(out, Token.Newline, "\n", tokenStart, this.pos);
            return;
        }
        // In test mode (inside [[ ]]), < and > are string comparison operators, not redirects —
        // except for an adjacent '(', which still opens a process substitution
        if (ctx === LexContext.TestMode &&
            (ch === CH_LT || ch === CH_GT) &&
            !(this.pos + 1 < this.srcEnd && src.charCodeAt(this.pos + 1) === CH_LPAREN)) {
            this.pos++;
            setToken(out, Token.Word, ch === CH_LT ? "<" : ">", tokenStart, this.pos);
            out.keywordEligible = true; // written unquoted, so it is the comparison operator
            return;
        }
        // Operators all start with a metachar; anything else is a word
        if (ch < 128 && charType[ch] & 1 && this.tryReadOperator(out, ch, ctx, tokenStart))
            return;
        this.readWord(out, ctx, tokenStart);
    }
    tryReadOperator(out, ch, ctx, tokenStart) {
        const src = this.src;
        const pos = this.pos;
        const next = pos + 1 < this.srcEnd ? src.charCodeAt(pos + 1) : 0;
        switch (ch) {
            case CH_SEMI:
                if (next === CH_SEMI) {
                    if (pos + 2 < this.srcEnd && src.charCodeAt(pos + 2) === CH_AMP) {
                        this.pos += 3;
                        setToken(out, Token.DoubleSemiAmp, ";;&", tokenStart, this.pos);
                        return true;
                    }
                    this.pos += 2;
                    setToken(out, Token.DoubleSemi, ";;", tokenStart, this.pos);
                    return true;
                }
                if (next === CH_AMP) {
                    this.pos += 2;
                    setToken(out, Token.SemiAmp, ";&", tokenStart, this.pos);
                    return true;
                }
                this.pos++;
                setToken(out, Token.Semi, ";", tokenStart, this.pos);
                return true;
            case CH_PIPE:
                if (next === CH_PIPE) {
                    this.pos += 2;
                    setToken(out, Token.Or, "||", tokenStart, this.pos);
                    return true;
                }
                if (next === CH_AMP) {
                    this.pos += 2;
                    setToken(out, Token.Pipe, "|&", tokenStart, this.pos);
                    return true;
                } // |& → pipe (stderr merge)
                this.pos++;
                setToken(out, Token.Pipe, "|", tokenStart, this.pos);
                return true;
            case CH_AMP:
                if (next === CH_AMP) {
                    this.pos += 2;
                    setToken(out, Token.And, "&&", tokenStart, this.pos);
                    return true;
                }
                if (next === CH_GT) {
                    // &> or &>> — redirect, not background
                    this.pos += 2;
                    const append = this.pos < this.srcEnd && src.charCodeAt(this.pos) === CH_GT;
                    if (append)
                        this.pos++;
                    this.skipSpacesAndTabs();
                    const targetPos = this.pos;
                    if (this.pos < this.srcEnd && src.charCodeAt(this.pos) !== CH_NL && src.charCodeAt(this.pos) !== CH_HASH) {
                        this.readRedirectTargetText();
                    }
                    this.redirectToken(out, append ? "&>>" : "&>", tokenStart, targetPos);
                    return true;
                }
                this.pos++;
                setToken(out, Token.Amp, "&", tokenStart, this.pos);
                return true;
            case CH_LPAREN:
                if (ctx === LexContext.CommandStart && next === CH_LPAREN) {
                    const savedErrors = this.errors.length;
                    this.readArithmeticCommand(out, tokenStart);
                    if (!this._notArithmetic)
                        return true;
                    this.errors.length = savedErrors;
                    this.pos = tokenStart;
                }
                this.pos++;
                setToken(out, Token.LParen, "(", tokenStart, this.pos);
                return true;
            case CH_RPAREN:
                this.pos++;
                setToken(out, Token.RParen, ")", tokenStart, this.pos);
                return true;
            case CH_LT:
            case CH_GT:
                return this.readRedirection(out, tokenStart);
            default:
                return false;
        }
    }
    readRedirection(out, tokenStart) {
        const src = this.src;
        const ch = src.charCodeAt(this.pos);
        let op = "";
        if (ch === CH_LT) {
            this.pos++;
            const next = this.pos < this.srcEnd ? src.charCodeAt(this.pos) : 0;
            if (next === CH_LT) {
                this.pos++;
                const third = this.pos < this.srcEnd ? src.charCodeAt(this.pos) : 0;
                if (third === CH_LT) {
                    // <<< herestring
                    this.pos++;
                    this.skipSpacesAndTabs();
                    const targetPos = this.pos;
                    if (this.pos < this.srcEnd && src.charCodeAt(this.pos) !== CH_NL && src.charCodeAt(this.pos) !== CH_HASH) {
                        this.readRedirectTargetText();
                    }
                    this.redirectToken(out, "<<<", tokenStart, targetPos);
                    return true;
                }
                const dash = third === CH_DASH;
                if (dash)
                    this.pos++;
                this.skipSpacesAndTabs();
                const targetPos = this.pos;
                if (this.pos >= this.srcEnd || src.charCodeAt(this.pos) !== CH_HASH)
                    this.readHereDocDelimiter();
                const hasTarget = this.pos > targetPos;
                if (hasTarget) {
                    (this.pendingHereDocs ??= []).push({ delimiter: this._hereDelim, strip: dash, quoted: this._hereQuoted });
                }
                setToken(out, Token.Redirect, dash ? "<<-" : "<<", tokenStart, this.pos);
                out.content = hasTarget ? this._hereDelim : undefined;
                out.targetPos = targetPos;
                out.targetEnd = hasTarget ? this.pos : targetPos;
                return true;
            }
            if (next === CH_LPAREN) {
                this.readProcessSubstitution(out, "<", tokenStart);
                return true;
            }
            if (next === CH_GT) {
                op = "<>";
                this.pos++;
            }
            else if (next === CH_AMP) {
                op = "<&";
                this.pos++;
            }
            else {
                op = "<";
            }
        }
        else if (ch === CH_GT) {
            this.pos++;
            const next = this.pos < this.srcEnd ? src.charCodeAt(this.pos) : 0;
            if (next === CH_LPAREN) {
                this.readProcessSubstitution(out, ">", tokenStart);
                return true;
            }
            if (next === CH_GT) {
                op = ">>";
                this.pos++;
            }
            else if (next === CH_AMP) {
                op = ">&";
                this.pos++;
            }
            else if (next === CH_PIPE) {
                op = ">|";
                this.pos++;
            }
            else {
                op = ">";
            }
        }
        this.skipSpacesAndTabs();
        if (this.pos < this.srcEnd) {
            const nc = src.charCodeAt(this.pos);
            if ((nc === CH_LT || nc === CH_GT) && this.pos + 1 < this.srcEnd && src.charCodeAt(this.pos + 1) === CH_LPAREN) {
                const psStart = this.pos;
                this.pos += 2;
                this.extractBalanced();
                if (this._unbalanced)
                    this.errors.push({ message: "unterminated process substitution", pos: psStart });
                const psText = src.slice(psStart, this.pos);
                setToken(out, Token.Redirect, op, tokenStart, this.pos);
                out.content = psText;
                out.targetPos = psStart;
                out.targetEnd = this.pos;
                return true;
            }
            const targetPos = this.pos;
            if (nc !== CH_NL && nc !== CH_HASH)
                this.readRedirectTargetText();
            this.redirectToken(out, op, tokenStart, targetPos);
            return true;
        }
        this.redirectToken(out, op, tokenStart, this.pos);
        return true;
    }
    // Redirect targets keep their processed text eagerly (it becomes the target
    // word's content), so scan them in value mode.
    readRedirectTargetText() {
        const savedBuildValue = this._buildValue;
        this._buildValue = true;
        this.readWordText();
        this._buildValue = savedBuildValue;
    }
    redirectToken(out, operator, tokenStart, targetPos) {
        const hasTarget = this.pos > targetPos && (this._wordText.length > 0 || this._wordQuoted);
        setToken(out, Token.Redirect, operator, tokenStart, this.pos);
        out.content = hasTarget ? this._wordText : undefined;
        out.targetPos = targetPos;
        out.targetEnd = hasTarget ? this.pos : targetPos;
    }
    readProcessSubstitution(out, operator, tokenStart) {
        this.pos++; // skip (
        this.extractBalanced();
        if (this._unbalanced)
            this.errors.push({ message: "unterminated process substitution", pos: tokenStart });
        const text = this.src.slice(tokenStart, this.pos);
        setToken(out, Token.Word, text, tokenStart, this.pos);
    }
    // The delimiter is the word after quote removal: quote and escape segments may
    // appear anywhere in the word, any of them makes the heredoc quoted, and inside
    // double quotes a backslash is removed only before $ ` " \.
    readHereDocDelimiter() {
        const src = this.src;
        const len = this.srcEnd;
        const savedBuildValue = this._buildValue;
        this._buildValue = true; // the delimiter is assembled from processed segments
        let delimiter = "";
        let quoted = false;
        while (this.pos < len) {
            const c = src.charCodeAt(this.pos);
            if (c === CH_SQUOTE) {
                quoted = true;
                this.pos++;
                while (this.pos < len && src.charCodeAt(this.pos) !== CH_SQUOTE) {
                    delimiter += src[this.pos];
                    this.pos++;
                }
                if (this.pos < len)
                    this.pos++;
            }
            else if (c === CH_DQUOTE) {
                quoted = true;
                this.pos++;
                while (this.pos < len && src.charCodeAt(this.pos) !== CH_DQUOTE) {
                    if (src.charCodeAt(this.pos) === CH_BACKSLASH && this.pos + 1 < len) {
                        const next = src.charCodeAt(this.pos + 1);
                        if (next === CH_NL) {
                            this.pos += 2;
                            continue;
                        }
                        if (next === CH_DOLLAR || next === CH_BACKTICK || next === CH_DQUOTE || next === CH_BACKSLASH)
                            this.pos++;
                    }
                    delimiter += src[this.pos];
                    this.pos++;
                }
                if (this.pos < len)
                    this.pos++;
            }
            else if (c === CH_BACKSLASH) {
                if (this.pos + 1 < len && src.charCodeAt(this.pos + 1) === CH_NL) {
                    this.pos += 2;
                    continue;
                }
                quoted = true;
                this.pos++;
                if (this.pos < len) {
                    delimiter += src[this.pos];
                    this.pos++;
                }
                else {
                    delimiter += "\\"; // trailing backslash escapes nothing and stays as itself
                }
            }
            else if (c === CH_BACKTICK) {
                const btStart = this.pos;
                this.pos++;
                while (this.pos < len && src.charCodeAt(this.pos) !== CH_BACKTICK) {
                    if (src.charCodeAt(this.pos) === CH_BACKSLASH)
                        this.pos++;
                    this.pos++;
                }
                if (this.pos < len)
                    this.pos++;
                delimiter += src.slice(btStart, this.pos);
            }
            else if (c === CH_DOLLAR) {
                const next = this.pos + 1 < len ? src.charCodeAt(this.pos + 1) : 0;
                if (next === CH_SQUOTE || next === CH_DQUOTE)
                    quoted = true;
                this.readDollar();
                delimiter += this._resultText;
            }
            else if (c < 128 && charType[c] & 1) {
                break;
            }
            else {
                delimiter += src[this.pos];
                this.pos++;
            }
        }
        this._buildValue = savedBuildValue;
        this._hereDelim = delimiter;
        this._hereQuoted = quoted;
    }
    consumePendingHereDocs() {
        const pending = this.pendingHereDocs;
        if (pending === null || pending.length === 0)
            return;
        for (const hd of pending) {
            const bodyPos = this.pos;
            const body = this.readHereDocBody(hd.delimiter, hd.strip);
            if (hd.target) {
                hd.target.content = body;
                if (hd.quoted) {
                    hd.target.heredocQuoted = true;
                }
                else if (body) {
                    const parsed = this.parseHereDocBody(body, bodyPos);
                    if (parsed)
                        hd.target.body = parsed;
                }
            }
        }
        pending.length = 0;
    }
    readHereDocBody(delimiter, strip) {
        const bodyStart = this.pos;
        const bodyEnd = this.skipHereDocBody(delimiter, strip);
        return this.src.slice(bodyStart, bodyEnd);
    }
    // Advance past the heredoc body and its delimiter line; return the body end
    // (start of the delimiter line, or srcEnd when delimited by end-of-input).
    // With parenEnds (inside $(...)), a line starting with the delimiter directly
    // followed by ")" also terminates the body, resuming at the ")" — bash treats
    // the substitution's closing paren as end-of-file for its heredocs.
    // `join` crosses `\`+newline pairs, which an unquoted delimiter may straddle.
    matchHereDocDelimiter(delimiter, lineStart, end, join) {
        const src = this.src;
        let pos = lineStart;
        for (let i = 0; i < delimiter.length;) {
            if (join && src.charCodeAt(pos) === CH_BACKSLASH && pos + 1 < end && src.charCodeAt(pos + 1) === CH_NL) {
                pos += 2;
                continue;
            }
            if (pos >= end || src.charCodeAt(pos) !== delimiter.charCodeAt(i))
                return -1;
            pos++;
            i++;
        }
        return pos;
    }
    // A `\` consumes the next character, so `\`+newline continues the line and `\\` does not.
    logicalLineEnd(from, end, join) {
        const src = this.src;
        let pos = from;
        while (pos < end) {
            const c = src.charCodeAt(pos);
            if (c === CH_NL)
                return pos;
            pos += join && c === CH_BACKSLASH ? 2 : 1;
        }
        return end;
    }
    skipHereDocBody(delimiter, strip, parenEnds = false, quoted = false) {
        const src = this.src;
        const len = this.srcEnd;
        const dLen = delimiter.length;
        while (this.pos < len) {
            let lineStart = this.pos;
            let lineEnd = src.indexOf("\n", this.pos);
            if (lineEnd === -1 || lineEnd > len)
                lineEnd = len;
            if (strip) {
                while (lineStart < lineEnd && src.charCodeAt(lineStart) === CH_TAB)
                    lineStart++;
            }
            if (lineEnd - lineStart === dLen && src.startsWith(delimiter, lineStart)) {
                const bodyEnd = this.pos;
                this.pos = lineEnd < len ? lineEnd + 1 : lineEnd;
                return bodyEnd;
            }
            // A line starting with the delimiter also ends the body when a `)` follows on the same
            // logical line; the scan then resumes mid-line, right after the delimiter.
            if (parenEnds) {
                const afterDelim = this.matchHereDocDelimiter(delimiter, lineStart, len, !quoted);
                if (afterDelim !== -1) {
                    const paren = src.indexOf(")", afterDelim);
                    if (paren !== -1 && paren < this.logicalLineEnd(lineStart, len, !quoted)) {
                        const bodyEnd = this.pos;
                        this.pos = afterDelim;
                        return bodyEnd;
                    }
                }
            }
            this.pos = lineEnd < len ? lineEnd + 1 : lineEnd;
        }
        return this.pos;
    }
    // Scan an unquoted heredoc body for expansions ($var, ${...}, $(...), `...`).
    // Returns a Word (without parts — use computeWordParts for those) if expansions exist.
    parseHereDocBody(body, bodyPos) {
        // Quick scan: if no $ or backtick, no expansions possible
        let hasExpansion = false;
        for (let i = 0; i < body.length; i++) {
            const c = body.charCodeAt(i);
            if (c === CH_BACKTICK) {
                hasExpansion = true;
                break;
            }
            if (c === CH_DOLLAR) {
                // Check next char — bare $ at end or before space/newline is literal
                const next = i + 1 < body.length ? body.charCodeAt(i + 1) : 0;
                if (next === CH_LBRACE ||
                    next === CH_LPAREN ||
                    next === CH_DOLLAR ||
                    (next >= CH_a && next <= CH_z) ||
                    (next >= CH_A && next <= CH_Z) ||
                    next === CH_UNDERSCORE ||
                    next === CH_BANG ||
                    next === CH_HASH ||
                    next === CH_AT ||
                    next === CH_STAR ||
                    next === CH_QUESTION ||
                    next === CH_DASH ||
                    (next >= CH_0 && next <= CH_9)) {
                    hasExpansion = true;
                    break;
                }
            }
            if (c === CH_BACKSLASH)
                i++; // skip escaped char
        }
        if (!hasExpansion)
            return null;
        return new WordImpl(body, bodyPos, bodyPos + body.length, this.src, WordImpl._resolveHeredocBody, this._nestingDepth);
    }
    _wordText = "";
    _wordRaw = false;
    _wordQuoted = false;
    _wordHasExpansions = false;
    _wordKeywordEligible = false;
    _wordIsAssignment;
    _wordAssignmentOperatorPos;
    _wordParts = null;
    _resultText = "";
    // True when the last $-construct's value is exactly its raw source span.
    _resultIsRaw = true;
    _resultHasExpansion = false;
    _resultPart;
    // Set by extractBalanced when the input ended before the closing paren, so
    // callers can report the construct they were scanning.
    _unbalanced = false;
    // Set by scanArithmeticBody when the construct turns out not to be arithmetic, so the
    // caller can re-read it as a subshell or command substitution instead.
    _notArithmetic = false;
    _dqText = "";
    _dqHasExpansions = false;
    _dqParts = null;
    // Content end (before the closing quote, or end of input when unterminated).
    _dqEnd = 0;
    _hereDelim = "";
    _hereQuoted = false;
    readWord(out, ctx, tokenStart = 0) {
        this.readWordText();
        this.classifyWord(out, ctx, tokenStart);
    }
    classifyWord(out, ctx, tokenStart) {
        const src = this.src;
        const raw = this._wordRaw;
        const hasExpansions = this._wordHasExpansions;
        const quoted = this._wordQuoted;
        const keywordEligible = this._wordKeywordEligible;
        const isAssignment = this._wordIsAssignment;
        let assignmentOpPos = this._wordAssignmentOperatorPos;
        const wordEnd = this.pos;
        const wordLen = wordEnd - tokenStart;
        // The checks below run on the raw span for raw words. The few non-raw words
        // they could still match — keyword/]] spellings via line continuations or
        // quote decoding (short, unquoted) and fd prefixes (followed by < or >) —
        // materialize their processed value here.
        let value = null;
        if (!raw && !hasExpansions) {
            const nextCh = wordEnd < this.srcEnd ? src.charCodeAt(wordEnd) : 0;
            if ((!quoted && wordLen <= 16) || nextCh === CH_LT || nextCh === CH_GT) {
                value = this.wordValueOf(tokenStart, wordEnd);
            }
        }
        if (ctx === LexContext.CommandStart && keywordEligible) {
            if (raw) {
                if (wordLen <= 8) {
                    const reserved = matchReservedWord(src, tokenStart, wordLen);
                    if (reserved !== undefined) {
                        setSpanToken(out, reserved, tokenStart, wordEnd, true);
                        return;
                    }
                }
                if (wordLen === 2 &&
                    src.charCodeAt(tokenStart) === CH_LBRACKET &&
                    src.charCodeAt(tokenStart + 1) === CH_LBRACKET) {
                    setSpanToken(out, Token.DblLBracket, tokenStart, wordEnd, true);
                    return;
                }
            }
            else if (value !== null && value.length > 0) {
                const fc = value.charCodeAt(0);
                if ((fc >= CH_a && fc <= CH_z && value.length <= 8) || fc === CH_BANG || fc === CH_LBRACE || fc === CH_RBRACE) {
                    const reserved = RESERVED_WORDS.get(value);
                    if (reserved !== undefined) {
                        setToken(out, reserved, value, tokenStart, wordEnd);
                        return;
                    }
                }
                if (fc === CH_LBRACKET && value === "[[") {
                    setToken(out, Token.DblLBracket, value, tokenStart, wordEnd);
                    return;
                }
            }
        }
        if (ctx === LexContext.CommandStart || ctx === LexContext.CommandPrefix) {
            if (isAssignment === undefined) {
                // Fast-path word (value === raw span): detect assignment positionally.
                let eq = -1;
                let bracket = false;
                for (let i = tokenStart + 1; i < wordEnd; i++) {
                    const c = src.charCodeAt(i);
                    if (c === CH_EQ) {
                        eq = i;
                        break;
                    }
                    if (c === CH_LBRACKET)
                        bracket = true;
                }
                if (eq !== -1) {
                    const state = scanAssignmentPrefix(src, tokenStart, wordEnd, ASSIGNMENT_NAME_START);
                    if (isMatchedAssignment(state))
                        assignmentOpPos = assignmentOperatorPos(state);
                }
                else if (bracket &&
                    wordEnd < this.srcEnd &&
                    scanAssignmentPrefix(src, tokenStart, wordEnd, ASSIGNMENT_NAME_START) >= ASSIGNMENT_INDEX_BASE) {
                    // The second pass leaves the fast path, setting `_wordIsAssignment`, so this
                    // cannot recur.
                    this.pos = tokenStart;
                    this.readWordText(true);
                    this.classifyWord(out, ctx, tokenStart);
                    return;
                }
            }
            if (assignmentOpPos !== undefined) {
                setSpanToken(out, Token.Assignment, tokenStart, wordEnd, raw);
                if (value !== null)
                    out._value = value;
                out.assignmentOperatorPos = assignmentOpPos;
                return;
            }
        }
        // `]]` is reserved only where it can close a `[[`; operands and wordlist entries, which
        // read Normal, are ordinary words, as is a `]]` demoted by a command prefix.
        if ((ctx === LexContext.CommandStart || ctx === LexContext.TestMode) && keywordEligible) {
            if (raw) {
                if (wordLen === 2 &&
                    src.charCodeAt(tokenStart) === CH_RBRACKET &&
                    src.charCodeAt(tokenStart + 1) === CH_RBRACKET) {
                    setSpanToken(out, Token.DblRBracket, tokenStart, wordEnd, true);
                    return;
                }
            }
            else if (value === "]]") {
                setToken(out, Token.DblRBracket, value, tokenStart, wordEnd);
                return;
            }
        }
        // FD number prefix: all-digit word followed by < or > → redirect with fd
        if (!hasExpansions && this.pos < this.srcEnd) {
            const nc = src.charCodeAt(this.pos);
            if (nc === CH_LT || nc === CH_GT) {
                if (raw) {
                    const fc = src.charCodeAt(tokenStart);
                    if (fc >= CH_0 && fc <= CH_9 && isAllDigitsRange(src, tokenStart, wordEnd)) {
                        const fd = Number.parseInt(src.slice(tokenStart, wordEnd), 10);
                        if (this.readRedirection(out, tokenStart)) {
                            out.fileDescriptor = fd;
                            return;
                        }
                    }
                    if (fc === CH_LBRACE && wordLen > 2 && src.charCodeAt(wordEnd - 1) === CH_RBRACE) {
                        const varname = src.slice(tokenStart + 1, wordEnd - 1);
                        if (this.readRedirection(out, tokenStart)) {
                            out.variableName = varname;
                            return;
                        }
                    }
                }
                else if (value !== null && value.length > 0) {
                    if (value.charCodeAt(0) >= CH_0 && value.charCodeAt(0) <= CH_9 && isAllDigits(value)) {
                        const fd = Number.parseInt(value, 10);
                        if (this.readRedirection(out, tokenStart)) {
                            out.fileDescriptor = fd;
                            return;
                        }
                    }
                    if (value.charCodeAt(0) === CH_LBRACE &&
                        value.charCodeAt(value.length - 1) === CH_RBRACE &&
                        value.length > 2) {
                        const varname = value.slice(1, -1);
                        if (this.readRedirection(out, tokenStart)) {
                            out.variableName = varname;
                            return;
                        }
                    }
                }
            }
        }
        setSpanToken(out, Token.Word, tokenStart, wordEnd, raw);
        if (value !== null)
            out._value = value;
        out.keywordEligible = keywordEligible;
    }
    // `subscripts` re-reads a word known to stop inside an array subscript, where
    // metacharacters are ordinary text.
    readWordText(subscripts = false) {
        const src = this.src;
        const len = this.srcEnd;
        let pos = this.pos;
        // Fast path: scan a single run of plain chars (covers most words)
        const fastStart = pos;
        let exitCh = 0;
        while (pos < len) {
            const c = src.charCodeAt(pos);
            if (c < 128 && charType[c]) {
                exitCh = c;
                break;
            }
            pos++;
        }
        if (pos >= len ||
            (charType[exitCh] & 1 &&
                !(exitCh === CH_LPAREN && pos > fastStart && extglobPrefix[src.charCodeAt(pos - 1)]) &&
                !subscripts)) {
            this.pos = pos;
            this._wordText = (this._buildParts || this._buildValue) && pos > fastStart ? src.slice(fastStart, pos) : "";
            this._wordRaw = true;
            this._wordQuoted = false;
            this._wordHasExpansions = false;
            this._wordKeywordEligible = true;
            this._wordIsAssignment = undefined;
            this._wordAssignmentOperatorPos = undefined;
            if (this._buildParts)
                this._wordParts = null;
            return;
        }
        // Slow path: word contains quotes, expansions, escapes, etc. `text` (the
        // processed value) is only assembled when building; the token path tracks
        // positions and flags plus the last value char (for extglob prefixes) and
        // whether the value still equals the raw span.
        const bp = this._buildParts;
        const bt = bp || this._buildValue;
        let text = bt && pos > fastStart ? src.slice(fastStart, pos) : "";
        let quoted = false;
        let hasExpansions = false;
        let keywordEligible = true;
        let valueIsRaw = true;
        let lastValueChar = pos > fastStart ? src.charCodeAt(pos - 1) : 0;
        let assignmentState = scanAssignmentPrefix(src, fastStart, pos, ASSIGNMENT_NAME_START);
        let parts;
        let litBuf = "";
        let litStart = 0;
        if (bp) {
            parts = [];
            litBuf = text; // fast-path prefix is literal
            litStart = fastStart;
        }
        while (pos < len) {
            const ch = src.charCodeAt(pos);
            if (ch >= 128 || !charType[ch]) {
                const runStart = pos;
                pos++;
                while (pos < len) {
                    const c = src.charCodeAt(pos);
                    if (c < 128 && charType[c])
                        break;
                    pos++;
                }
                lastValueChar = src.charCodeAt(pos - 1);
                assignmentState = scanAssignmentPrefix(src, runStart, pos, assignmentState);
                if (bt) {
                    const chunk = src.slice(runStart, pos);
                    text += chunk;
                    if (bp)
                        litBuf += chunk;
                }
                continue;
            }
            if (charType[ch] & 1) {
                if (ch === CH_LPAREN && lastValueChar < 128 && extglobPrefix[lastValueChar]) {
                    keywordEligible = false;
                    const prefixChar = lastValueChar;
                    pos++;
                    const innerStart = pos;
                    const close = this.findClosingShellDelimiter(innerStart, len, CH_RPAREN, prefixChar === CH_EQ);
                    const patternEnd = close === -1 ? len : close;
                    pos = close === -1 ? len : close + 1;
                    if (close === -1)
                        this.errors.push({ message: "unterminated extended glob", pos: innerStart - 2 });
                    lastValueChar = src.charCodeAt(pos - 1);
                    if (bt) {
                        const eg = "(" + src.slice(innerStart, pos);
                        text += eg;
                        // Create ExtendedGlob part for real extglob operators (not = which is array assignment)
                        if (bp && prefixChar !== CH_EQ) {
                            // Remove the prefix char from litBuf (it was appended in the previous iteration)
                            if (litBuf.length > 0) {
                                const trimmed = litBuf.slice(0, -1);
                                if (trimmed)
                                    parts.push({ type: "Literal", value: trimmed, text: src.slice(litStart, innerStart - 2) });
                                litBuf = "";
                            }
                            const op = extglobOp[prefixChar];
                            parts.push({
                                type: "ExtendedGlob",
                                text: op + eg,
                                operator: op,
                                pattern: src.slice(innerStart, patternEnd),
                                parts: hasEmbeddedWordStructure(src, innerStart, patternEnd)
                                    ? this.parseSubFieldWord(innerStart, patternEnd).parts
                                    : undefined,
                            });
                            litStart = pos;
                        }
                        else if (bp) {
                            litBuf += eg;
                        }
                    }
                    continue;
                }
                if (subscripts && assignmentState >= ASSIGNMENT_INDEX_BASE) {
                    const close = this.findClosingBracket(pos);
                    if (close !== -1) {
                        const spanEnd = close + 1;
                        assignmentState = scanAssignmentPrefix(src, pos, spanEnd, assignmentState);
                        lastValueChar = src.charCodeAt(close);
                        if (bt) {
                            const chunk = src.slice(pos, spanEnd);
                            text += chunk;
                            if (bp)
                                litBuf += chunk;
                        }
                        pos = spanEnd;
                        continue;
                    }
                }
                break;
            }
            if (ch === CH_BACKSLASH) {
                pos++;
                if (pos < len) {
                    if (src.charCodeAt(pos) === CH_NL) {
                        pos++;
                        valueIsRaw = false;
                    }
                    else {
                        if (assignmentState >= 0 && assignmentState < ASSIGNMENT_INDEX_BASE)
                            assignmentState = ASSIGNMENT_INVALID;
                        quoted = true;
                        keywordEligible = false;
                        valueIsRaw = false;
                        lastValueChar = src.charCodeAt(pos);
                        if (bt) {
                            text += src[pos];
                            if (bp)
                                litBuf += src[pos];
                        }
                        pos++;
                    }
                }
                else {
                    // A backslash at end of input escapes nothing and stays as itself.
                    if (assignmentState >= 0 && assignmentState < ASSIGNMENT_INDEX_BASE)
                        assignmentState = ASSIGNMENT_INVALID;
                    quoted = true;
                    keywordEligible = false;
                    lastValueChar = CH_BACKSLASH;
                    if (bt) {
                        text += "\\";
                        if (bp)
                            litBuf += "\\";
                    }
                }
                continue;
            }
            if (ch === CH_SQUOTE) {
                const sqStart = pos;
                if (assignmentState >= 0 && assignmentState < ASSIGNMENT_INDEX_BASE)
                    assignmentState = ASSIGNMENT_INVALID;
                quoted = true;
                keywordEligible = false;
                valueIsRaw = false;
                pos++;
                const start = pos;
                while (pos < len && src.charCodeAt(pos) !== CH_SQUOTE)
                    pos++;
                if (pos > start)
                    lastValueChar = src.charCodeAt(pos - 1);
                const value = bt ? src.slice(start, pos) : "";
                if (bt)
                    text += value;
                if (pos < len)
                    pos++;
                else
                    this.errors.push({ message: "unterminated single quote", pos: start - 1 });
                if (bp) {
                    if (litBuf) {
                        parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, sqStart) });
                        litBuf = "";
                    }
                    parts.push({ type: "SingleQuoted", value, text: src.slice(sqStart, pos) });
                    litStart = pos;
                }
                continue;
            }
            if (ch === CH_DQUOTE) {
                const dqStart = pos;
                if (assignmentState >= 0 && assignmentState < ASSIGNMENT_INDEX_BASE)
                    assignmentState = ASSIGNMENT_INVALID;
                quoted = true;
                keywordEligible = false;
                valueIsRaw = false;
                pos++;
                this.pos = pos;
                this.readDoubleQuoted();
                pos = this.pos;
                if (this._dqEnd > dqStart + 1)
                    lastValueChar = src.charCodeAt(this._dqEnd - 1);
                if (this._dqHasExpansions)
                    hasExpansions = true;
                if (bt)
                    text += this._dqText;
                if (bp) {
                    if (litBuf) {
                        parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, dqStart) });
                        litBuf = "";
                    }
                    const dqText = src.slice(dqStart, pos);
                    parts.push({
                        type: "DoubleQuoted",
                        text: dqText,
                        parts: this._dqParts ?? [
                            { type: "Literal", value: this._dqText, text: src.slice(dqStart + 1, this._dqEnd) },
                        ],
                    });
                    litStart = pos;
                }
                continue;
            }
            if (ch === CH_DOLLAR) {
                keywordEligible = false;
                const dollarStart = pos;
                if (assignmentState >= 0 && assignmentState < ASSIGNMENT_INDEX_BASE)
                    assignmentState = ASSIGNMENT_INVALID;
                this.pos = pos;
                this.readDollar();
                pos = this.pos;
                if (!this._resultIsRaw)
                    valueIsRaw = false;
                if (pos > dollarStart)
                    lastValueChar = src.charCodeAt(pos - 1);
                if (this._resultHasExpansion)
                    hasExpansions = true;
                if (bt)
                    text += this._resultText;
                if (bp) {
                    if (this._resultPart) {
                        if (litBuf) {
                            parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, dollarStart) });
                            litBuf = "";
                        }
                        parts.push(this._resultPart);
                        litStart = pos;
                    }
                    else {
                        litBuf += this._resultText;
                    }
                }
                continue;
            }
            if (ch === CH_BACKTICK) {
                keywordEligible = false;
                const btStart = pos;
                if (assignmentState >= 0 && assignmentState < ASSIGNMENT_INDEX_BASE)
                    assignmentState = ASSIGNMENT_INVALID;
                this.pos = pos;
                this.readBacktickExpansion();
                pos = this.pos;
                valueIsRaw = false;
                lastValueChar = src.charCodeAt(pos - 1);
                hasExpansions = true;
                if (bt)
                    text += this._resultText;
                if (bp) {
                    if (litBuf) {
                        parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, btStart) });
                        litBuf = "";
                    }
                    parts.push(this._resultPart);
                    litStart = pos;
                }
                continue;
            }
            if (ch === CH_LBRACE) {
                if (assignmentState >= 0 && assignmentState < ASSIGNMENT_INDEX_BASE)
                    assignmentState = ASSIGNMENT_INVALID;
                const braceEnd = scanBraceExpansion(src, pos, len);
                if (braceEnd > 0) {
                    keywordEligible = false;
                    lastValueChar = src.charCodeAt(braceEnd - 1);
                    if (bt) {
                        const braceText = src.slice(pos, braceEnd);
                        text += braceText;
                        if (bp) {
                            if (litBuf) {
                                parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, pos) });
                                litBuf = "";
                            }
                            parts.push({
                                type: "BraceExpansion",
                                text: braceText,
                                parts: hasEmbeddedWordStructure(src, pos + 1, braceEnd - 1)
                                    ? this.parseSubFieldWord(pos + 1, braceEnd - 1).parts
                                    : undefined,
                            });
                            litStart = braceEnd;
                        }
                    }
                    pos = braceEnd;
                    continue;
                }
                lastValueChar = CH_LBRACE;
                if (bt) {
                    text += "{";
                    if (bp)
                        litBuf += "{";
                }
                pos++;
                continue;
            }
            pos++;
        }
        if (bp && litBuf)
            parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, pos) });
        this.pos = pos;
        this._wordText = text;
        this._wordRaw = valueIsRaw;
        this._wordQuoted = quoted;
        this._wordHasExpansions = hasExpansions;
        this._wordKeywordEligible = keywordEligible;
        this._wordIsAssignment = isMatchedAssignment(assignmentState);
        this._wordAssignmentOperatorPos = this._wordIsAssignment ? assignmentOperatorPos(assignmentState) : undefined;
        if (bp) {
            // Only store parts if they add structure beyond a single literal
            this._wordParts = parts.length > 1 || (parts.length === 1 && parts[0].type !== "Literal") ? parts : null;
        }
    }
    readInnerWordText() {
        const src = this.src;
        const len = this.srcEnd;
        let pos = this.pos;
        let text = "";
        const bp = this._buildParts;
        let parts;
        let litBuf = "";
        let litStart = 0;
        if (bp) {
            parts = [];
            litStart = pos;
        }
        while (pos < len) {
            const ch = src.charCodeAt(pos);
            if (ch === CH_BACKSLASH) {
                pos++;
                if (pos < len) {
                    if (src.charCodeAt(pos) === CH_NL) {
                        pos++;
                    }
                    else {
                        const escaped = src[pos++];
                        text += escaped;
                        if (bp)
                            litBuf += escaped;
                    }
                }
                continue;
            }
            if (ch === CH_SQUOTE) {
                const sqStart = pos;
                pos++;
                const start = pos;
                while (pos < len && src.charCodeAt(pos) !== CH_SQUOTE)
                    pos++;
                const value = src.slice(start, pos);
                text += value;
                if (pos < len)
                    pos++;
                if (bp) {
                    if (litBuf) {
                        parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, sqStart) });
                        litBuf = "";
                    }
                    parts.push({ type: "SingleQuoted", value, text: src.slice(sqStart, pos) });
                    litStart = pos;
                }
                continue;
            }
            if (ch === CH_DQUOTE) {
                const dqStart = pos;
                pos++;
                this.pos = pos;
                this.readDoubleQuoted();
                pos = this.pos;
                text += this._dqText;
                if (bp) {
                    if (litBuf) {
                        parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, dqStart) });
                        litBuf = "";
                    }
                    const dqText = src.slice(dqStart, pos);
                    parts.push({
                        type: "DoubleQuoted",
                        text: dqText,
                        parts: this._dqParts ?? [
                            { type: "Literal", value: this._dqText, text: src.slice(dqStart + 1, this._dqEnd) },
                        ],
                    });
                    litStart = pos;
                }
                continue;
            }
            if (ch === CH_DOLLAR) {
                const dollarStart = pos;
                this.pos = pos;
                this.readDollar();
                pos = this.pos;
                text += this._resultText;
                if (bp) {
                    if (this._resultPart) {
                        if (litBuf) {
                            parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, dollarStart) });
                            litBuf = "";
                        }
                        parts.push(this._resultPart);
                        litStart = pos;
                    }
                    else {
                        litBuf += this._resultText;
                    }
                }
                continue;
            }
            if (ch === CH_BACKTICK) {
                const btStart = pos;
                this.pos = pos;
                this.readBacktickExpansion();
                pos = this.pos;
                text += this._resultText;
                if (bp) {
                    if (litBuf) {
                        parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, btStart) });
                        litBuf = "";
                    }
                    parts.push(this._resultPart);
                    litStart = pos;
                }
                continue;
            }
            if ((ch === CH_LT || ch === CH_GT) && pos + 1 < len && src.charCodeAt(pos + 1) === CH_LPAREN) {
                const psStart = pos;
                this.pos = pos + 2;
                const inner = this.extractBalanced();
                pos = this.pos;
                const raw = src.slice(psStart, pos);
                text += raw;
                if (bp) {
                    if (litBuf) {
                        parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, psStart) });
                        litBuf = "";
                    }
                    const part = {
                        type: "ProcessSubstitution",
                        text: raw,
                        operator: ch === CH_LT ? "<" : ">",
                        script: undefined,
                        inner,
                        innerStart: psStart + 2,
                    };
                    parts.push(part);
                    this.collect(part);
                    litStart = pos;
                }
                continue;
            }
            text += src[pos];
            if (bp)
                litBuf += src[pos];
            pos++;
        }
        if (bp && litBuf)
            parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, pos) });
        this.pos = pos;
        this._wordText = text;
        this._wordRaw = false;
        this._wordQuoted = false;
        this._wordHasExpansions = false;
        this._wordKeywordEligible = false;
        if (bp) {
            this._wordParts = parts.length > 1 || (parts.length === 1 && parts[0].type !== "Literal") ? parts : null;
        }
    }
    // Parse a parameter-expansion sub-field (operand, slice bound, replacement pattern) over
    // the window [start, end) of the original source. Parsing in place — rather than against a
    // detached slice — gives the word and any nested substitutions absolute offsets, and
    // composes through nested ${...}. The `${...}` inner is a verbatim substring of the
    // source, so every sub-field offset maps straight back.
    parseSubFieldWord(start, end) {
        if (start >= end)
            return new WordImpl("", start, start);
        // Sub-fields nest through readInnerWordText (nested expansions, arithmetic embedded
        // words); once the shared budget is spent, keep the raw span as an unstructured word.
        if (this._nestingDepth >= MAX_SYNTAX_NESTING)
            return new WordImpl(this.src.slice(start, end), start, end);
        this._nestingDepth++;
        const savedEnd = this.srcEnd;
        const savedPos = this.pos;
        const savedText = this._wordText;
        const savedParts = this._wordParts;
        const savedQuoted = this._wordQuoted;
        const savedKeywordEligible = this._wordKeywordEligible;
        this.srcEnd = end;
        this.pos = start;
        this.readInnerWordText();
        // text is the raw source span (so source.slice(pos, end) === text holds, as for every
        // other word); value resolves quotes via parts.
        const word = new WordImpl(this.src.slice(start, end), start, end);
        if (this._buildParts && this._wordParts) {
            word.parts = this._wordParts;
        }
        this.srcEnd = savedEnd;
        this.pos = savedPos;
        this._wordText = savedText;
        this._wordParts = savedParts;
        this._wordQuoted = savedQuoted;
        this._wordKeywordEligible = savedKeywordEligible;
        this._nestingDepth--;
        return word;
    }
    skipSQ() {
        while (this.pos < this.srcEnd && this.src.charCodeAt(this.pos) !== CH_SQUOTE)
            this.pos++;
        if (this.pos < this.srcEnd)
            this.pos++;
    }
    skipAnsiCQuoted() {
        const quotePos = this.pos - 1;
        const result = decodeAnsiCQuoted(this.src, this.pos, this.srcEnd);
        this.pos = result.end;
        if (!result.closed)
            this.errors.push({ message: "unterminated ANSI-C quote", pos: quotePos });
    }
    skipDQ() {
        const src = this.src;
        const len = this.srcEnd;
        while (this.pos < len) {
            const ch = src.charCodeAt(this.pos);
            if (ch === CH_DQUOTE) {
                this.pos++;
                return;
            }
            if (ch === CH_BACKSLASH) {
                this.pos += 2;
                continue;
            }
            if (ch === CH_DOLLAR && this.pos + 1 < len) {
                const next = src.charCodeAt(this.pos + 1);
                if (next === CH_LPAREN) {
                    const csStart = this.pos;
                    this.pos += 2;
                    this.extractBalanced();
                    if (this._unbalanced)
                        this.errors.push({ message: "unterminated command substitution", pos: csStart });
                    continue;
                }
                if (next === CH_LBRACE) {
                    this.pos += 2;
                    let d = 1;
                    while (this.pos < len && d > 0) {
                        const c = src.charCodeAt(this.pos);
                        if (c === CH_RBRACE) {
                            if (--d === 0) {
                                this.pos++;
                                break;
                            }
                        }
                        else if (c === CH_LBRACE && this.pos > 0 && src.charCodeAt(this.pos - 1) === CH_DOLLAR)
                            d++;
                        else if (c === CH_BACKSLASH) {
                            this.pos++;
                        }
                        else if (c === CH_SQUOTE) {
                            this.pos++;
                            this.skipSQ();
                            continue;
                        }
                        else if (c === CH_DQUOTE) {
                            this.pos++;
                            this.skipDQ();
                            continue;
                        }
                        this.pos++;
                    }
                    continue;
                }
            }
            if (ch === CH_BACKTICK) {
                this.pos++;
                while (this.pos < len && src.charCodeAt(this.pos) !== CH_BACKTICK) {
                    if (src.charCodeAt(this.pos) === CH_BACKSLASH)
                        this.pos++;
                    this.pos++;
                }
                if (this.pos < len)
                    this.pos++;
                continue;
            }
            this.pos++;
        }
    }
    skipSpacesAndTabs() {
        const src = this.src;
        const len = this.srcEnd;
        while (this.pos < len) {
            const ch = src.charCodeAt(this.pos);
            if (ch === CH_SPACE || ch === CH_TAB)
                this.pos++;
            else if (ch === CH_BACKSLASH && this.pos + 1 < len && src.charCodeAt(this.pos + 1) === CH_NL)
                this.pos += 2;
            else
                break;
        }
    }
    readDoubleQuoted() {
        const src = this.src;
        const len = this.srcEnd;
        const contentStart = this.pos;
        let hasExpansions = false;
        const bp = this._buildParts;
        const bt = bp || this._buildValue;
        // Fast path: pure literal content (no $, `, or \ — just find closing ")
        if (!bp) {
            let p = this.pos;
            while (p < len) {
                const c = src.charCodeAt(p);
                if (c === CH_DQUOTE) {
                    this._dqText = bt ? src.slice(contentStart, p) : "";
                    this._dqEnd = p;
                    this.pos = p + 1;
                    this._dqHasExpansions = false;
                    this._dqParts = null;
                    return;
                }
                if (c === CH_DOLLAR || c === CH_BACKTICK || c === CH_BACKSLASH)
                    break;
                p++;
            }
            // Fall through to general path
        }
        let text = "";
        let parts = null;
        let litBuf = "";
        let litStart = bp ? this.pos : 0;
        while (this.pos < len && src.charCodeAt(this.pos) !== CH_DQUOTE) {
            // Scan run of plain chars inside double quotes
            const runStart = this.pos;
            while (this.pos < len) {
                const c = src.charCodeAt(this.pos);
                if (c === CH_DQUOTE || c === CH_BACKSLASH || c === CH_DOLLAR || c === CH_BACKTICK)
                    break;
                this.pos++;
            }
            if (bt && this.pos > runStart) {
                const chunk = src.slice(runStart, this.pos);
                text += chunk;
                if (bp)
                    litBuf += chunk;
            }
            if (this.pos >= len || src.charCodeAt(this.pos) === CH_DQUOTE)
                break;
            const ch = src.charCodeAt(this.pos);
            if (ch === CH_BACKSLASH) {
                this.pos++;
                if (this.pos < len) {
                    const next = src.charCodeAt(this.pos);
                    if (next === CH_NL) {
                        this.pos++;
                        continue;
                    }
                    if (bt) {
                        if (next === CH_DOLLAR || next === CH_BACKTICK || next === CH_DQUOTE || next === CH_BACKSLASH) {
                            const c = src[this.pos];
                            text += c;
                            if (bp)
                                litBuf += c;
                        }
                        else {
                            const pair = "\\" + src[this.pos];
                            text += pair;
                            if (bp)
                                litBuf += pair;
                        }
                    }
                    this.pos++;
                }
                continue;
            }
            if (ch === CH_DOLLAR) {
                // Inside double quotes `$"` and `$'` are a literal $: no locale string, no ANSI-C quote.
                const afterDollar = this.pos + 1 < len ? src.charCodeAt(this.pos + 1) : 0;
                if (afterDollar === CH_DQUOTE || afterDollar === CH_SQUOTE) {
                    if (bt) {
                        text += "$";
                        if (bp)
                            litBuf += "$";
                    }
                    this.pos++;
                    continue;
                }
                const expStart = this.pos;
                this.readDollar();
                if (bt)
                    text += this._resultText;
                if (this._resultHasExpansion)
                    hasExpansions = true;
                if (bp) {
                    const rp = this._resultPart;
                    if (rp && isDQChild(rp)) {
                        if (!parts)
                            parts = [];
                        if (litBuf) {
                            parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, expStart) });
                            litBuf = "";
                        }
                        parts.push(rp);
                        litStart = this.pos;
                    }
                    else {
                        litBuf += this._resultText;
                    }
                }
                continue;
            }
            if (ch === CH_BACKTICK) {
                const btStart = this.pos;
                this.readBacktickExpansion(true);
                if (bt)
                    text += this._resultText;
                hasExpansions = true;
                if (bp && this._resultPart && isDQChild(this._resultPart)) {
                    if (!parts)
                        parts = [];
                    if (litBuf) {
                        parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, btStart) });
                        litBuf = "";
                    }
                    parts.push(this._resultPart);
                    litStart = this.pos;
                }
                continue;
            }
        }
        if (bp && parts && litBuf)
            parts.push({ type: "Literal", value: litBuf, text: src.slice(litStart, this.pos) });
        this._dqEnd = this.pos;
        if (this.pos < len)
            this.pos++; // closing "
        else
            this.errors.push({ message: "unterminated double quote", pos: contentStart - 1 });
        this._dqText = text;
        this._dqHasExpansions = hasExpansions;
        this._dqParts = parts;
    }
    readDollar() {
        const dollarPos = this.pos;
        this.pos++; // skip $
        const src = this.src;
        const len = this.srcEnd;
        const bt = this._buildParts || this._buildValue;
        if (this.pos >= len) {
            this._resultText = "$";
            this._resultIsRaw = true;
            this._resultHasExpansion = false;
            this._resultPart = undefined;
            return;
        }
        const logicalPos = skipLineContinuations(src, this.pos, len);
        if (logicalPos > this.pos &&
            src.charCodeAt(logicalPos) === CH_LPAREN &&
            src.charCodeAt(logicalPos + 1) !== CH_LPAREN)
            this.pos = logicalPos;
        const ch = src.charCodeAt(this.pos);
        if (ch === CH_LPAREN) {
            if (this.pos + 1 < len && src.charCodeAt(this.pos + 1) === CH_LPAREN) {
                const savedPos = this.pos;
                const savedErrors = this.errors.length;
                this.readArithmeticExpansion();
                if (!this._notArithmetic)
                    return;
                this.errors.length = savedErrors;
                this.pos = savedPos;
            }
            this.readCommandSubstitution(dollarPos);
            return;
        }
        if (ch === CH_LBRACE) {
            const after = this.pos + 1 < len ? src.charCodeAt(this.pos + 1) : 0;
            if (after === CH_SPACE || after === CH_TAB || after === CH_NL) {
                this.readBraceCommandSubstitution();
                return;
            }
            if (after === CH_PIPE) {
                this.readValueSubstitution();
                return;
            }
            this.readParameterExpansion();
            return;
        }
        if (ch === CH_SQUOTE) {
            this.pos++;
            if (bt) {
                const value = this.readAnsiCQuoted();
                this._resultText = value;
                this._resultPart = this._buildParts
                    ? { type: "AnsiCQuoted", text: src.slice(dollarPos, this.pos), value }
                    : undefined;
            }
            else {
                this.skipAnsiCQuoted();
                this._resultText = "";
                this._resultPart = undefined;
            }
            this._resultIsRaw = false;
            this._resultHasExpansion = false;
            return;
        }
        if (ch === CH_DQUOTE) {
            this.pos++;
            this.readDoubleQuoted();
            this._resultText = this._dqText;
            this._resultIsRaw = false;
            this._resultHasExpansion = this._dqHasExpansions;
            if (this._buildParts) {
                const text = src.slice(dollarPos, this.pos);
                this._resultPart = {
                    type: "LocaleString",
                    text,
                    parts: this._dqParts ?? [
                        { type: "Literal", value: this._dqText, text: src.slice(dollarPos + 2, this._dqEnd) },
                    ],
                };
            }
            else {
                this._resultPart = undefined;
            }
            return;
        }
        if (ch === CH_AT ||
            ch === CH_STAR ||
            ch === CH_HASH ||
            ch === CH_QUESTION ||
            ch === CH_DASH ||
            ch === CH_DOLLAR ||
            ch === CH_BANG ||
            (ch >= CH_0 && ch <= CH_9)) {
            this.pos++;
            const text = bt ? src.slice(this.pos - 2, this.pos) : "";
            this._resultText = text;
            this._resultIsRaw = true;
            this._resultHasExpansion = false;
            this._resultPart = this._buildParts ? { type: "SimpleExpansion", text } : undefined;
            return;
        }
        if (ch < 128 && isIdChar[ch] & 1) {
            const namePos = this.pos - 1;
            while (this.pos < len) {
                const c = src.charCodeAt(this.pos);
                if (c < 128 && isIdChar[c] & 2)
                    this.pos++;
                else
                    break;
            }
            const text = bt ? src.slice(namePos, this.pos) : "";
            this._resultText = text;
            this._resultIsRaw = true;
            this._resultHasExpansion = false;
            this._resultPart = this._buildParts ? { type: "SimpleExpansion", text } : undefined;
            return;
        }
        // $[ expr ] is bash's deprecated spelling of $(( expr )). It runs to the matching ']',
        // so parentheses inside belong to the expansion instead of ending the word.
        if (ch === CH_LBRACKET) {
            const close = this.findClosingArithmeticBracket(this.pos + 1);
            if (close !== -1) {
                const bodyStart = this.pos + 1;
                const body = src.slice(bodyStart, close);
                this.pos = close + 1;
                const text = bt ? src.slice(dollarPos, this.pos) : "";
                this._resultText = text;
                this._resultIsRaw = true;
                this._resultHasExpansion = false;
                this._resultPart = this._buildParts
                    ? { type: "ArithmeticExpansion", text, expression: this.buildArithmeticExpression(body, bodyStart) }
                    : undefined;
                return;
            }
        }
        this._resultText = "$";
        this._resultIsRaw = true;
        this._resultHasExpansion = false;
        this._resultPart = undefined;
    }
    scanArithmeticBody() {
        this._notArithmetic = false;
        this.pos += 2;
        let depth = 1;
        let parenDepth = 0;
        let parentParenDepth = 0;
        let parenDepths;
        let expansions = 0;
        let reported = false;
        const src = this.src;
        const len = this.srcEnd;
        const start = this.pos;
        while (this.pos < len && depth > 0) {
            const c = src.charCodeAt(this.pos);
            if (c === CH_BACKSLASH) {
                this.pos += 2;
            }
            else if (c === CH_SQUOTE) {
                this.pos++;
                this.skipSQ();
            }
            else if (c === CH_DQUOTE) {
                this.pos++;
                this.skipDQ();
            }
            else if (c === CH_BACKTICK) {
                this.pos++;
                while (this.pos < len && src.charCodeAt(this.pos) !== CH_BACKTICK) {
                    if (src.charCodeAt(this.pos) === CH_BACKSLASH)
                        this.pos++;
                    this.pos++;
                }
                if (this.pos < len)
                    this.pos++;
            }
            else if (c === CH_DOLLAR &&
                this.pos + 2 < len &&
                src.charCodeAt(this.pos + 1) === CH_LPAREN &&
                src.charCodeAt(this.pos + 2) !== CH_LPAREN) {
                const dollarPos = this.pos;
                this.pos += 2;
                this.extractBalanced();
                if (this._unbalanced)
                    this.errors.push({ message: "unterminated command substitution", pos: dollarPos });
            }
            else if (c === CH_DOLLAR && this.pos + 1 < len && src.charCodeAt(this.pos + 1) === CH_LBRACE) {
                const close = this.findClosingBrace(this.pos + 2, len);
                this.pos = close === -1 ? len : close + 1;
            }
            else if ((c === CH_LT || c === CH_GT) && this.pos + 1 < len && src.charCodeAt(this.pos + 1) === CH_LPAREN) {
                this.pos += 2;
                this.extractBalanced();
            }
            else if (c === CH_LPAREN) {
                if (src.charCodeAt(this.pos - 1) === CH_DOLLAR && src.charCodeAt(this.pos + 1) === CH_LPAREN) {
                    if (depth === 1)
                        parentParenDepth = parenDepth;
                    else
                        (parenDepths ??= []).push(parenDepth);
                    depth++;
                    parenDepth = 0;
                    // Nested $((...)) — count it against the shared budget (the expansion this scan
                    // belongs to is level one, hence >=) so over-deep chains surface a parse error.
                    if (++expansions + this._nestingDepth >= MAX_SYNTAX_NESTING) {
                        if (!reported) {
                            this.errors.push({ message: "maximum arithmetic expansion nesting depth exceeded", pos: this.pos - 1 });
                            reported = true;
                        }
                    }
                    this.pos += 2;
                }
                else {
                    parenDepth++;
                    this.pos++;
                }
            }
            else if (c === CH_RPAREN && parenDepth > 0) {
                parenDepth--;
                this.pos++;
            }
            else if (c === CH_RPAREN && this.pos + 1 < len && src.charCodeAt(this.pos + 1) === CH_RPAREN) {
                if (--depth === 0) {
                    this.pos += 2;
                    break;
                }
                parenDepth = depth === 1 ? parentParenDepth : parenDepths.pop();
                this.pos += 2;
            }
            else if (c === CH_RPAREN && depth === 1) {
                // Bash reads `((` and `$((` as arithmetic only when the inner parenthesis pair is
                // immediately followed by `)`. It closed without one, so `((a) )` is nested subshells
                // and `$((a) || (b))` a command substitution; callers re-read from the start.
                this._notArithmetic = true;
                return "";
            }
            else {
                this.pos++;
            }
        }
        return this._buildParts || this._buildValue ? src.slice(start, this.pos - 2) : "";
    }
    readArithmeticExpansion() {
        const bodyStart = this.pos + 2; // absolute offset of the body, past the "((" at this.pos
        const body = this.scanArithmeticBody();
        if (this._notArithmetic)
            return;
        const text = this._buildParts || this._buildValue ? "$((" + body + "))" : "";
        this._resultText = text;
        this._resultIsRaw = true;
        this._resultHasExpansion = false;
        this._resultPart = this._buildParts
            ? { type: "ArithmeticExpansion", text, expression: this.buildArithmeticExpression(body, bodyStart) }
            : undefined;
    }
    // Pass the absolute body offset so arithmetic nodes index the original source directly
    // (no re-basing). Nested $(...) command subs inside the arithmetic get an absolute
    // innerStart so resolveCollected parses their window in place.
    buildArithmeticExpression(body, bodyStart) {
        if (!hasEmbeddedWordStructure(this.src, bodyStart, bodyStart + body.length)) {
            return parseArithmeticExpression(body, bodyStart) ?? undefined;
        }
        const commandExpansions = [];
        const embeddedWords = [];
        const expr = parseArithmeticExpression(body, bodyStart, {
            commandExpansions,
            embeddedWords,
            findClosingBracket: (start, end) => this.findClosingBracket(start, end),
            findClosingBrace: (start, end) => this.findClosingBrace(start, end),
            findClosingParenthesis: (start, end) => this.findClosingParenthesis(start, end),
            findArithmeticExpansionEnd: (start, end) => this.findArithmeticExpansionEnd(start, end),
            findArithmeticWordEnd: (start, end) => this.findArithmeticWordEnd(start, end),
        }) ?? undefined;
        for (const node of commandExpansions) {
            node.innerStart = node.pos + 2;
            this.collect(node);
        }
        for (const node of embeddedWords)
            node.parts = this.parseSubFieldWord(node.pos, node.end).parts;
        return expr;
    }
    readArithmeticCommand(out, tokenStart) {
        const savedBuildValue = this._buildValue;
        this._buildValue = true;
        const body = this.scanArithmeticBody();
        this._buildValue = savedBuildValue;
        setToken(out, Token.ArithCmd, body, tokenStart, this.pos);
    }
    readCommandSubstitution(dollarPos) {
        const openPos = this.pos;
        this.pos++; // skip (
        // extractBalanced returns the inner text without the closing paren, so it
        // stays correct when the input ended before that paren was reached.
        const inner = this.extractBalanced();
        if (this._unbalanced)
            this.errors.push({ message: "unterminated command substitution", pos: dollarPos });
        const bt = this._buildParts || this._buildValue;
        const rawText = bt ? this.src.slice(dollarPos, this.pos) : "";
        const text = !bt || openPos === dollarPos + 1 ? rawText : "$" + this.src.slice(openPos, this.pos);
        this._resultText = text;
        this._resultIsRaw = openPos === dollarPos + 1;
        this._resultHasExpansion = true;
        if (this._buildParts) {
            this._resultPart = { type: "CommandExpansion", text: rawText, script: undefined, inner, innerStart: openPos + 1 };
            this.collect(this._resultPart);
        }
        else {
            this._resultPart = undefined;
        }
    }
    readBraceCommandSubstitution() {
        this.readBraceSubstitution(1);
    }
    readValueSubstitution() {
        this.readBraceSubstitution(2);
    }
    readBraceSubstitution(skip) {
        const dollarPos = this.pos - 1;
        this.pos += skip;
        const src = this.src;
        const len = this.srcEnd;
        let depth = 1;
        const start = this.pos;
        while (this.pos < len) {
            const c = src.charCodeAt(this.pos);
            if (c === CH_LBRACE)
                depth++;
            else if (c === CH_RBRACE) {
                if (--depth === 0) {
                    this.pos++;
                    break;
                }
            }
            else if (c === CH_SQUOTE) {
                this.pos++;
                this.skipSQ();
                continue;
            }
            else if (c === CH_DQUOTE) {
                this.pos++;
                this.skipDQ();
                continue;
            }
            else if (c === CH_BACKSLASH)
                this.pos++;
            this.pos++;
        }
        this._resultIsRaw = true;
        this._resultHasExpansion = true;
        if (this._buildParts || this._buildValue) {
            const rawInner = src.slice(start, this.pos - 1);
            const inner = rawInner.trim();
            const text = src.slice(dollarPos, this.pos);
            this._resultText = text;
            if (this._buildParts) {
                const innerStart = start + (rawInner.length - rawInner.trimStart().length);
                this._resultPart = { type: "CommandExpansion", text, script: undefined, inner, innerStart };
                this.collect(this._resultPart);
            }
            else {
                this._resultPart = undefined;
            }
        }
        else {
            this._resultText = "";
            this._resultPart = undefined;
        }
    }
    readBacktickExpansion(insideDoubleQuotes = false) {
        this.pos++; // skip opening `
        const src = this.src;
        const len = this.srcEnd;
        const start = this.pos;
        if (!this._buildParts && !this._buildValue) {
            while (this.pos < len && src.charCodeAt(this.pos) !== CH_BACKTICK) {
                if (src.charCodeAt(this.pos) === CH_BACKSLASH && this.pos + 1 < len)
                    this.pos++;
                this.pos++;
            }
            if (this.pos < len)
                this.pos++;
            else
                this.errors.push({ message: "unterminated backtick", pos: start - 1 });
            this._resultText = "";
            this._resultIsRaw = false;
            this._resultHasExpansion = true;
            this._resultPart = undefined;
            return;
        }
        let inner = "";
        let hasEscapes = false;
        while (this.pos < len && src.charCodeAt(this.pos) !== CH_BACKTICK) {
            if (src.charCodeAt(this.pos) === CH_BACKSLASH) {
                hasEscapes = true;
                break;
            }
            this.pos++;
        }
        if (!hasEscapes) {
            inner = src.slice(start, this.pos);
        }
        else {
            inner = src.slice(start, this.pos);
            while (this.pos < len && src.charCodeAt(this.pos) !== CH_BACKTICK) {
                if (src.charCodeAt(this.pos) === CH_BACKSLASH) {
                    this.pos++;
                    if (this.pos < len) {
                        const c = src.charCodeAt(this.pos);
                        if (c === CH_DOLLAR || c === CH_BACKTICK || c === CH_BACKSLASH || (insideDoubleQuotes && c === CH_DQUOTE)) {
                            inner += src[this.pos];
                        }
                        else {
                            inner += "\\" + src[this.pos];
                        }
                        this.pos++;
                    }
                }
                else {
                    const runStart = this.pos;
                    while (this.pos < len) {
                        const c = src.charCodeAt(this.pos);
                        if (c === CH_BACKTICK || c === CH_BACKSLASH)
                            break;
                        this.pos++;
                    }
                    inner += src.slice(runStart, this.pos);
                }
            }
        }
        if (this.pos < len)
            this.pos++; // closing `
        else
            this.errors.push({ message: "unterminated backtick", pos: start - 1 });
        const text = src.slice(start - 1, this.pos); // raw source including backticks
        this._resultText = inner;
        this._resultHasExpansion = true;
        if (this._buildParts) {
            // Escaped backticks rebuild `inner` (escapes removed), so its offsets no
            // longer map linearly onto the source — leave innerStart undefined there.
            this._resultPart = {
                type: "CommandExpansion",
                text,
                script: undefined,
                inner,
                innerStart: hasEscapes ? undefined : start,
            };
            this.collect(this._resultPart);
        }
        else {
            this._resultPart = undefined;
        }
    }
    readParameterExpansion() {
        const src = this.src;
        const len = this.srcEnd;
        const start = this.pos; // at {
        this.pos++;
        let depth = 1;
        let reported = false;
        while (this.pos < len && depth > 0) {
            const ch = src.charCodeAt(this.pos);
            if (ch === CH_DOLLAR) {
                // Dispatch forward: `$$` consumes its own second `$`, so a `{` after it is literal.
                const next = this.pos + 1 < len ? src.charCodeAt(this.pos + 1) : 0;
                if (next === CH_LBRACE) {
                    depth++;
                    if (this._nestingDepth + depth > MAX_SYNTAX_NESTING && !reported) {
                        this.errors.push({ message: "maximum parameter expansion nesting depth exceeded", pos: this.pos });
                        reported = true;
                    }
                    this.pos += 2;
                    continue;
                }
                if (next === CH_DOLLAR) {
                    this.pos += 2;
                    continue;
                }
                if (next === CH_LPAREN) {
                    const dollarPos = this.pos;
                    this.pos += 2;
                    this.extractBalanced();
                    if (this._unbalanced)
                        this.errors.push({ message: "unterminated command substitution", pos: dollarPos });
                    continue;
                }
            }
            else if (ch === CH_BACKTICK) {
                this.pos++;
                while (this.pos < len && src.charCodeAt(this.pos) !== CH_BACKTICK) {
                    if (src.charCodeAt(this.pos) === CH_BACKSLASH)
                        this.pos++;
                    this.pos++;
                }
                if (this.pos < len)
                    this.pos++;
                continue;
            }
            else if (ch === CH_RBRACE) {
                if (--depth === 0) {
                    this.pos++;
                    break;
                }
            }
            else if (ch === CH_BACKSLASH) {
                this.pos++;
            }
            else if (ch === CH_SQUOTE) {
                this.pos++;
                if (this.pos > start + 1 && src.charCodeAt(this.pos - 2) === CH_DOLLAR)
                    this.skipAnsiCQuoted();
                else
                    this.skipSQ();
                continue;
            }
            else if (ch === CH_DQUOTE) {
                this.pos++;
                this.skipDQ();
                continue;
            }
            this.pos++;
        }
        const closed = depth === 0;
        if (!closed)
            this.errors.push({ message: "unterminated parameter expansion", pos: start - 1 });
        const text = this._buildParts || this._buildValue ? src.slice(start - 1, this.pos) : "";
        this._resultText = text;
        this._resultIsRaw = true;
        this._resultHasExpansion = false;
        if (this._buildParts) {
            const inner = src.slice(start + 1, closed ? this.pos - 1 : this.pos);
            this._resultPart = this.parseParamInner(text, inner, start + 1);
        }
        else {
            this._resultPart = undefined;
        }
    }
    // `innerStart` is the absolute offset of `inner` in the original source, so each sub-field
    // word is parsed in place at its true position. `sub(a, b)` maps inner-relative offsets to
    // that absolute window.
    parseParamInner(text, inner, innerStart) {
        const result = {
            type: "ParameterExpansion",
            text,
            parameter: "",
            index: undefined,
            indexParts: undefined,
            indirect: undefined,
            length: undefined,
            operator: undefined,
            operand: undefined,
            slice: undefined,
            replace: undefined,
        };
        const ilen = inner.length;
        if (ilen === 0)
            return result;
        const sub = (a, b) => this.parseSubFieldWord(innerStart + a, innerStart + b);
        const closeBracket = (start) => {
            const close = this.findClosingBracket(innerStart + start, innerStart + ilen);
            return close === -1 ? -1 : close - innerStart;
        };
        let i = 0;
        // Check for ! prefix (indirect)
        if (inner.charCodeAt(0) === CH_BANG) {
            result.indirect = true;
            i = 1;
        }
        // Check for # prefix (length) — only when not indirect
        if (!result.indirect && inner.charCodeAt(0) === CH_HASH) {
            if (ilen === 1) {
                // ${#} = special variable
                result.parameter = "#";
                return result;
            }
            // ${##...} is always param="#" with operator (bash resolves ambiguity this way)
            if (inner.charCodeAt(1) === CH_HASH) {
                result.parameter = "#";
                i = 1;
            }
            else {
                // Try as length operator: parse param after #, check if at end
                const tryI = this.scanParamName(inner, 1);
                if (tryI > 1) {
                    let endI = tryI;
                    if (endI < ilen && inner.charCodeAt(endI) === CH_LBRACKET) {
                        const closeB = closeBracket(endI + 1);
                        if (closeB !== -1)
                            endI = closeB + 1;
                    }
                    if (endI >= ilen) {
                        // ${#param} or ${#param[idx]} — length
                        result.length = true;
                        result.parameter = inner.slice(1, tryI);
                        if (tryI < ilen && inner.charCodeAt(tryI) === CH_LBRACKET) {
                            const closeB = closeBracket(tryI + 1);
                            if (closeB !== -1) {
                                result.index = inner.slice(tryI + 1, closeB);
                                result.indexParts = sub(tryI + 1, closeB).parts;
                            }
                        }
                        return result;
                    }
                }
                // Not length — # is the parameter name
                result.parameter = "#";
                i = 1;
            }
        }
        // Parse parameter name if not set yet
        if (!result.parameter) {
            const nameStart = i;
            i = this.scanParamName(inner, i);
            result.parameter = inner.slice(nameStart, i);
        }
        // Check for [index]
        if (i < ilen && inner.charCodeAt(i) === CH_LBRACKET) {
            const closeB = closeBracket(i + 1);
            if (closeB !== -1) {
                result.index = inner.slice(i + 1, closeB);
                result.indexParts = sub(i + 1, closeB).parts;
                i = closeB + 1;
            }
        }
        // Nothing more → simple expansion
        if (i >= ilen)
            return result;
        // Determine operator
        const opChar = inner.charCodeAt(i);
        // Colon variants: :-, :=, :+, :? or slice
        if (opChar === CH_COLON) {
            if (i + 1 < ilen) {
                const nc = inner.charCodeAt(i + 1);
                if (nc === CH_DASH || nc === CH_EQ || nc === CH_PLUS || nc === CH_QUESTION) {
                    result.operator = inner.slice(i, i + 2);
                    result.operand = sub(i + 2, ilen);
                    return result;
                }
            }
            // Slice: ${var:offset} or ${var:offset:length}
            i++;
            const sliceRest = inner.slice(i);
            const sliceStart = innerStart + i;
            const sliceEnd = innerStart + ilen;
            const colonIdx = findUnnested(sliceRest, CH_COLON, true, (index, quoted) => {
                return this.findNestedShellEnd(sliceStart + index, sliceEnd, quoted) - sliceStart;
            });
            if (colonIdx === -1) {
                result.slice = { offset: sub(i, ilen), length: undefined };
            }
            else {
                result.slice = {
                    offset: sub(i, i + colonIdx),
                    length: sub(i + colonIdx + 1, ilen),
                };
            }
            return result;
        }
        // Default/assign/error/alt without colon
        if (opChar === CH_DASH || opChar === CH_EQ || opChar === CH_PLUS || opChar === CH_QUESTION) {
            result.operator = inner[i];
            result.operand = sub(i + 1, ilen);
            return result;
        }
        // Prefix strip
        if (opChar === CH_HASH) {
            if (i + 1 < ilen && inner.charCodeAt(i + 1) === CH_HASH) {
                result.operator = "##";
                result.operand = sub(i + 2, ilen);
            }
            else {
                result.operator = "#";
                result.operand = sub(i + 1, ilen);
            }
            return result;
        }
        // Suffix strip
        if (opChar === CH_PERCENT) {
            if (i + 1 < ilen && inner.charCodeAt(i + 1) === CH_PERCENT) {
                result.operator = "%%";
                result.operand = sub(i + 2, ilen);
            }
            else {
                result.operator = "%";
                result.operand = sub(i + 1, ilen);
            }
            return result;
        }
        // Replacement
        if (opChar === CH_SLASH) {
            i++;
            let replOp = "/";
            if (i < ilen) {
                const nc = inner.charCodeAt(i);
                if (nc === CH_SLASH) {
                    replOp = "//";
                    i++;
                }
                else if (nc === CH_HASH) {
                    replOp = "/#";
                    i++;
                }
                else if (nc === CH_PERCENT) {
                    replOp = "/%";
                    i++;
                }
            }
            result.operator = replOp;
            const rest = inner.slice(i);
            const sepIdx = findUnnested(rest, CH_SLASH);
            if (sepIdx === -1) {
                result.replace = {
                    pattern: sub(i, ilen),
                    replacement: new WordImpl("", innerStart + ilen, innerStart + ilen),
                };
            }
            else {
                result.replace = {
                    pattern: sub(i, i + sepIdx),
                    replacement: sub(i + sepIdx + 1, ilen),
                };
            }
            return result;
        }
        // Case modification: ^ ^^ , ,,
        if (opChar === CH_CARET) {
            if (i + 1 < ilen && inner.charCodeAt(i + 1) === CH_CARET) {
                result.operator = "^^";
                if (i + 2 < ilen)
                    result.operand = sub(i + 2, ilen);
            }
            else {
                result.operator = "^";
                if (i + 1 < ilen)
                    result.operand = sub(i + 1, ilen);
            }
            return result;
        }
        if (opChar === CH_COMMA) {
            if (i + 1 < ilen && inner.charCodeAt(i + 1) === CH_COMMA) {
                result.operator = ",,";
                if (i + 2 < ilen)
                    result.operand = sub(i + 2, ilen);
            }
            else {
                result.operator = ",";
                if (i + 1 < ilen)
                    result.operand = sub(i + 1, ilen);
            }
            return result;
        }
        // Transform: @
        if (opChar === CH_AT) {
            result.operator = "@";
            result.operand = sub(i + 1, ilen);
            return result;
        }
        // Unknown operator — store remaining as op
        result.operator = inner.slice(i);
        return result;
    }
    findNestedShellEnd(start, end, quoted) {
        const ch = this.src.charCodeAt(start);
        if (ch === CH_BACKTICK) {
            let pos = start + 1;
            while (pos < end) {
                const current = this.src.charCodeAt(pos);
                if (current === CH_BACKSLASH) {
                    pos += 2;
                    continue;
                }
                pos++;
                if (current === CH_BACKTICK)
                    return pos;
            }
            return end;
        }
        let close;
        if (ch === CH_DOLLAR) {
            const next = start + 1;
            if (next < end && this.src.charCodeAt(next) === CH_LBRACE) {
                close = this.findClosingBrace(next + 1, end);
            }
            else {
                const open = skipLineContinuations(this.src, next, end);
                if (open >= end || this.src.charCodeAt(open) !== CH_LPAREN)
                    return start;
                close = this.findClosingParenthesis(open + 1, end);
            }
        }
        else {
            const open = start + 1;
            if (quoted || (ch !== CH_LT && ch !== CH_GT) || open >= end || this.src.charCodeAt(open) !== CH_LPAREN) {
                return start;
            }
            close = this.findClosingParenthesis(open + 1, end);
        }
        return close === -1 ? end : close + 1;
    }
    scanParamName(s, start) {
        let i = start;
        if (i >= s.length)
            return i;
        const c = s.charCodeAt(i);
        // Special single-char params
        if (c === CH_AT ||
            c === CH_STAR ||
            c === CH_HASH ||
            c === CH_QUESTION ||
            c === CH_DASH ||
            c === CH_DOLLAR ||
            c === CH_BANG) {
            return i + 1;
        }
        // Digits
        if (c >= CH_0 && c <= CH_9) {
            while (i < s.length && s.charCodeAt(i) >= CH_0 && s.charCodeAt(i) <= CH_9)
                i++;
            return i;
        }
        // Regular name: [a-zA-Z_][a-zA-Z0-9_]*
        if ((c >= CH_a && c <= CH_z) || (c >= CH_A && c <= CH_Z) || c === CH_UNDERSCORE) {
            i++;
            while (i < s.length) {
                const ch = s.charCodeAt(i);
                if ((ch >= CH_a && ch <= CH_z) ||
                    (ch >= CH_A && ch <= CH_Z) ||
                    (ch >= CH_0 && ch <= CH_9) ||
                    ch === CH_UNDERSCORE)
                    i++;
                else
                    break;
            }
        }
        return i;
    }
    readAnsiCQuoted() {
        const quotePos = this.pos - 1;
        const result = decodeAnsiCQuoted(this.src, this.pos, this.srcEnd);
        this.pos = result.end;
        if (!result.closed)
            this.errors.push({ message: "unterminated ANSI-C quote", pos: quotePos });
        return result.value;
    }
    // Extract balanced parens for $(...) — respects nested quotes and case..esac
    extractBalanced() {
        const src = this.src;
        const len = this.srcEnd;
        const bt = this._buildParts || this._buildValue;
        let depth = 1;
        const start = this.pos;
        this._unbalanced = false;
        let wordStart = true;
        // Fast path: scan for simple cases with no nested quotes/parens/case. Nothing here
        // opens a paren — `(` breaks to the slow path — so depth stays 1 and the first `)`
        // closes the construct.
        while (this.pos < len) {
            const c = src.charCodeAt(this.pos);
            if (c === CH_RPAREN) {
                const result = bt ? src.slice(start, this.pos) : "";
                this.pos++;
                return result;
            }
            else if (c === CH_LPAREN || c === CH_BACKSLASH || c === CH_SQUOTE || c === CH_DQUOTE || c === CH_BACKTICK) {
                break;
            }
            else if (c === CH_LT && this.pos + 1 < len && src.charCodeAt(this.pos + 1) === CH_LT) {
                break;
            }
            else if (c === CH_HASH && wordStart) {
                break;
            }
            else if (c === 99 /* c */ &&
                wordStart &&
                this.pos + 3 < len &&
                src.charCodeAt(this.pos + 1) === 97 /* a */ &&
                src.charCodeAt(this.pos + 2) === 115 /* s */ &&
                src.charCodeAt(this.pos + 3) === 101 /* e */ &&
                (this.pos + 4 >= len || (src.charCodeAt(this.pos + 4) < 128 && charType[src.charCodeAt(this.pos + 4)] & 1))) {
                break;
            }
            else {
                wordStart = c < 128 && (charType[c] & 1) !== 0;
                this.pos++;
            }
        }
        // Slow path: just track position (source is copied verbatim, so slice at end)
        let caseDepth = 0;
        // Parentheses opened since the innermost `case` began. A `)` only terminates a case
        // pattern when nothing is open — otherwise it closes a pattern's leading `(`, an
        // extglob group, or a subshell in the case body, and must rebalance `depth`.
        let caseParens = 0;
        // Word-form parens resume mid-word; grammar parens resume where `#` can open a comment.
        const wordStartAfterParen = [];
        let pendingDelims = null;
        let arithBase = -1;
        // A `$((` extent is found by bash's arithmetic scanner, where `#` is ordinary, and keeps
        // that extent even for a command body. The two chars before `start` are the delimiter.
        const arithExtent = start >= 2 &&
            src.charCodeAt(start) === CH_LPAREN &&
            src.charCodeAt(start - 1) === CH_LPAREN &&
            src.charCodeAt(start - 2) === CH_DOLLAR;
        let substitutions = 0;
        let reported = false;
        let continuedDollarPos = -1;
        let continuedParenPos = -1;
        while (this.pos < len && depth > 0) {
            const ch = src.charCodeAt(this.pos);
            if (ch === CH_LPAREN) {
                const prev = this.pos > start ? src.charCodeAt(this.pos - 1) : 0;
                const commandDollarPos = prev === CH_DOLLAR ? this.pos - 1 : this.pos === continuedParenPos ? continuedDollarPos : -1;
                const wordParen = commandDollarPos !== -1 ||
                    prev === CH_LT ||
                    prev === CH_GT ||
                    prev === CH_EQ ||
                    prev === CH_AT ||
                    prev === CH_QUESTION ||
                    prev === CH_STAR ||
                    prev === CH_PLUS ||
                    prev === CH_BANG ||
                    (prev === CH_LPAREN && wordStartAfterParen[wordStartAfterParen.length - 1] === false) ||
                    (arithExtent && this.pos === start);
                wordStartAfterParen.push(!wordParen);
                wordStart = true;
                // (( opens arithmetic — suppress heredoc detection until the parens
                // rebalance so shift operators inside aren't mistaken for heredocs
                if (arithBase < 0 && this.pos + 1 < len && src.charCodeAt(this.pos + 1) === CH_LPAREN) {
                    arithBase = depth;
                }
                // Nested $( — count it against the shared budget (the substitution being
                // scanned is level one, hence >=) so over-deep chains surface a parse error.
                if (commandDollarPos !== -1 && ++substitutions + this._nestingDepth >= MAX_SYNTAX_NESTING) {
                    if (!reported) {
                        this.errors.push({ message: "maximum command substitution nesting depth exceeded", pos: commandDollarPos });
                        reported = true;
                    }
                }
                continuedDollarPos = -1;
                continuedParenPos = -1;
                depth++;
                if (caseDepth > 0)
                    caseParens++;
                this.pos++;
            }
            else if (ch === CH_RPAREN) {
                if (caseDepth > 0 && caseParens === 0) {
                    this.pos++;
                    wordStart = true;
                }
                else {
                    if (caseDepth > 0)
                        caseParens--;
                    depth--;
                    if (depth === 0) {
                        const result = bt ? src.slice(start, this.pos) : "";
                        this.pos++;
                        return result;
                    }
                    if (depth <= arithBase)
                        arithBase = -1;
                    wordStart = wordStartAfterParen.pop() ?? true;
                    this.pos++;
                }
            }
            else if (ch === CH_BACKSLASH) {
                if (this.pos > start && src.charCodeAt(this.pos - 1) === CH_DOLLAR) {
                    const logicalPos = skipLineContinuations(src, this.pos, len);
                    if (logicalPos > this.pos &&
                        src.charCodeAt(logicalPos) === CH_LPAREN &&
                        src.charCodeAt(logicalPos + 1) !== CH_LPAREN) {
                        continuedDollarPos = this.pos - 1;
                        continuedParenPos = logicalPos;
                    }
                }
                this.pos++;
                if (this.pos < len) {
                    if (src.charCodeAt(this.pos) !== CH_NL) {
                        wordStart = false;
                    }
                    this.pos++;
                }
            }
            else if (ch === CH_SQUOTE) {
                this.pos++;
                this.skipSQ();
                wordStart = false;
            }
            else if (ch === CH_DQUOTE) {
                this.pos++;
                this.skipDQ();
                wordStart = false;
            }
            else if (ch === CH_BACKTICK) {
                this.pos++;
                while (this.pos < len && src.charCodeAt(this.pos) !== CH_BACKTICK) {
                    if (src.charCodeAt(this.pos) === CH_BACKSLASH)
                        this.pos++;
                    if (this.pos < len)
                        this.pos++;
                }
                if (this.pos < len)
                    this.pos++;
                wordStart = false;
            }
            else if (ch === CH_LT && arithBase < 0 && this.pos + 1 < len && src.charCodeAt(this.pos + 1) === CH_LT) {
                // << is a heredoc operator even in case-pattern position — unquoted <<
                // inside a pattern is a bash syntax error, so no caseDepth gate here
                if (this.pos + 2 < len && src.charCodeAt(this.pos + 2) === CH_LT) {
                    this.pos += 3; // <<< herestring
                }
                else {
                    this.pos += 2;
                    const strip = this.pos < len && src.charCodeAt(this.pos) === CH_DASH;
                    if (strip)
                        this.pos++;
                    this.skipSpacesAndTabs();
                    this.readHereDocDelimiter();
                    // Empty unquoted delimiter means there was no delimiter word (`<< )`)
                    if (this._hereDelim || this._hereQuoted) {
                        (pendingDelims ??= []).push({ delimiter: this._hereDelim, strip, quoted: this._hereQuoted });
                    }
                }
                wordStart = false;
            }
            else if (ch === CH_NL && pendingDelims) {
                this.pos++;
                for (const hd of pendingDelims)
                    this.skipHereDocBody(hd.delimiter, hd.strip, true, hd.quoted);
                pendingDelims = null;
                wordStart = true;
            }
            else if (ch === CH_HASH && arithBase < 0 && !arithExtent && wordStart) {
                // Word-boundary # opens a comment — opaque up to (not including) the
                // newline, so quotes and << inside it stay inert
                while (this.pos < len && src.charCodeAt(this.pos) !== CH_NL)
                    this.pos++;
            }
            else {
                const wStart = this.pos;
                while (this.pos < len) {
                    const wc = src.charCodeAt(this.pos);
                    if (wc < 128 && charType[wc])
                        break;
                    this.pos++;
                }
                if (this.pos > wStart) {
                    const wLen = this.pos - wStart;
                    if (wLen === 4 && wordStart) {
                        const c0 = src.charCodeAt(wStart);
                        if (c0 === 99 &&
                            src.charCodeAt(wStart + 1) === 97 &&
                            src.charCodeAt(wStart + 2) === 115 &&
                            src.charCodeAt(wStart + 3) === 101) {
                            caseDepth++;
                        }
                        else if (c0 === 101 &&
                            src.charCodeAt(wStart + 1) === 115 &&
                            src.charCodeAt(wStart + 2) === 97 &&
                            src.charCodeAt(wStart + 3) === 99 &&
                            caseDepth > 0) {
                            caseDepth--;
                            if (caseDepth === 0)
                                caseParens = 0;
                        }
                    }
                    wordStart = false;
                }
                else {
                    const wc = src.charCodeAt(this.pos);
                    wordStart = wc < 128 && (charType[wc] & 1) !== 0;
                    this.pos++;
                }
            }
        }
        // Ran out of input before the closing paren.
        this._unbalanced = true;
        return bt ? src.slice(start, this.pos) : "";
    }
}
