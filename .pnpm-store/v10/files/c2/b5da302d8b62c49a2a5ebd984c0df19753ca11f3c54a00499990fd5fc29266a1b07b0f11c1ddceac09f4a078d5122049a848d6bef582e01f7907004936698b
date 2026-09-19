import type { Word, WordPart } from "./types.ts";
export type PartsResolver = (source: string, word: Word, depth: number) => WordPart[] | undefined;
export declare class WordImpl implements Word {
    #private;
    static _resolveWord: PartsResolver;
    static _resolveHeredocBody: PartsResolver;
    text: string;
    pos: number;
    end: number;
    constructor(text: string, pos: number, end: number, source?: string, resolver?: PartsResolver, depth?: number);
    get value(): string;
    get parts(): WordPart[] | undefined;
    set parts(v: WordPart[] | undefined);
    sourceText(): string | undefined;
    toJSON(): {
        text: string;
        pos: number;
        end: number;
        parts: WordPart[] | undefined;
        value: string;
    };
}
