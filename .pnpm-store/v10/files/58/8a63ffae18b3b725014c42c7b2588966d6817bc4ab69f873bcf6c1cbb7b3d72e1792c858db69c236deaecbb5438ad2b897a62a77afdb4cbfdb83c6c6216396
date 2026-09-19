import { EventEmitter } from 'node:events';
import { render as inkRender } from 'ink';
class Stdout extends EventEmitter {
    get columns() {
        return 100;
    }
    frames = [];
    _lastFrame;
    write = (frame) => {
        this.frames.push(frame);
        this._lastFrame = frame;
    };
    lastFrame = () => this._lastFrame;
}
class Stderr extends EventEmitter {
    frames = [];
    _lastFrame;
    write = (frame) => {
        this.frames.push(frame);
        this._lastFrame = frame;
    };
    lastFrame = () => this._lastFrame;
}
class Stdin extends EventEmitter {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    isTTY = true;
    data = null; // eslint-disable-line @typescript-eslint/ban-types
    constructor(options = {}) {
        super();
        this.isTTY = options.isTTY ?? true;
    }
    write = (data) => {
        this.data = data;
        this.emit('readable');
        this.emit('data', data);
    };
    setEncoding() {
        // Do nothing
    }
    setRawMode() {
        // Do nothing
    }
    resume() {
        // Do nothing
    }
    pause() {
        // Do nothing
    }
    ref() {
        // Do nothing
    }
    unref() {
        // Do nothing
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    read = () => {
        const { data } = this;
        this.data = null;
        return data;
    };
}
const instances = [];
export const render = (tree) => {
    const stdout = new Stdout();
    const stderr = new Stderr();
    const stdin = new Stdin();
    const instance = inkRender(tree, {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        stdout: stdout,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        stderr: stderr,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        stdin: stdin,
        debug: true,
        exitOnCtrlC: false,
        patchConsole: false,
    });
    instances.push(instance);
    return {
        rerender: instance.rerender,
        unmount: instance.unmount,
        cleanup: instance.cleanup,
        stdout,
        stderr,
        stdin,
        frames: stdout.frames,
        lastFrame: stdout.lastFrame,
    };
};
export const cleanup = () => {
    for (const instance of instances) {
        instance.unmount();
        instance.cleanup();
    }
};
//# sourceMappingURL=index.js.map