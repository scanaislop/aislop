/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from 'node:events';
import type { ReactElement } from 'react';
declare class Stdout extends EventEmitter {
    get columns(): number;
    readonly frames: string[];
    private _lastFrame?;
    write: (frame: string) => void;
    lastFrame: () => string | undefined;
}
declare class Stderr extends EventEmitter {
    readonly frames: string[];
    private _lastFrame?;
    write: (frame: string) => void;
    lastFrame: () => string | undefined;
}
declare class Stdin extends EventEmitter {
    isTTY: boolean;
    data: string | null;
    constructor(options?: {
        isTTY?: boolean;
    });
    write: (data: string) => void;
    setEncoding(): void;
    setRawMode(): void;
    resume(): void;
    pause(): void;
    ref(): void;
    unref(): void;
    read: () => string | null;
}
type Instance = {
    rerender: (tree: ReactElement) => void;
    unmount: () => void;
    cleanup: () => void;
    stdout: Stdout;
    stderr: Stderr;
    stdin: Stdin;
    frames: string[];
    lastFrame: () => string | undefined;
};
export declare const render: (tree: ReactElement) => Instance;
export declare const cleanup: () => void;
export {};
