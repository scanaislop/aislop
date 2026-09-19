import { type Writable } from 'node:stream';
import { type CursorPosition } from './cursor-helpers.js';
export type { CursorPosition } from './cursor-helpers.js';
export type LogUpdate = {
    clear: () => void;
    done: () => void;
    reset: () => void;
    sync: (str: string) => void;
    setCursorPosition: (position: CursorPosition | undefined) => void;
    isCursorDirty: () => boolean;
    willRender: (str: string) => boolean;
    (str: string): boolean;
};
declare const logUpdate: {
    create: (stream: Writable, { showCursor, incremental }?: {
        showCursor?: boolean | undefined;
        incremental?: boolean | undefined;
    }) => LogUpdate;
};
export default logUpdate;
