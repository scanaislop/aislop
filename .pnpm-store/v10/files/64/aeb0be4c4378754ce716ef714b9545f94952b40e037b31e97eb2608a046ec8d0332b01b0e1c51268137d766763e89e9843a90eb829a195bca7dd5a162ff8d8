export type InputEvent = string | {
    readonly paste: string;
};
export type InputParser = {
    push: (chunk: string) => InputEvent[];
    hasPendingEscape: () => boolean;
    flushPendingEscape: () => string | undefined;
    reset: () => void;
};
export declare const createInputParser: () => InputParser;
