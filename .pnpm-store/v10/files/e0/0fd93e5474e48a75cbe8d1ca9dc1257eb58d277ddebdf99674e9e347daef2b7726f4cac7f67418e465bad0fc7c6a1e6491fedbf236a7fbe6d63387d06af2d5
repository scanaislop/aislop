export interface Word {
    text: string;
    value: string;
    pos: number;
    end: number;
    parts?: WordPart[];
}
export interface LiteralPart {
    type: "Literal";
    value: string;
    text: string;
}
export interface SingleQuotedPart {
    type: "SingleQuoted";
    value: string;
    text: string;
}
export interface DoubleQuotedPart {
    type: "DoubleQuoted";
    text: string;
    parts: DoubleQuotedChild[];
}
export interface AnsiCQuotedPart {
    type: "AnsiCQuoted";
    text: string;
    value: string;
}
export interface LocaleStringPart {
    type: "LocaleString";
    text: string;
    parts: DoubleQuotedChild[];
}
export interface SimpleExpansionPart {
    type: "SimpleExpansion";
    text: string;
}
export interface ParameterExpansionPart {
    type: "ParameterExpansion";
    text: string;
    parameter: string;
    index: string | undefined;
    indexParts?: WordPart[];
    indirect: boolean | undefined;
    length: boolean | undefined;
    operator: string | undefined;
    operand: Word | undefined;
    slice: {
        offset: Word;
        length: Word | undefined;
    } | undefined;
    replace: {
        pattern: Word;
        replacement: Word;
    } | undefined;
}
export interface CommandExpansionPart {
    type: "CommandExpansion";
    text: string;
    script: ParsedScript | undefined;
    inner: string | undefined;
    /** Internal: absolute offset of `inner` in the original source; cleared after resolution. */
    innerStart?: number;
}
export interface ArithmeticExpansionPart {
    type: "ArithmeticExpansion";
    text: string;
    expression: ArithmeticExpression | undefined;
}
export interface ProcessSubstitutionPart {
    type: "ProcessSubstitution";
    text: string;
    operator: "<" | ">";
    script: ParsedScript | undefined;
    inner: string | undefined;
    /** Internal: absolute offset of `inner` in the original source; cleared after resolution. */
    innerStart?: number;
}
export type ExtGlobOperator = "?" | "*" | "+" | "@" | "!";
export interface ExtendedGlobPart {
    type: "ExtendedGlob";
    text: string;
    operator: ExtGlobOperator;
    pattern: string;
    parts?: WordPart[];
}
export interface BraceExpansionPart {
    type: "BraceExpansion";
    text: string;
    parts?: WordPart[];
}
export type ArithmeticExpression = ArithmeticBinary | ArithmeticUnary | ArithmeticTernary | ArithmeticGroup | ArithmeticWord | ArithmeticCommandExpansion;
export interface ArithmeticBinary {
    type: "ArithmeticBinary";
    pos: number;
    end: number;
    operator: string;
    left: ArithmeticExpression;
    right: ArithmeticExpression;
}
export interface ArithmeticUnary {
    type: "ArithmeticUnary";
    pos: number;
    end: number;
    operator: string;
    operand: ArithmeticExpression;
    prefix: boolean;
}
export interface ArithmeticTernary {
    type: "ArithmeticTernary";
    pos: number;
    end: number;
    test: ArithmeticExpression;
    consequent: ArithmeticExpression;
    alternate: ArithmeticExpression;
}
export interface ArithmeticGroup {
    type: "ArithmeticGroup";
    pos: number;
    end: number;
    expression: ArithmeticExpression;
}
export interface ArithmeticWord {
    type: "ArithmeticWord";
    pos: number;
    end: number;
    value: string;
    parts?: WordPart[];
}
export interface ArithmeticCommandExpansion {
    type: "ArithmeticCommandExpansion";
    pos: number;
    end: number;
    text: string;
    inner: string | undefined;
    script: ParsedScript | undefined;
    innerStart?: number;
}
export type DoubleQuotedChild = LiteralPart | SimpleExpansionPart | ParameterExpansionPart | CommandExpansionPart | ArithmeticExpansionPart;
export type WordPart = LiteralPart | SingleQuotedPart | DoubleQuotedPart | AnsiCQuotedPart | LocaleStringPart | SimpleExpansionPart | ParameterExpansionPart | CommandExpansionPart | ArithmeticExpansionPart | ProcessSubstitutionPart | ExtendedGlobPart | BraceExpansionPart;
export interface AssignmentPrefix {
    type: "Assignment";
    pos: number;
    end: number;
    text: string;
    name: string | undefined;
    value: Word | undefined;
    append: boolean | undefined;
    index: string | undefined;
    indexParts?: WordPart[];
    array: Word[] | undefined;
}
export type RedirectOperator = ">" | ">>" | "<" | "<<" | "<<-" | "<<<" | "<>" | "<&" | ">&" | ">|" | "&>" | "&>>";
export interface Redirect {
    pos: number;
    end: number;
    operator: RedirectOperator;
    target: Word | undefined;
    fileDescriptor: number | undefined;
    variableName: string | undefined;
    content: string | undefined;
    heredocQuoted: boolean | undefined;
    body: Word | undefined;
}
export interface Command {
    type: "Command";
    pos: number;
    end: number;
    name: Word | undefined;
    prefix: AssignmentPrefix[];
    suffix: Word[];
    redirects: Redirect[];
}
export type PipeOperator = "|" | "|&";
export interface Pipeline {
    type: "Pipeline";
    pos: number;
    end: number;
    commands: Node[];
    negated: boolean | undefined;
    operators: PipeOperator[];
    time: boolean | undefined;
}
export type LogicalOperator = "&&" | "||";
export interface AndOr {
    type: "AndOr";
    pos: number;
    end: number;
    commands: Node[];
    operators: LogicalOperator[];
}
export interface If {
    type: "If";
    pos: number;
    end: number;
    clause: CompoundList;
    then: CompoundList;
    else: CompoundList | If | undefined;
}
export interface For {
    type: "For";
    pos: number;
    end: number;
    name: Word;
    wordlist: Word[];
    body: CompoundList;
}
export type WhileKind = "while" | "until";
export interface While {
    type: "While";
    pos: number;
    end: number;
    kind: WhileKind;
    clause: CompoundList;
    body: CompoundList;
}
export interface Function {
    type: "Function";
    pos: number;
    end: number;
    name: Word;
    body: Node;
    redirects: Redirect[];
}
export interface Subshell {
    type: "Subshell";
    pos: number;
    end: number;
    body: CompoundList;
}
export interface BraceGroup {
    type: "BraceGroup";
    pos: number;
    end: number;
    body: CompoundList;
}
export interface CompoundList {
    type: "CompoundList";
    pos: number;
    end: number;
    commands: Statement[];
}
export interface Case {
    type: "Case";
    pos: number;
    end: number;
    word: Word;
    items: CaseItem[];
}
export type CaseTerminator = ";;" | ";&" | ";;&";
export interface CaseItem {
    type: "CaseItem";
    pos: number;
    end: number;
    pattern: Word[];
    body: CompoundList;
    terminator: CaseTerminator | undefined;
}
export interface Select {
    type: "Select";
    pos: number;
    end: number;
    name: Word;
    wordlist: Word[];
    body: CompoundList;
}
export interface Coproc {
    type: "Coproc";
    pos: number;
    end: number;
    name: Word | undefined;
    body: Node;
    redirects: Redirect[];
}
export interface ArithmeticFor {
    type: "ArithmeticFor";
    pos: number;
    end: number;
    initialize: ArithmeticExpression | undefined;
    test: ArithmeticExpression | undefined;
    update: ArithmeticExpression | undefined;
    body: CompoundList;
}
export type TestExpression = TestUnaryExpression | TestBinaryExpression | TestLogicalExpression | TestNotExpression | TestGroupExpression;
export interface TestUnaryExpression {
    type: "TestUnary";
    pos: number;
    end: number;
    operator: string;
    operand: Word;
}
export interface TestBinaryExpression {
    type: "TestBinary";
    pos: number;
    end: number;
    operator: string;
    left: Word;
    right: Word;
}
export interface TestLogicalExpression {
    type: "TestLogical";
    pos: number;
    end: number;
    operator: "&&" | "||";
    left: TestExpression;
    right: TestExpression;
}
export interface TestNotExpression {
    type: "TestNot";
    pos: number;
    end: number;
    operand: TestExpression;
}
export interface TestGroupExpression {
    type: "TestGroup";
    pos: number;
    end: number;
    expression: TestExpression;
}
export interface TestCommand {
    type: "TestCommand";
    pos: number;
    end: number;
    expression: TestExpression;
}
export interface ArithmeticCommand {
    type: "ArithmeticCommand";
    pos: number;
    end: number;
    expression: ArithmeticExpression | undefined;
    body: string;
}
export interface Statement {
    type: "Statement";
    pos: number;
    end: number;
    command: Node;
    background: boolean | undefined;
    redirects: Redirect[];
}
export type Node = Command | Pipeline | AndOr | If | For | ArithmeticFor | Select | While | Function | Subshell | BraceGroup | CompoundList | Case | Coproc | TestCommand | ArithmeticCommand | Statement;
export interface Script {
    type: "Script";
    pos: number;
    end: number;
    shebang: string | undefined;
    commands: Statement[];
}
export interface ParsedScript extends Script {
    /**
     * Present only on scripts parsed from a rebuilt string (decoded escaped-backtick
     * substitutions), whose positions index this decoded string instead of the
     * caller's source. Absent everywhere else: positions already index the string
     * the caller parsed. Non-enumerable when present.
     */
    readonly source?: string;
    errors?: ParseError[];
}
export interface ParseError {
    message: string;
    pos: number;
}
export type DeferredCommandExpansion = CommandExpansionPart | ProcessSubstitutionPart | ArithmeticCommandExpansion;
