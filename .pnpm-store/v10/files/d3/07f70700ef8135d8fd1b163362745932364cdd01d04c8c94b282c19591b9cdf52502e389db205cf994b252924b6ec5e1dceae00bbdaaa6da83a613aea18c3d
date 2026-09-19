import { hasEmbeddedWordStructure, LexContext, MAX_SYNTAX_NESTING, Token, Lexer, TokenValue } from "./lexer.js";
import { parseArithmeticExpression } from "./arithmetic.js";
import { computeWordParts, computeEmbeddedWordParts, computeHereDocBodyParts } from "./parts.js";
import { WordImpl } from "./word.js";
WordImpl._resolveWord = computeWordParts;
WordImpl._resolveHeredocBody = computeHereDocBodyParts;
class ArithmeticCommandImpl {
    type = "ArithmeticCommand";
    pos;
    end;
    body;
    #source;
    #depth;
    #expression = null;
    constructor(pos, end, body, source, depth) {
        this.pos = pos;
        this.end = end;
        this.body = body;
        this.#source = source;
        this.#depth = depth;
    }
    get expression() {
        if (this.#expression === null) {
            this.#expression = parseArithmeticWithParts(this.body, this.pos + 2, this.#source, this.#depth);
        }
        return this.#expression;
    }
    set expression(v) {
        this.#expression = v ?? undefined;
    }
    toJSON() {
        return {
            type: this.type,
            pos: this.pos,
            end: this.end,
            expression: this.expression,
            body: this.body,
        };
    }
}
class ArithmeticForImpl {
    type = "ArithmeticFor";
    pos;
    end;
    body;
    #initStr;
    #testStr;
    #updateStr;
    #initPos;
    #testPos;
    #updatePos;
    #source;
    #depth;
    #initialize = null;
    #test = null;
    #update = null;
    constructor(pos, end, body, initStr, testStr, updateStr, initPos, testPos, updatePos, source, depth) {
        this.pos = pos;
        this.end = end;
        this.body = body;
        this.#initStr = initStr;
        this.#testStr = testStr;
        this.#updateStr = updateStr;
        this.#initPos = initPos;
        this.#testPos = testPos;
        this.#updatePos = updatePos;
        this.#source = source;
        this.#depth = depth;
    }
    get initialize() {
        if (this.#initialize === null) {
            if (this.#initStr) {
                this.#initialize = parseArithmeticWithParts(this.#initStr, this.#initPos, this.#source, this.#depth);
            }
            else {
                this.#initialize = undefined;
            }
        }
        return this.#initialize;
    }
    set initialize(v) {
        this.#initialize = v ?? undefined;
    }
    get test() {
        if (this.#test === null) {
            if (this.#testStr) {
                this.#test = parseArithmeticWithParts(this.#testStr, this.#testPos, this.#source, this.#depth);
            }
            else {
                this.#test = undefined;
            }
        }
        return this.#test;
    }
    set test(v) {
        this.#test = v ?? undefined;
    }
    get update() {
        if (this.#update === null) {
            if (this.#updateStr) {
                this.#update = parseArithmeticWithParts(this.#updateStr, this.#updatePos, this.#source, this.#depth);
            }
            else {
                this.#update = undefined;
            }
        }
        return this.#update;
    }
    set update(v) {
        this.#update = v ?? undefined;
    }
    toJSON() {
        return {
            type: this.type,
            pos: this.pos,
            end: this.end,
            initialize: this.initialize,
            test: this.test,
            update: this.update,
            body: this.body,
        };
    }
}
const CASE_TERMINATORS = {
    [Token.DoubleSemi]: ";;",
    [Token.SemiAmp]: ";&",
    [Token.DoubleSemiAmp]: ";;&",
};
const REDIRECT_OPS = {
    ">": ">",
    ">>": ">>",
    "<": "<",
    "<<": "<<",
    "<<-": "<<-",
    "<<<": "<<<",
    "<>": "<>",
    "<&": "<&",
    ">&": ">&",
    ">|": ">|",
    "&>": "&>",
    "&>>": "&>>",
};
function parseArithmeticWithParts(body, offset, source, depth = 0) {
    if (!hasEmbeddedWordStructure(source, offset, offset + body.length)) {
        return parseArithmeticExpression(body, offset) ?? undefined;
    }
    const commandExpansions = [];
    const embeddedWords = [];
    const lexer = new Lexer(source);
    const expression = parseArithmeticExpression(body, offset, {
        commandExpansions,
        embeddedWords,
        findClosingBracket: (start, end) => lexer.findClosingBracket(start, end),
        findClosingBrace: (start, end) => lexer.findClosingBrace(start, end),
        findClosingParenthesis: (start, end) => lexer.findClosingParenthesis(start, end),
        findArithmeticExpansionEnd: (start, end) => lexer.findArithmeticExpansionEnd(start, end),
        findArithmeticWordEnd: (start, end) => lexer.findArithmeticWordEnd(start, end),
    }) ?? undefined;
    for (const node of commandExpansions) {
        if (node.inner !== undefined) {
            if (depth <= MAX_SYNTAX_NESTING) {
                const innerStart = node.pos + 2;
                node.script = parseRegion(source, innerStart, innerStart + node.inner.length, depth + 1);
            }
            node.inner = undefined;
        }
    }
    for (const node of embeddedWords)
        node.parts = computeEmbeddedWordParts(source, node, depth);
    return expression;
}
// Lookup tables for O(1) token classification (replaces sequential comparisons)
const listTerminators = new Uint8Array(37);
listTerminators[Token.EOF] = 1;
listTerminators[Token.RParen] = 1;
listTerminators[Token.RBrace] = 1;
listTerminators[Token.Then] = 1;
listTerminators[Token.Else] = 1;
listTerminators[Token.Elif] = 1;
listTerminators[Token.Fi] = 1;
listTerminators[Token.Do] = 1;
listTerminators[Token.Done] = 1;
listTerminators[Token.Esac] = 1;
listTerminators[Token.DoubleSemi] = 1;
listTerminators[Token.SemiAmp] = 1;
listTerminators[Token.DoubleSemiAmp] = 1;
// After one of these Bash is at a command-start position, the only place a reserved-word
// terminator may follow with no separator.
const compoundClosers = new Uint8Array(37);
compoundClosers[Token.RParen] = 1;
compoundClosers[Token.RBrace] = 1;
compoundClosers[Token.DblRBracket] = 1;
compoundClosers[Token.Fi] = 1;
compoundClosers[Token.Done] = 1;
compoundClosers[Token.Esac] = 1;
compoundClosers[Token.ArithCmd] = 1;
// Inside `[[ ]]` only an unquoted `!` negates; `'!'` and `\!` are ordinary operands.
function isTestNegation(t) {
    return t.token === Token.Word && t.keywordEligible && t.value === "!";
}
const commandStarts = new Uint8Array(37);
commandStarts[Token.Word] = 1;
commandStarts[Token.Assignment] = 1;
commandStarts[Token.Bang] = 1;
commandStarts[Token.LParen] = 1;
commandStarts[Token.LBrace] = 1;
commandStarts[Token.DblLBracket] = 1;
commandStarts[Token.If] = 1;
commandStarts[Token.For] = 1;
commandStarts[Token.While] = 1;
commandStarts[Token.Until] = 1;
commandStarts[Token.Case] = 1;
commandStarts[Token.Function] = 1;
commandStarts[Token.Select] = 1;
commandStarts[Token.ArithCmd] = 1;
commandStarts[Token.Coproc] = 1;
commandStarts[Token.Redirect] = 1;
const UNARY_TEST_OPS = {
    "-a": 1,
    "-b": 1,
    "-c": 1,
    "-d": 1,
    "-e": 1,
    "-f": 1,
    "-g": 1,
    "-h": 1,
    "-k": 1,
    "-p": 1,
    "-r": 1,
    "-s": 1,
    "-t": 1,
    "-u": 1,
    "-v": 1,
    "-w": 1,
    "-x": 1,
    "-z": 1,
    "-n": 1,
    "-o": 1,
    "-N": 1,
    "-S": 1,
    "-L": 1,
    "-G": 1,
    "-O": 1,
    "-R": 1,
};
const BINARY_TEST_OPS = {
    "==": 1,
    "!=": 1,
    "=~": 1,
    "=": 1,
    "-eq": 1,
    "-ne": 1,
    "-lt": 1,
    "-le": 1,
    "-gt": 1,
    "-ge": 1,
    "-nt": 1,
    "-ot": 1,
    "-ef": 1,
    "<": 1,
    ">": 1,
};
// A heredoc delimiter is quote-removed but never expanded, so it has no expandable structure.
function heredocDelimiterParts(value) {
    return (source, word) => {
        const raw = source.slice(word.pos, word.end);
        return raw === value ? undefined : [{ type: "Literal", value, text: raw }];
    };
}
const EMPTY_REDIRECTS = [];
function ownEmpty(values) {
    return values.length === 0 ? [] : values;
}
export function parse(source) {
    return new Parser(source, 0, source.length).run();
}
// Parse a [start, end) window of `source` in place, so the resulting nodes index the original
// source directly. Used to resolve substitution scripts with absolute offsets; not public API.
export function parseRegion(source, start, end, depth = 0) {
    return new Parser(source, start, end, depth).run();
}
class Parser {
    tok;
    source;
    start;
    end;
    depth;
    errors = null;
    _redirects = EMPTY_REDIRECTS;
    syntaxDepth = 0;
    // `depth` counts the substitution scripts (and sub-fields) enclosing this region; it
    // shares the MAX_SYNTAX_NESTING budget with the lexer's lazy word-part materialization.
    constructor(source, start, end, depth = 0) {
        this.tok = new Lexer(source, start, end);
        this.tok._nestingDepth = depth;
        this.source = source;
        this.start = start;
        this.end = end;
        this.depth = depth;
    }
    run() {
        const start = this.start;
        // The boundary script one level past the budget still parses (one level is cheap and
        // iterative) but is flagged: everything below it stays unresolved.
        if (this.depth > MAX_SYNTAX_NESTING)
            this.error("maximum substitution nesting depth exceeded", start);
        let shebang;
        if (start === 0 && this.source.charCodeAt(0) === 35 && this.source.charCodeAt(1) === 33) {
            const nl = this.source.indexOf("\n");
            shebang = nl === -1 ? this.source : this.source.slice(0, nl);
        }
        const commands = this.list();
        for (;;) {
            const unexpected = this.tok.peek(LexContext.CommandStart);
            if (unexpected.token === Token.EOF)
                break;
            this.error(`unexpected token '${unexpected.value}'`, unexpected.pos);
            // `In` cannot join `listTerminators`: `list()` shares it, and `in` must not terminate a
            // list inside `for`/`case`.
            if (!listTerminators[unexpected.token] && unexpected.token !== Token.In)
                break;
            this.tok.next(LexContext.CommandStart);
            let separator = this.tok.peek(LexContext.CommandStart).token;
            if (separator !== Token.Semi && separator !== Token.Newline && separator !== Token.Amp)
                break;
            while (separator === Token.Semi || separator === Token.Newline || separator === Token.Amp) {
                this.tok.next(LexContext.CommandStart);
                separator = this.tok.peek(LexContext.CommandStart).token;
            }
            const recovered = this.list();
            for (let i = 0; i < recovered.length; i++)
                commands.push(recovered[i]);
        }
        const lexerErrors = this.tok._errors;
        if (lexerErrors !== null && lexerErrors.length > 0) {
            const errors = (this.errors ??= []);
            for (let i = 0; i < lexerErrors.length; i++)
                errors.push(lexerErrors[i]);
        }
        if (this.errors !== null && this.errors.length > 1)
            this.errors.sort((a, b) => a.pos - b.pos);
        const result = {
            type: "Script",
            pos: start,
            end: this.end,
            shebang,
            commands,
            errors: this.errors ?? undefined,
        };
        return result;
    }
    error(message, pos) {
        (this.errors ??= []).push({ message, pos });
    }
    skipSemi() {
        if (this.tok.peek(LexContext.Normal).token === Token.Semi)
            this.tok.next(LexContext.Normal);
    }
    accept(token, ctx = LexContext.Normal) {
        if (this.tok.peek(ctx).token === token)
            return this.tok.next(ctx);
        return null;
    }
    acceptEnd(token, ctx = LexContext.Normal) {
        if (this.tok.peek(ctx).token === token)
            return this.tok.next(ctx).end;
        return -1;
    }
    skipNewlines(ctx = LexContext.Normal) {
        while (this.tok.peek(ctx).token === Token.Newline)
            this.tok.next(ctx);
    }
    makeStatement(command, redirects) {
        const end = redirects.length > 0 ? redirects[redirects.length - 1].end : command.end;
        return {
            type: "Statement",
            pos: command.pos,
            end,
            command,
            background: undefined,
            redirects: ownEmpty(redirects),
        };
    }
    // list := and_or ((';' | '&' | NEWLINE) and_or)* [';' | '&' | NEWLINE]
    list() {
        const commands = [];
        this.skipNewlines(LexContext.CommandStart);
        let t = this.tok.peek(LexContext.CommandStart).token;
        if (listTerminators[t] || !commandStarts[t])
            return commands;
        const first = this.andOr();
        if (first) {
            const redirects = this._redirects;
            this._redirects = EMPTY_REDIRECTS;
            commands.push(this.makeStatement(first, redirects));
        }
        for (;;) {
            t = this.tok.peekFollow(compoundClosers).token;
            if (t !== Token.Semi && t !== Token.Newline && t !== Token.Amp)
                break;
            const isBackground = t === Token.Amp;
            const sepEnd = this.tok.next(LexContext.Normal).end;
            if (isBackground) {
                const stmt = commands[commands.length - 1];
                stmt.background = true;
                stmt.end = sepEnd;
            }
            this.skipNewlines(LexContext.CommandStart);
            t = this.tok.peek(LexContext.CommandStart).token;
            if (listTerminators[t] || !commandStarts[t])
                break;
            const node = this.andOr();
            if (node) {
                const redirects = this._redirects;
                this._redirects = EMPTY_REDIRECTS;
                commands.push(this.makeStatement(node, redirects));
            }
        }
        return commands;
    }
    // and_or := pipeline (('&&' | '||') newlines pipeline)*
    andOr() {
        const first = this.pipeline();
        if (!first)
            return null;
        let t = this.tok.peek(LexContext.Normal).token;
        if (t !== Token.And && t !== Token.Or)
            return first;
        // Wrap first pipeline with any pending redirects before creating AndOr
        let wrappedFirst = first;
        if (this._redirects.length > 0) {
            wrappedFirst = this.makeStatement(first, this._redirects);
            this._redirects = EMPTY_REDIRECTS;
        }
        const commands = [wrappedFirst];
        const operators = [];
        do {
            const operatorToken = this.tok.next(LexContext.Normal);
            const operator = operatorToken.token === Token.And ? "&&" : "||";
            this.skipNewlines(LexContext.CommandStart);
            const next = this.pipeline();
            if (!next) {
                this.error(`expected command after '${operator}'`, operatorToken.end);
                break;
            }
            operators.push(operator);
            commands.push(next);
            t = this.tok.peek(LexContext.Normal).token;
        } while (t === Token.And || t === Token.Or);
        return {
            type: "AndOr",
            pos: first.pos,
            end: commands[commands.length - 1].end,
            commands,
            operators,
        };
    }
    wrapCompoundRedirects(node) {
        const redirects = this._redirects;
        this._redirects = EMPTY_REDIRECTS;
        if (redirects.length === 0)
            return node;
        return this.makeStatement(node, redirects);
    }
    // pipeline := ['time' ['-p']] ['!'] command ('|' newlines command)*
    pipeline() {
        let time = false;
        let pipelinePos = 0;
        let prefixEnd = 0;
        const firstToken = this.tok.peek(LexContext.CommandStart);
        if (firstToken.token === Token.Word && firstToken.keywordEligible && firstToken.value === "time") {
            time = true;
            const timeToken = this.tok.next(LexContext.CommandStart);
            pipelinePos = timeToken.pos;
            prefixEnd = timeToken.end;
            const flag = this.tok.peek(LexContext.CommandStart);
            if (flag.token === Token.Word && flag.keywordEligible && flag.value === "-p")
                prefixEnd = this.tok.next(LexContext.CommandStart).end;
        }
        let negated = false;
        const bang = this.tok.peek(LexContext.CommandStart);
        if (bang.token === Token.Bang) {
            if (!time)
                pipelinePos = bang.pos;
            prefixEnd = this.tok.next(LexContext.CommandStart).end;
            negated = true;
            const repeated = this.tok.peek(LexContext.CommandStart);
            if (repeated.token === Token.Bang) {
                this.error("unexpected token '!'", repeated.pos);
                do {
                    prefixEnd = this.tok.next(LexContext.CommandStart).end;
                } while (this.tok.peek(LexContext.CommandStart).token === Token.Bang);
            }
        }
        const first = this.command();
        if (!first) {
            if (time || negated) {
                const pipeline = {
                    type: "Pipeline",
                    pos: pipelinePos,
                    end: prefixEnd,
                    commands: [],
                    negated: negated ? true : undefined,
                    operators: [],
                    time: time ? true : undefined,
                };
                return pipeline;
            }
            return null;
        }
        if (!time && !negated)
            pipelinePos = first.pos;
        const commands = [first];
        const operators = [];
        // Save _redirects from first command — only wrap in Statement if piped
        let firstRedirects = this._redirects;
        this._redirects = EMPTY_REDIRECTS;
        while (this.tok.peek(LexContext.Normal).token === Token.Pipe) {
            if (commands.length === 1 && firstRedirects.length > 0) {
                commands[0] = this.makeStatement(first, firstRedirects);
                firstRedirects = [];
            }
            const pipeToken = this.tok.next(LexContext.Normal);
            const operator = pipeToken.value === "|&" ? "|&" : "|";
            this.skipNewlines(LexContext.CommandStart);
            const cmd = this.command();
            if (!cmd) {
                this.error(`expected command after '${operator}'`, pipeToken.end);
                break;
            }
            operators.push(operator);
            commands.push(this.wrapCompoundRedirects(cmd));
        }
        if (commands.length === 1 && !negated && !time) {
            // Pass redirects up for list() to consume
            this._redirects = firstRedirects;
            return commands[0];
        }
        // Wrap first command's compound redirects in Statement if needed
        if (firstRedirects.length > 0) {
            commands[0] = this.makeStatement(first, firstRedirects);
        }
        const pipeline = {
            type: "Pipeline",
            pos: pipelinePos,
            end: commands[commands.length - 1].end,
            commands,
            negated: negated ? true : undefined,
            operators,
            time: time ? true : undefined,
        };
        return pipeline;
    }
    // command := compound_command | function_def | simple_command
    command() {
        switch (this.tok.peek(LexContext.CommandStart).token) {
            case Token.LParen:
                return this.subshell();
            case Token.LBrace:
                return this.braceGroup();
            case Token.If:
                return this.ifClause();
            case Token.For:
                return this.forClause();
            case Token.While:
                return this.whileClause();
            case Token.Until:
                return this.untilClause();
            case Token.Case:
                return this.caseClause();
            case Token.Function:
                return this.functionDef();
            case Token.Select:
                return this.selectClause();
            case Token.DblLBracket:
                return this.testCommand();
            case Token.ArithCmd:
                return this.arithCommand();
            case Token.Coproc:
                return this.coprocCommand();
            case Token.Word:
            case Token.Assignment:
            case Token.Redirect:
                return this.simpleCommandOrFunction();
            default:
                return null;
        }
    }
    collectTrailingRedirects() {
        let redirects = EMPTY_REDIRECTS;
        while (this.tok.peekFollow(compoundClosers).token === Token.Redirect) {
            redirects = this.collectRedirect(redirects, LexContext.Normal);
        }
        return redirects;
    }
    // arith_command := (( expr ))
    arithCommand() {
        const tok = this.tok.next(LexContext.CommandStart);
        this._redirects = this.collectTrailingRedirects();
        return new ArithmeticCommandImpl(tok.pos, tok.end, tok.value, this.source, this.depth);
    }
    // coproc := COPROC [name] command [redirections]
    coprocCommand() {
        const startTok = this.tok.next(LexContext.CommandStart);
        const pos = startTok.pos;
        const startEnd = startTok.end;
        const t = this.tok.peek(LexContext.CommandStart);
        // If next token starts a compound command, no name — parse full pipeline
        if (t.token !== Token.Word && t.token !== Token.Assignment && t.token !== Token.Redirect) {
            const body = this.pipeline() ?? {
                type: "Command",
                pos,
                end: startEnd,
                name: undefined,
                prefix: [],
                suffix: [],
                redirects: [],
            };
            const bodyRedirects = this._redirects;
            this._redirects = EMPTY_REDIRECTS;
            const redirects = this.collectTrailingRedirects();
            const allRedirects = [...bodyRedirects, ...redirects];
            const end = allRedirects.length > 0 ? allRedirects[allRedirects.length - 1].end : body.end;
            return { type: "Coproc", pos, end, name: undefined, body, redirects: allRedirects };
        }
        // Consume first word as tentative name
        const tentativeWord = this.toWord(this.tok.next(LexContext.CommandStart));
        // Try to parse what follows as a pipeline
        const body = this.pipeline();
        if (body === null) {
            const cmd = {
                type: "Command",
                pos: tentativeWord.pos,
                end: tentativeWord.end,
                name: tentativeWord,
                prefix: [],
                suffix: [],
                redirects: [],
            };
            const redirects = this.collectTrailingRedirects();
            const end = redirects.length > 0 ? redirects[redirects.length - 1].end : cmd.end;
            return { type: "Coproc", pos, end, name: undefined, body: cmd, redirects: ownEmpty(redirects) };
        }
        if (body.type === "Command") {
            const cmd = body;
            if (cmd.name) {
                cmd.suffix = [cmd.name, ...cmd.suffix];
            }
            cmd.name = tentativeWord;
            cmd.pos = tentativeWord.pos;
            const redirects = this.collectTrailingRedirects();
            const end = redirects.length > 0 ? redirects[redirects.length - 1].end : cmd.end;
            return { type: "Coproc", pos, end, name: undefined, body: cmd, redirects: ownEmpty(redirects) };
        }
        // Pipeline or compound command — tentative "name" IS the coproc name
        const bodyRedirects = this._redirects;
        this._redirects = EMPTY_REDIRECTS;
        const redirects = this.collectTrailingRedirects();
        const allRedirects = [...bodyRedirects, ...redirects];
        const end = allRedirects.length > 0 ? allRedirects[allRedirects.length - 1].end : body.end;
        return { type: "Coproc", pos, end, name: tentativeWord, body, redirects: allRedirects };
    }
    // subshell := '(' list ')'
    subshell() {
        return this.subshellBody(this.tok.next(LexContext.CommandStart).pos);
    }
    // Continues a subshell whose '(' the caller already consumed.
    subshellBody(pos) {
        if (this.syntaxDepth === MAX_SYNTAX_NESTING) {
            this.error("maximum subshell nesting depth exceeded", pos);
            const closeEnd = this.tok.skipSubshellBody();
            if (closeEnd < 0)
                this.error("expected ')' to close subshell", this.tok.getPos());
            const end = closeEnd >= 0 ? closeEnd : pos;
            this._redirects = this.collectTrailingRedirects();
            return { type: "Subshell", pos, end, body: this.makeCompoundList([]) };
        }
        this.syntaxDepth++;
        const commands = this.list();
        this.syntaxDepth--;
        const closeEnd = this.acceptEnd(Token.RParen, LexContext.Normal);
        if (closeEnd < 0)
            this.error("expected ')' to close subshell", this.tok.getPos());
        const end = closeEnd >= 0 ? closeEnd : pos;
        this._redirects = this.collectTrailingRedirects();
        return { type: "Subshell", pos, end, body: this.makeCompoundList(commands) };
    }
    // brace_group := '{' list '}'
    braceGroup() {
        const pos = this.tok.next(LexContext.CommandStart).pos;
        if (this.syntaxDepth === MAX_SYNTAX_NESTING) {
            this.error("maximum brace group nesting depth exceeded", pos);
            const closeEnd = this.tok.skipCompoundBody(Token.RBrace);
            if (closeEnd < 0)
                this.error("expected '}' to close brace group", this.tok.getPos());
            const end = closeEnd >= 0 ? closeEnd : pos;
            this._redirects = this.collectTrailingRedirects();
            return { type: "BraceGroup", pos, end, body: this.makeCompoundList([]) };
        }
        this.syntaxDepth++;
        const commands = this.list();
        this.syntaxDepth--;
        const closeEnd = this.acceptEnd(Token.RBrace, LexContext.Normal);
        if (closeEnd < 0)
            this.error("expected '}' to close brace group", this.tok.getPos());
        const end = closeEnd >= 0 ? closeEnd : pos;
        this._redirects = this.collectTrailingRedirects();
        return { type: "BraceGroup", pos, end, body: this.makeCompoundList(commands) };
    }
    // if_clause := IF list THEN list (ELIF list THEN list)* [ELSE list] FI
    ifClause() {
        const pos = this.tok.next(LexContext.CommandStart).pos;
        if (this.syntaxDepth === MAX_SYNTAX_NESTING) {
            this.error("maximum if nesting depth exceeded", pos);
            const closeEnd = this.tok.skipCompoundBody(Token.Fi);
            if (closeEnd < 0)
                this.error("expected 'fi' to close 'if'", this.tok.getPos());
            const end = closeEnd >= 0 ? closeEnd : pos;
            this._redirects = this.collectTrailingRedirects();
            return {
                type: "If",
                pos,
                end,
                clause: this.makeCompoundList([]),
                then: this.makeCompoundList([]),
                else: undefined,
            };
        }
        this.syntaxDepth++;
        let firstBranch;
        let lastBranch;
        let branchPos = pos;
        let clause;
        let then_;
        for (;;) {
            clause = this.makeCompoundList(this.list());
            this.skipSemi();
            const thenToken = this.accept(Token.Then, LexContext.CommandStart);
            if (!thenToken)
                this.error("expected 'then'", this.tok.getPos());
            const thenCommands = this.list();
            if (thenToken && thenCommands.length === 0)
                this.error("expected command after 'then'", this.tok.peek(LexContext.CommandStart).pos);
            then_ = this.makeCompoundList(thenCommands);
            this.skipSemi();
            const elif = this.accept(Token.Elif, LexContext.CommandStart);
            if (!elif)
                break;
            const branch = {
                type: "If",
                pos: branchPos,
                end: branchPos,
                clause,
                then: then_,
                else: undefined,
            };
            if (lastBranch)
                lastBranch.else = branch;
            else
                firstBranch = branch;
            lastBranch = branch;
            branchPos = elif.pos;
        }
        let else_;
        let end;
        if (this.accept(Token.Else, LexContext.CommandStart)) {
            else_ = this.makeCompoundList(this.list());
            this.skipSemi();
            const closeEnd = this.acceptEnd(Token.Fi, LexContext.CommandStart);
            if (closeEnd < 0)
                this.error("expected 'fi' to close 'if'", this.tok.getPos());
            end = closeEnd >= 0 ? closeEnd : branchPos;
        }
        else {
            const closeEnd = this.acceptEnd(Token.Fi, LexContext.CommandStart);
            if (closeEnd < 0)
                this.error("expected 'fi' to close 'if'", this.tok.getPos());
            end = closeEnd >= 0 ? closeEnd : branchPos;
        }
        this.syntaxDepth--;
        this._redirects = this.collectTrailingRedirects();
        const finalBranch = { type: "If", pos: branchPos, end, clause, then: then_, else: else_ };
        if (!firstBranch)
            return finalBranch;
        lastBranch.else = finalBranch;
        let branch = firstBranch;
        while (branch !== finalBranch) {
            branch.end = end;
            branch = branch.else;
        }
        return firstBranch;
    }
    // for_clause := FOR word [IN word* (';'|NL)] DO list DONE
    //            | FOR '((' expr '))' [';'|NL] DO list DONE
    forClause() {
        const pos = this.tok.next(LexContext.CommandStart).pos;
        if (this.tok.peek(LexContext.Normal).token === Token.LParen) {
            return this.cStyleFor(pos);
        }
        const name = this.readWord(LexContext.Normal);
        const wordlist = [];
        this.skipNewlines(LexContext.CommandStart);
        if (this.tok.peek(LexContext.CommandStart).token === Token.In) {
            this.tok.next(LexContext.CommandStart);
            while (this.tok.peek(LexContext.Normal).token === Token.Word) {
                wordlist.push(this.readWord(LexContext.Normal));
            }
        }
        this.skipSemi();
        this.skipNewlines(LexContext.CommandStart);
        if (this.tok.peek(LexContext.CommandStart).token === Token.LBrace) {
            const bg = this.braceGroup();
            return { type: "For", pos, end: bg.end, name, wordlist, body: bg.body };
        }
        if (!this.accept(Token.Do, LexContext.CommandStart))
            this.error("expected 'do'", this.tok.getPos());
        if (this.syntaxDepth === MAX_SYNTAX_NESTING) {
            this.error("maximum for nesting depth exceeded", pos);
            const closeEnd = this.tok.skipCompoundBody(Token.Done);
            if (closeEnd < 0)
                this.error("expected 'done' to close 'for'", this.tok.getPos());
            const end = closeEnd >= 0 ? closeEnd : pos;
            this._redirects = this.collectTrailingRedirects();
            return { type: "For", pos, end, name, wordlist, body: this.makeCompoundList([]) };
        }
        this.syntaxDepth++;
        const body = this.list();
        this.syntaxDepth--;
        this.skipSemi();
        const closeEnd = this.acceptEnd(Token.Done, LexContext.CommandStart);
        if (closeEnd < 0)
            this.error("expected 'done' to close 'for'", this.tok.getPos());
        const end = closeEnd >= 0 ? closeEnd : pos;
        this._redirects = this.collectTrailingRedirects();
        return { type: "For", pos, end, name, wordlist, body: this.makeCompoundList(body) };
    }
    // C-style for: (( expr; expr; expr )) [;|NL] do list done | { list }
    cStyleFor(pos) {
        const [initStr, testStr, updateStr, initPos, testPos, updatePos] = this.tok.readCStyleForExprs();
        if (this.tok.peek(LexContext.CommandStart).token === Token.Semi)
            this.tok.next(LexContext.CommandStart);
        this.skipNewlines(LexContext.CommandStart);
        if (this.tok.peek(LexContext.CommandStart).token === Token.LBrace) {
            const bg = this.braceGroup();
            return new ArithmeticForImpl(pos, bg.end, bg.body, initStr, testStr, updateStr, initPos, testPos, updatePos, this.source, this.depth);
        }
        if (!this.accept(Token.Do, LexContext.CommandStart))
            this.error("expected 'do'", this.tok.getPos());
        if (this.syntaxDepth === MAX_SYNTAX_NESTING) {
            this.error("maximum for nesting depth exceeded", pos);
            const closeEnd = this.tok.skipCompoundBody(Token.Done);
            if (closeEnd < 0)
                this.error("expected 'done' to close 'for'", this.tok.getPos());
            const end = closeEnd >= 0 ? closeEnd : pos;
            this._redirects = this.collectTrailingRedirects();
            return new ArithmeticForImpl(pos, end, this.makeCompoundList([]), initStr, testStr, updateStr, initPos, testPos, updatePos, this.source, this.depth);
        }
        this.syntaxDepth++;
        const body = this.list();
        this.syntaxDepth--;
        const closeEnd = this.acceptEnd(Token.Done, LexContext.CommandStart);
        if (closeEnd < 0)
            this.error("expected 'done' to close 'for'", this.tok.getPos());
        const end = closeEnd >= 0 ? closeEnd : pos;
        this._redirects = this.collectTrailingRedirects();
        return new ArithmeticForImpl(pos, end, this.makeCompoundList(body), initStr, testStr, updateStr, initPos, testPos, updatePos, this.source, this.depth);
    }
    whileClause() {
        return this.whileOrUntil("while");
    }
    untilClause() {
        return this.whileOrUntil("until");
    }
    whileOrUntil(kind) {
        const pos = this.tok.next(LexContext.CommandStart).pos;
        if (this.syntaxDepth === MAX_SYNTAX_NESTING) {
            this.error(`maximum ${kind} nesting depth exceeded`, pos);
            const closeEnd = this.tok.skipCompoundBody(Token.Done);
            if (closeEnd < 0)
                this.error(`expected 'done' to close '${kind}'`, this.tok.getPos());
            const end = closeEnd >= 0 ? closeEnd : pos;
            this._redirects = this.collectTrailingRedirects();
            return {
                type: "While",
                pos,
                end,
                kind,
                clause: this.makeCompoundList([]),
                body: this.makeCompoundList([]),
            };
        }
        this.syntaxDepth++;
        const clause = this.makeCompoundList(this.list());
        this.skipSemi();
        if (!this.accept(Token.Do, LexContext.CommandStart))
            this.error("expected 'do'", this.tok.getPos());
        const body = this.list();
        this.skipSemi();
        const closeEnd = this.acceptEnd(Token.Done, LexContext.CommandStart);
        if (closeEnd < 0)
            this.error(`expected 'done' to close '${kind}'`, this.tok.getPos());
        const end = closeEnd >= 0 ? closeEnd : pos;
        this.syntaxDepth--;
        this._redirects = this.collectTrailingRedirects();
        return { type: "While", pos, end, kind, clause, body: this.makeCompoundList(body) };
    }
    // case_clause := CASE word IN (pattern) list (;; | ;& | ;;&) ... ESAC
    caseClause() {
        const pos = this.tok.next(LexContext.CommandStart).pos;
        const word = this.readWord(LexContext.Normal);
        this.skipNewlines(LexContext.CommandStart);
        if (!this.accept(Token.In, LexContext.CommandStart))
            this.error("expected 'in' after 'case' word", this.tok.getPos());
        this.skipNewlines(LexContext.CommandStart);
        if (this.syntaxDepth === MAX_SYNTAX_NESTING) {
            this.error("maximum case nesting depth exceeded", pos);
            const closeEnd = this.tok.skipCompoundBody(Token.Esac);
            if (closeEnd < 0)
                this.error("expected 'esac' to close 'case'", this.tok.getPos());
            const end = closeEnd >= 0 ? closeEnd : pos;
            this._redirects = this.collectTrailingRedirects();
            return { type: "Case", pos, end, word, items: [] };
        }
        this.syntaxDepth++;
        const items = [];
        let t = this.tok.peek(LexContext.CommandStart).token;
        while (t !== Token.Esac && t !== Token.EOF) {
            const itemPos = this.tok.peek(LexContext.Normal).pos;
            this.accept(Token.LParen, LexContext.Normal);
            const pattern = [];
            t = this.tok.peek(LexContext.Normal).token;
            while (t !== Token.RParen && t !== Token.EOF) {
                if (t !== Token.Pipe)
                    pattern.push(this.toWord(this.tok.next(LexContext.Normal)));
                else
                    this.tok.next(LexContext.Normal);
                t = this.tok.peek(LexContext.Normal).token;
            }
            const rparenEnd = this.acceptEnd(Token.RParen, LexContext.Normal);
            const cmds = this.list();
            let itemEnd = rparenEnd >= 0 ? rparenEnd : itemPos;
            if (cmds.length > 0)
                itemEnd = cmds[cmds.length - 1].end;
            const item = {
                type: "CaseItem",
                pos: itemPos,
                end: itemEnd,
                pattern,
                body: this.makeCompoundList(cmds),
                terminator: undefined,
            };
            t = this.tok.peek(LexContext.CommandStart).token;
            if (t === Token.DoubleSemi || t === Token.SemiAmp || t === Token.DoubleSemiAmp) {
                const termTok = this.tok.next(LexContext.CommandStart);
                item.terminator = CASE_TERMINATORS[termTok.token];
                item.end = termTok.end;
            }
            items.push(item);
            this.skipNewlines(LexContext.CommandStart);
            t = this.tok.peek(LexContext.CommandStart).token;
        }
        const closeEnd = this.acceptEnd(Token.Esac, LexContext.CommandStart);
        if (closeEnd < 0)
            this.error("expected 'esac' to close 'case'", this.tok.getPos());
        const end = closeEnd >= 0 ? closeEnd : pos;
        this.syntaxDepth--;
        this._redirects = this.collectTrailingRedirects();
        return { type: "Case", pos, end, word, items };
    }
    // select_clause := SELECT word [IN word* (';'|NL)] DO list DONE
    selectClause() {
        const pos = this.tok.next(LexContext.CommandStart).pos;
        const name = this.readWord(LexContext.Normal);
        const wordlist = [];
        this.skipNewlines(LexContext.CommandStart);
        if (this.tok.peek(LexContext.CommandStart).token === Token.In) {
            this.tok.next(LexContext.CommandStart);
            while (this.tok.peek(LexContext.Normal).token === Token.Word) {
                wordlist.push(this.readWord(LexContext.Normal));
            }
        }
        this.skipSemi();
        this.skipNewlines(LexContext.CommandStart);
        if (this.tok.peek(LexContext.CommandStart).token === Token.LBrace) {
            const bg = this.braceGroup();
            return { type: "Select", pos, end: bg.end, name, wordlist, body: bg.body };
        }
        if (!this.accept(Token.Do, LexContext.CommandStart))
            this.error("expected 'do'", this.tok.getPos());
        if (this.syntaxDepth === MAX_SYNTAX_NESTING) {
            this.error("maximum select nesting depth exceeded", pos);
            const closeEnd = this.tok.skipCompoundBody(Token.Done);
            if (closeEnd < 0)
                this.error("expected 'done' to close 'select'", this.tok.getPos());
            const end = closeEnd >= 0 ? closeEnd : pos;
            this._redirects = this.collectTrailingRedirects();
            return { type: "Select", pos, end, name, wordlist, body: this.makeCompoundList([]) };
        }
        this.syntaxDepth++;
        const body = this.list();
        this.syntaxDepth--;
        this.skipSemi();
        const closeEnd = this.acceptEnd(Token.Done, LexContext.CommandStart);
        if (closeEnd < 0)
            this.error("expected 'done' to close 'select'", this.tok.getPos());
        const end = closeEnd >= 0 ? closeEnd : pos;
        this._redirects = this.collectTrailingRedirects();
        return { type: "Select", pos, end, name, wordlist, body: this.makeCompoundList(body) };
    }
    // test_command := [[ test_expr ]]
    testCommand() {
        const pos = this.tok.next(LexContext.CommandStart).pos; // consume [[
        const expr = this.parseTestOr();
        const closeEnd = this.acceptEnd(Token.DblRBracket, LexContext.TestMode);
        if (closeEnd < 0)
            this.error("expected ']]' to close '[['", this.tok.getPos());
        const end = closeEnd >= 0 ? closeEnd : pos;
        this._redirects = this.collectTrailingRedirects();
        return { type: "TestCommand", pos, end, expression: expr };
    }
    // test_or := test_and ('||' test_and)*
    parseTestOr() {
        let left = this.parseTestAnd();
        while (this.tok.peek(LexContext.TestMode).token === Token.Or) {
            this.tok.next(LexContext.TestMode);
            const right = this.parseTestAnd();
            left = {
                type: "TestLogical",
                pos: left.pos,
                end: right.end,
                operator: "||",
                left,
                right,
            };
        }
        return left;
    }
    // test_and := test_not ('&&' test_not)*
    parseTestAnd() {
        let left = this.parseTestNot();
        while (this.tok.peek(LexContext.TestMode).token === Token.And) {
            this.tok.next(LexContext.TestMode);
            const right = this.parseTestNot();
            left = {
                type: "TestLogical",
                pos: left.pos,
                end: right.end,
                operator: "&&",
                left,
                right,
            };
        }
        return left;
    }
    // test_not := '!' test_not | test_primary
    parseTestNot() {
        let t = this.tok.peek(LexContext.TestMode);
        if (!isTestNegation(t))
            return this.parseTestPrimary();
        const firstPos = this.tok.next(LexContext.TestMode).pos;
        t = this.tok.peek(LexContext.TestMode);
        if (!isTestNegation(t)) {
            const operand = this.parseTestPrimary();
            return { type: "TestNot", pos: firstPos, end: operand.end, operand };
        }
        const positions = [firstPos];
        while (isTestNegation(t)) {
            positions.push(this.tok.next(LexContext.TestMode).pos);
            t = this.tok.peek(LexContext.TestMode);
        }
        let expression = this.parseTestPrimary();
        for (let i = positions.length - 1; i >= 0; i--) {
            expression = {
                type: "TestNot",
                pos: positions[i],
                end: expression.end,
                operand: expression,
            };
        }
        return expression;
    }
    // test_primary := '(' test_or ')' | unary_op word | word binary_op word | word
    parseTestPrimary() {
        // Grouped: ( expr )
        if (this.tok.peek(LexContext.TestMode).token === Token.LParen) {
            const openPos = this.tok.next(LexContext.TestMode).pos;
            if (this.syntaxDepth === MAX_SYNTAX_NESTING) {
                this.error("maximum test group nesting depth exceeded", openPos);
                const closeEnd = this.tok.skipTestGroup();
                if (closeEnd < 0)
                    this.error("expected ')' to close test group", this.tok.getPos());
                const end = closeEnd >= 0 ? closeEnd : openPos;
                const operand = new WordImpl("", openPos, openPos, this.source, undefined, this.depth);
                const expression = {
                    type: "TestUnary",
                    pos: openPos,
                    end: openPos,
                    operator: "-n",
                    operand,
                };
                return { type: "TestGroup", pos: openPos, end, expression };
            }
            this.syntaxDepth++;
            const expr = this.parseTestOr();
            this.syntaxDepth--;
            const closeEnd = this.acceptEnd(Token.RParen, LexContext.TestMode);
            if (closeEnd < 0)
                this.error("expected ')' to close test group", this.tok.getPos());
            const end = closeEnd >= 0 ? closeEnd : openPos;
            return { type: "TestGroup", pos: openPos, end, expression: expr };
        }
        const first = this.tok.next(LexContext.TestMode);
        const val = first.value;
        const firstPos = first.pos;
        const firstEnd = first.end;
        // Unary test: -op word, recognized only as written.
        if (first.keywordEligible && UNARY_TEST_OPS[val] === 1) {
            const nt = this.tok.peek(LexContext.TestMode).token;
            if (nt === Token.Word) {
                const operand = this.readWord(LexContext.TestMode);
                return {
                    type: "TestUnary",
                    pos: firstPos,
                    end: operand.end,
                    operator: val,
                    operand,
                };
            }
        }
        // Check for binary op
        const nt = this.tok.peek(LexContext.TestMode);
        if (nt.token === Token.Word && nt.keywordEligible && BINARY_TEST_OPS[nt.value] === 1) {
            const op = this.tok.next(LexContext.TestMode).value;
            let right;
            if (op === "=~") {
                const token = this.tok.readTestRegexWord();
                right = new WordImpl(this.source.slice(token.pos, token.end), token.pos, token.end, this.source, computeEmbeddedWordParts, this.depth);
            }
            else {
                right = this.readWord(LexContext.TestMode);
            }
            const left = this.toWordFromPosEnd(first, firstPos, firstEnd);
            return {
                type: "TestBinary",
                pos: firstPos,
                end: right.end,
                operator: op,
                left,
                right,
            };
        }
        // Standalone word (implicit -n test)
        const w = this.toWordFromPosEnd(first, firstPos, firstEnd);
        return { type: "TestUnary", pos: firstPos, end: w.end, operator: "-n", operand: w };
    }
    // function_def with 'function' keyword
    functionDef() {
        const pos = this.tok.next(LexContext.CommandStart).pos;
        const name = this.readWord(LexContext.Normal);
        let body;
        if (this.tok.peek(LexContext.CommandStart).token === Token.LParen) {
            const openPos = this.tok.next(LexContext.CommandStart).pos;
            // `(` is the optional empty parameter list only when `)` follows immediately;
            // anything else opens a subshell body, as in `f() ( ... )`.
            if (this.tok.peek(LexContext.CommandStart).token === Token.RParen) {
                this.tok.next(LexContext.CommandStart);
                this.skipNewlines(LexContext.CommandStart);
                body = this.commandAsBody();
            }
            else {
                body = this.subshellBody(openPos);
            }
        }
        else {
            this.skipNewlines(LexContext.CommandStart);
            body = this.commandAsBody();
        }
        const redirects = this._redirects;
        this._redirects = EMPTY_REDIRECTS;
        const end = redirects.length > 0 ? redirects[redirects.length - 1].end : body.end;
        return { type: "Function", pos, end, name, body, redirects: ownEmpty(redirects) };
    }
    // simple_command or function_def (word '(' ')' body)
    simpleCommandOrFunction() {
        const prefix = [];
        let redirects = [];
        let cmdPos = this.tok.peek(LexContext.CommandStart).pos;
        let lastEnd = cmdPos;
        // Assignments and redirects interleave freely; after the first element CommandPrefix
        // keeps the following command name from being read as a reserved word.
        let ctx = LexContext.CommandStart;
        for (;;) {
            const t = this.tok.peek(ctx).token;
            if (t === Token.Assignment) {
                const assignment = this.tok.next(ctx);
                lastEnd = assignment.end;
                prefix.push(this.parseAssignment(assignment));
            }
            else if (t === Token.Redirect) {
                redirects = this.collectRedirect(redirects, ctx);
                lastEnd = redirects[redirects.length - 1].end;
            }
            else {
                break;
            }
            ctx = LexContext.CommandPrefix;
        }
        if (this.tok.peek(LexContext.Normal).token !== Token.Word) {
            return {
                type: "Command",
                pos: cmdPos,
                end: lastEnd,
                name: undefined,
                prefix,
                suffix: [],
                redirects,
            };
        }
        const name = this.readWord(LexContext.Normal);
        lastEnd = name.end;
        // Check for function definition: word '(' ')' body
        if (this.tok.peek(LexContext.Normal).token === Token.LParen) {
            this.tok.next(LexContext.Normal);
            if (this.tok.peek(LexContext.Normal).token === Token.RParen) {
                this.tok.next(LexContext.Normal);
                this.skipNewlines(LexContext.CommandStart);
                const body = this.commandAsBody();
                const bodyRedirects = this._redirects;
                this._redirects = EMPTY_REDIRECTS;
                const end = bodyRedirects.length > 0 ? bodyRedirects[bodyRedirects.length - 1].end : body.end;
                return {
                    type: "Function",
                    pos: name.pos,
                    end,
                    name,
                    body,
                    redirects: ownEmpty(bodyRedirects),
                };
            }
        }
        const suffix = [];
        // Collect suffix words and redirects
        for (;;) {
            const st = this.tok.peek(LexContext.Normal).token;
            if (st === Token.Word || st === Token.Assignment) {
                const w = this.readWord(LexContext.Normal);
                suffix.push(w);
                lastEnd = w.end;
            }
            else if (st === Token.Redirect) {
                redirects = this.collectRedirect(redirects, LexContext.Normal);
                lastEnd = redirects[redirects.length - 1].end;
            }
            else {
                break;
            }
        }
        return {
            type: "Command",
            pos: cmdPos,
            end: lastEnd,
            name,
            prefix,
            suffix,
            redirects,
        };
    }
    collectRedirect(redirects, ctx) {
        if (redirects === EMPTY_REDIRECTS)
            redirects = [];
        const t = this.tok.next(ctx);
        const tPos = t.pos;
        const tEnd = t.end;
        const r = {
            pos: tPos,
            end: tEnd,
            operator: REDIRECT_OPS[t.value] ?? ">",
            target: undefined,
            fileDescriptor: t.fileDescriptor,
            variableName: t.variableName,
            content: t.content,
            heredocQuoted: undefined,
            body: undefined,
        };
        if (t.targetEnd > t.targetPos) {
            const heredoc = t.value === "<<" || t.value === "<<-";
            const resolver = heredoc ? heredocDelimiterParts(t.content ?? "") : undefined;
            const text = this.source.slice(t.targetPos, t.targetEnd);
            r.target = new WordImpl(text, t.targetPos, t.targetEnd, this.source, resolver, this.depth);
        }
        else {
            this.error("expected redirect target", t.targetPos);
        }
        if (r.target && (t.value === "<<" || t.value === "<<-"))
            this.tok.registerHereDocTarget(r);
        redirects.push(r);
        return redirects;
    }
    commandAsBody() {
        const t = this.tok.peek(LexContext.CommandStart).token;
        if (t === Token.LBrace)
            return this.braceGroup();
        if (t === Token.LParen)
            return this.subshell();
        const cmd = this.command();
        const p = this.tok.getPos();
        return cmd ?? { type: "CompoundList", pos: p, end: p, commands: [] };
    }
    readWord(ctx) {
        return this.toWord(this.tok.next(ctx));
    }
    toWord(tok) {
        const text = tok.raw ? tok.value : this.source.slice(tok.pos, tok.end);
        return new WordImpl(text, tok.pos, tok.end, this.source, undefined, this.depth);
    }
    toWordFromPosEnd(tok, pos, end) {
        const text = tok.raw && tok.pos === pos && tok.end === end ? tok.value : this.source.slice(pos, end);
        return new WordImpl(text, pos, end, this.source, undefined, this.depth);
    }
    parseAssignment(tok) {
        const text = tok.raw ? tok.value : this.source.slice(tok.pos, tok.end);
        const tokPos = tok.pos;
        const tokEnd = tok.end;
        const result = {
            type: "Assignment",
            pos: tokPos,
            end: tokEnd,
            text,
            name: undefined,
            value: undefined,
            append: undefined,
            index: undefined,
            indexParts: undefined,
            array: undefined,
        };
        const eqIdx = tok.assignmentOperatorPos - tokPos;
        if (eqIdx <= 0)
            return result;
        let nameEnd = eqIdx;
        let append = false;
        let index;
        // Check for += (append)
        let appendPos = eqIdx;
        while (appendPos >= 2 && text.charCodeAt(appendPos - 2) === 0x5c && text.charCodeAt(appendPos - 1) === 0x0a)
            appendPos -= 2;
        if (text.charCodeAt(appendPos - 1) === 0x2b /* + */) {
            append = true;
            nameEnd = appendPos - 1;
        }
        // Check for [index] before = or +=
        const bracketIdx = text.indexOf("[");
        if (bracketIdx > 0 && bracketIdx < nameEnd) {
            const rbracketIdx = text.lastIndexOf("]", eqIdx);
            if (rbracketIdx > bracketIdx) {
                index = text.slice(bracketIdx + 1, rbracketIdx);
                nameEnd = bracketIdx;
            }
        }
        const rawName = text.slice(0, nameEnd);
        const name = rawName.includes("\\\n") ? rawName.split("\\\n").join("") : rawName;
        result.name = name;
        if (append)
            result.append = true;
        if (index !== undefined) {
            result.index = index;
            const indexPos = tokPos + bracketIdx + 1;
            const indexEnd = indexPos + index.length;
            if (hasEmbeddedWordStructure(this.source, indexPos, indexEnd)) {
                const indexWord = new WordImpl(index, indexPos, indexEnd, this.source, computeEmbeddedWordParts, this.depth);
                Object.defineProperty(result, "indexParts", {
                    configurable: true,
                    enumerable: true,
                    get: () => indexWord.parts,
                    set: (value) => {
                        indexWord.parts = value;
                    },
                });
            }
        }
        // Value portion starts after =
        const valStart = eqIdx + 1;
        const valueStart = tokPos + valStart;
        // Check for array assignment: value starts with (
        if (valStart < text.length &&
            text.charCodeAt(valStart) === 0x28 /* ( */ &&
            text.charCodeAt(text.length - 1) === 0x29 /* ) */) {
            const elements = this.parseArrayElements(valueStart + 1, tokEnd - 1);
            result.array = elements;
        }
        else {
            result.value = new WordImpl(text.slice(valStart), valueStart, tokEnd, this.source, undefined, this.depth);
        }
        return result;
    }
    parseArrayElements(start, end) {
        const subTok = new Lexer(this.source, start, end);
        const elements = [];
        while (subTok.peek(LexContext.Normal).token !== Token.EOF) {
            if (subTok.peek(LexContext.Normal).token === Token.Newline) {
                subTok.next(LexContext.Normal);
                continue;
            }
            const t = subTok.next(LexContext.Normal);
            if (t.token === Token.Word || t.token === Token.Assignment) {
                const text = t.raw ? t.value : this.source.slice(t.pos, t.end);
                elements.push(new WordImpl(text, t.pos, t.end, this.source, undefined, this.depth));
            }
        }
        return elements;
    }
    makeCompoundList(commands) {
        const p = this.tok.getPos();
        const pos = commands.length > 0 ? commands[0].pos : p;
        const end = commands.length > 0 ? commands[commands.length - 1].end : p;
        return { type: "CompoundList", pos, end, commands };
    }
}
