export type CursorPosition = {
    x: number;
    y: number;
};
declare const showCursorEscape = "\u001B[?25h";
declare const hideCursorEscape = "\u001B[?25l";
export { showCursorEscape, hideCursorEscape };
/**
Compare two cursor positions. Returns true if they differ.
*/
export declare const cursorPositionChanged: (a: CursorPosition | undefined, b: CursorPosition | undefined) => boolean;
/**
Build escape sequence to move cursor from bottom of output to the target position and show it.
Assumes cursor is at (col 0, line visibleLineCount) — i.e. just after the last output line.
*/
export declare const buildCursorSuffix: (visibleLineCount: number, cursorPosition: CursorPosition | undefined) => string;
/**
Build escape sequence to move cursor from previousCursorPosition back to the bottom of output.
This must be done before eraseLines or any operation that assumes cursor is at the bottom.
*/
export declare const buildReturnToBottom: (previousLineCount: number, previousCursorPosition: CursorPosition | undefined) => string;
export type CursorOnlyInput = {
    cursorWasShown: boolean;
    previousLineCount: number;
    previousCursorPosition: CursorPosition | undefined;
    visibleLineCount: number;
    cursorPosition: CursorPosition | undefined;
};
/**
Build the escape sequence for cursor-only updates (output unchanged, cursor moved).
Hides cursor if it was previously shown, returns to bottom, then repositions.
*/
export declare const buildCursorOnlySequence: (input: CursorOnlyInput) => string;
/**
Build the prefix that hides cursor and returns to bottom before erasing or rewriting.
Returns empty string if cursor was not shown.
*/
export declare const buildReturnToBottomPrefix: (cursorWasShown: boolean, previousLineCount: number, previousCursorPosition: CursorPosition | undefined) => string;
