import { requiresFunctionKeyword } from "./lexer.js";
import { WordImpl } from "./word.js";
export function print(script) {
    // Saved and restored, not cleared: a lazy getter can re-enter print(), and clearing would
    // drop the outer call's pending heredocs.
    const outerQueued = heredocQueue.length;
    try {
        let out = "";
        if (script.shebang)
            out += script.shebang + "\n\n";
        out += stmts(script.commands, 0);
        return out;
    }
    finally {
        heredocQueue.length = outerQueued;
    }
}
function isFunc(s) {
    return s.command.type === "Function";
}
function stmts(list, indent) {
    let out = "";
    for (let i = 0; i < list.length; i++) {
        if (i > 0)
            out += isFunc(list[i - 1]) || isFunc(list[i]) ? "\n\n" : "\n";
        out += stmt(list[i], indent);
    }
    return out;
}
function stmt(s, indent) {
    const pad = "  ".repeat(indent);
    const queued = heredocQueue.length;
    let out = pad + printNode(s.command, indent);
    for (const r of s.redirects)
        out += " " + redir(r);
    if (s.background)
        out += " &";
    return heredocQueue.length === queued ? out : flushHeredocs(out, queued);
}
// Bash reads a heredoc body from the line after its `<<`. `redir` marks where it printed and
// this drains each mark at the end of its own line, so reflowing cannot misplace a body.
const HEREDOC_MARK = "\u0000";
const heredocQueue = [];
function flushHeredocs(text, queued) {
    if (heredocQueue.length === queued)
        return text;
    const pending = heredocQueue.splice(queued);
    if (pending.length === 1 && text.endsWith(HEREDOC_MARK)) {
        return text.slice(0, -1) + "\n" + heredocBody(pending[0]);
    }
    let out = "";
    let copied = 0;
    let next = 0;
    let mark = text.indexOf(HEREDOC_MARK);
    while (mark !== -1) {
        let lineEnd = text.indexOf("\n", mark);
        if (lineEnd === -1)
            lineEnd = text.length;
        let marks = 0;
        while (mark !== -1 && mark < lineEnd) {
            out += text.slice(copied, mark);
            copied = mark + 1;
            marks++;
            mark = text.indexOf(HEREDOC_MARK, copied);
        }
        out += text.slice(copied, lineEnd);
        copied = lineEnd;
        for (; marks > 0 && next < pending.length; marks--, next++) {
            out += "\n" + heredocBody(pending[next]);
        }
    }
    return out + text.slice(copied);
}
function delimName(r) {
    return r.target?.value ?? "";
}
function heredocBody(r) {
    const content = r.content ?? "";
    const delimiter = delimName(r);
    return content + (content.length > 0 && !content.endsWith("\n") ? "\n" : "") + delimiter + (delimiter ? "" : "\n");
}
function printNode(n, indent) {
    switch (n.type) {
        case "Command":
            return cmd(n);
        case "Pipeline":
            return pipe(n, indent);
        case "AndOr":
            return andOr(n, indent);
        case "If":
            return ifNode(n, indent, false);
        case "For":
            return forNode(n, indent);
        case "While":
            return whileNode(n, indent);
        case "Case":
            return caseNode(n, indent);
        case "Function":
            return funcNode(n, indent);
        case "Subshell":
            return subshell(n, indent);
        case "BraceGroup":
            return braceGroup(n, indent);
        case "CompoundList":
            return stmts(n.commands, indent);
        case "TestCommand":
            return testCmd(n);
        case "ArithmeticCommand":
            return arithCmd(n);
        case "Select":
            return selectNode(n, indent);
        case "ArithmeticFor":
            return arithFor(n, indent);
        case "Coproc":
            return coprocNode(n, indent);
        case "Statement": {
            let out = printNode(n.command, indent);
            for (const r of n.redirects)
                out += " " + redir(r);
            if (n.background)
                out += " &";
            return out;
        }
    }
}
function wd(w) {
    if (!w.parts)
        return w.text;
    let out = "";
    for (const p of w.parts)
        out += p.text;
    return out;
}
function assign(a) {
    let out = a.name ?? "";
    if (a.index != null)
        out += "[" + a.index + "]";
    out += a.append ? "+=" : "=";
    if (a.array) {
        out += "(" + a.array.map((w) => wd(w)).join(" ") + ")";
    }
    else if (a.value) {
        out += wd(a.value);
    }
    return out;
}
function cmd(c) {
    const parts = [];
    for (const a of c.prefix)
        parts.push(assign(a));
    if (c.name)
        parts.push(wd(c.name));
    for (const s of c.suffix)
        parts.push(wd(s));
    for (const r of c.redirects)
        parts.push(redir(r));
    return parts.join(" ");
}
function pipe(p, indent) {
    let out = "";
    if (p.time)
        out = "time";
    if (p.negated)
        out += out ? " !" : "!";
    if (out && p.commands.length > 0)
        out += " ";
    for (let i = 0; i < p.commands.length; i++) {
        if (i > 0)
            out += " " + p.operators[i - 1] + " ";
        out += printNode(p.commands[i], indent);
    }
    return out;
}
function andOr(a, indent) {
    let out = "";
    for (let i = 0; i < a.commands.length; i++) {
        if (i > 0)
            out += " " + a.operators[i - 1] + " ";
        out += printNode(a.commands[i], indent);
    }
    return out;
}
function ifNode(n, indent, isElif) {
    const pad = "  ".repeat(indent);
    const kw = isElif ? "elif" : "if";
    let out = kw + " " + inlineList(n.clause) + "; then\n";
    out += stmts(n.then.commands, indent + 1);
    if (n.else) {
        out += "\n";
        if (n.else.type === "If") {
            out += pad + ifNode(n.else, indent, true);
        }
        else {
            out += pad + "else\n";
            out += stmts(n.else.commands, indent + 1) + "\n";
            out += pad + "fi";
        }
    }
    else {
        out += "\n" + pad + "fi";
    }
    return out;
}
function forNode(n, indent) {
    const pad = "  ".repeat(indent);
    let out = "for " + wd(n.name);
    if (n.wordlist.length > 0) {
        out += " in";
        for (const w of n.wordlist)
            out += " " + wd(w);
    }
    out += "; do\n";
    out += stmts(n.body.commands, indent + 1) + "\n";
    out += pad + "done";
    return out;
}
function whileNode(n, indent) {
    const pad = "  ".repeat(indent);
    let out = n.kind + " " + inlineList(n.clause) + "; do\n";
    out += stmts(n.body.commands, indent + 1) + "\n";
    out += pad + "done";
    return out;
}
function caseNode(n, indent) {
    const pad = "  ".repeat(indent);
    const iPad = "  ".repeat(indent + 1);
    const bPad = "  ".repeat(indent + 2);
    let out = "case " + wd(n.word) + " in\n";
    for (const item of n.items) {
        out += iPad + item.pattern.map((p) => wd(p)).join(" | ") + ")\n";
        if (item.body.commands.length > 0) {
            out += stmts(item.body.commands, indent + 2) + "\n";
        }
        out += bPad + (item.terminator ?? ";;") + "\n";
    }
    out += pad + "esac";
    return out;
}
function funcNode(n, indent) {
    const pad = "  ".repeat(indent);
    const name = wd(n.name);
    let out = (requiresFunctionKeyword(name) ? "function " + name + " {" : name + "() {") + "\n";
    if (n.body.type === "BraceGroup") {
        out += stmts(n.body.body.commands, indent + 1) + "\n";
    }
    else if (n.body.type === "CompoundList") {
        out += stmts(n.body.commands, indent + 1) + "\n";
    }
    else {
        out += "  ".repeat(indent + 1) + printNode(n.body, indent + 1) + "\n";
    }
    out += pad + "}";
    for (const r of n.redirects)
        out += " " + redir(r);
    return out;
}
function subshell(n, indent) {
    const pad = "  ".repeat(indent);
    if (n.body.commands.length <= 1) {
        const body = inlineList(n.body);
        return "(" + (body.startsWith("(") ? " " : "") + body + ")";
    }
    let out = "(\n";
    out += stmts(n.body.commands, indent + 1) + "\n";
    out += pad + ")";
    return out;
}
function braceGroup(n, indent) {
    const pad = "  ".repeat(indent);
    let out = "{\n";
    out += stmts(n.body.commands, indent + 1) + "\n";
    out += pad + "}";
    return out;
}
function testCmd(n) {
    return "[[ " + testExpr(n.expression) + " ]]";
}
function testExpr(e) {
    switch (e.type) {
        case "TestUnary":
            return e.operator + " " + wd(e.operand);
        case "TestBinary":
            return wd(e.left) + " " + e.operator + " " + wd(e.right);
        case "TestLogical":
            return testExpr(e.left) + " " + e.operator + " " + testExpr(e.right);
        case "TestNot":
            return "! " + testExpr(e.operand);
        case "TestGroup":
            return "( " + testExpr(e.expression) + " )";
    }
}
function arithCmd(n) {
    if (n.expression)
        return "(( " + arithExpr(n.expression) + " ))";
    return "((" + n.body + "))";
}
function arithFor(n, indent) {
    const pad = "  ".repeat(indent);
    const init = n.initialize ? arithExpr(n.initialize) : "";
    const test = n.test ? arithExpr(n.test) : "";
    const update = n.update ? arithExpr(n.update) : "";
    let out = "for (( " + init + "; " + test + "; " + update + " )); do\n";
    out += stmts(n.body.commands, indent + 1) + "\n";
    out += pad + "done";
    return out;
}
function coprocNode(n, indent) {
    let out = "coproc";
    if (n.name)
        out += " " + wd(n.name);
    out += " " + printNode(n.body, indent);
    for (const r of n.redirects)
        out += " " + redir(r);
    return out;
}
function arithExpr(e) {
    switch (e.type) {
        case "ArithmeticWord":
            return e.value;
        case "ArithmeticGroup":
            return "(" + arithExpr(e.expression) + ")";
        case "ArithmeticUnary":
            return e.prefix ? e.operator + arithExpr(e.operand) : arithExpr(e.operand) + e.operator;
        case "ArithmeticTernary":
            return arithExpr(e.test) + " ? " + arithExpr(e.consequent) + " : " + arithExpr(e.alternate);
        case "ArithmeticBinary": {
            const prec = arithPrec(e.operator);
            const ra = arithRightAssoc(e.operator);
            let left = arithExpr(e.left);
            let right = arithExpr(e.right);
            if (arithNeedsParens(e.left, prec, ra ? false : true))
                left = "(" + left + ")";
            if (arithNeedsParens(e.right, prec, ra ? true : false))
                right = "(" + right + ")";
            return left + " " + e.operator + " " + right;
        }
        case "ArithmeticCommandExpansion":
            return e.text; // preserve original text for roundtrip
    }
}
function arithPrec(op) {
    switch (op) {
        case ",":
            return 1;
        case "=":
        case "+=":
        case "-=":
        case "*=":
        case "/=":
        case "%=":
        case "<<=":
        case ">>=":
        case "&=":
        case "|=":
        case "^=":
            return 2;
        case "||":
            return 4;
        case "&&":
            return 5;
        case "|":
            return 6;
        case "^":
            return 7;
        case "&":
            return 8;
        case "==":
        case "!=":
            return 9;
        case "<":
        case "<=":
        case ">":
        case ">=":
            return 10;
        case "<<":
        case ">>":
            return 11;
        case "+":
        case "-":
            return 12;
        case "*":
        case "/":
        case "%":
            return 13;
        case "**":
            return 14;
        default:
            return 0;
    }
}
function arithRightAssoc(op) {
    switch (op) {
        case "=":
        case "+=":
        case "-=":
        case "*=":
        case "/=":
        case "%=":
        case "<<=":
        case ">>=":
        case "&=":
        case "|=":
        case "^=":
        case "**":
            return true;
        default:
            return false;
    }
}
function arithNeedsParens(child, parentPrec, isSafe) {
    if (child.type === "ArithmeticBinary") {
        const cp = arithPrec(child.operator);
        return cp < parentPrec || (cp === parentPrec && !isSafe);
    }
    if (child.type === "ArithmeticTernary")
        return 3 < parentPrec;
    return false;
}
function selectNode(n, indent) {
    const pad = "  ".repeat(indent);
    let out = "select " + wd(n.name);
    if (n.wordlist.length > 0) {
        out += " in";
        for (const w of n.wordlist)
            out += " " + wd(w);
    }
    out += "; do\n";
    out += stmts(n.body.commands, indent + 1) + "\n";
    out += pad + "done";
    return out;
}
// Partless targets with tokenization-breaking characters must be quoted from
// their value. Glob and expansion characters stay verbatim — quoting them would
// change meaning.
const UNSAFE_TARGET = /[\s"'\\|&;<>()]/;
function singleQuote(value) {
    return "'" + value.replaceAll("'", "'\\''") + "'";
}
function redirectTarget(r) {
    const w = r.target;
    if ((r.operator === "<<" || r.operator === "<<-") && r.heredocQuoted)
        return singleQuote(w.value);
    if (w.parts)
        return wd(w);
    const sourceText = w instanceof WordImpl ? w.sourceText() : undefined;
    if (sourceText !== undefined && sourceText !== w.text)
        return singleQuote(w.value);
    if (!UNSAFE_TARGET.test(w.text))
        return w.text;
    return singleQuote(w.value);
}
function redir(r) {
    let out = "";
    if (r.fileDescriptor != null)
        out += r.fileDescriptor;
    if (r.variableName)
        out += "{" + r.variableName + "}";
    out += r.operator;
    if (r.target) {
        if (r.operator !== "<&" && r.operator !== ">&")
            out += " ";
        out += redirectTarget(r);
    }
    if (r.content != null && (r.operator === "<<" || r.operator === "<<-")) {
        heredocQueue.push(r);
        out += HEREDOC_MARK;
    }
    return out;
}
function inlineList(cl) {
    let out = "";
    for (let i = 0; i < cl.commands.length; i++) {
        if (i > 0)
            out += "; ";
        out += inlineStmt(cl.commands[i]);
    }
    return out;
}
function inlineStmt(s) {
    let out = printNode(s.command, 0);
    for (const r of s.redirects)
        out += " " + redir(r);
    if (s.background)
        out += " &";
    return out;
}
