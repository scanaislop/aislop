import type { ArithmeticCommandExpansion, ArithmeticExpression, ArithmeticWord } from "./types.ts";
export interface ArithmeticParseCollector {
    commandExpansions: ArithmeticCommandExpansion[];
    embeddedWords: ArithmeticWord[];
    findClosingBracket?: (start: number, end: number) => number;
    findClosingBrace: (start: number, end: number) => number;
    findClosingParenthesis: (start: number, end: number) => number;
    findArithmeticExpansionEnd: (start: number, end: number) => number;
    findArithmeticWordEnd?: (start: number, end: number) => number;
}
export declare function parseArithmeticExpression(src: string, offset?: number, collector?: ArithmeticParseCollector): ArithmeticExpression | null;
