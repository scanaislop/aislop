import process from 'node:process';
import React from 'react';
import { throttle } from 'es-toolkit/compat';
import ansiEscapes from 'ansi-escapes';
import isInCi from 'is-in-ci';
import autoBind from 'auto-bind';
import signalExit from 'signal-exit';
import patchConsole from 'patch-console';
import { LegacyRoot, ConcurrentRoot } from 'react-reconciler/constants.js';
import Yoga from 'yoga-layout';
import wrapAnsi from 'wrap-ansi';
import { getWindowSize } from './utils.js';
import reconciler from './reconciler.js';
import render from './renderer.js';
import * as dom from './dom.js';
import { hideCursorEscape, showCursorEscape } from './cursor-helpers.js';
import logUpdate from './log-update.js';
import { bsu, esu, shouldSynchronize } from './write-synchronized.js';
import instances from './instances.js';
import App from './components/App.js';
import { accessibilityContext as AccessibilityContext } from './components/AccessibilityContext.js';
import { resolveFlags, } from './kitty-keyboard.js';
const noop = () => { };
const textEncoder = new TextEncoder();
const yieldImmediate = async () => new Promise(resolve => {
    setImmediate(resolve);
});
const kittyQueryEscapeByte = 0x1b;
const kittyQueryOpenBracketByte = 0x5b;
const kittyQueryQuestionMarkByte = 0x3f;
const kittyQueryLetterByte = 0x75;
const zeroByte = 0x30;
const nineByte = 0x39;
const isDigitByte = (byte) => byte >= zeroByte && byte <= nineByte;
const matchKittyQueryResponse = (buffer, startIndex) => {
    if (buffer[startIndex] !== kittyQueryEscapeByte ||
        buffer[startIndex + 1] !== kittyQueryOpenBracketByte ||
        buffer[startIndex + 2] !== kittyQueryQuestionMarkByte) {
        return undefined;
    }
    let index = startIndex + 3;
    const digitsStartIndex = index;
    while (index < buffer.length && isDigitByte(buffer[index])) {
        index++;
    }
    if (index === digitsStartIndex) {
        return undefined;
    }
    if (index === buffer.length) {
        return { state: 'partial' };
    }
    if (buffer[index] === kittyQueryLetterByte) {
        return { state: 'complete', endIndex: index };
    }
    return undefined;
};
const hasCompleteKittyQueryResponse = (buffer) => {
    for (let index = 0; index < buffer.length; index++) {
        const match = matchKittyQueryResponse(buffer, index);
        if (match?.state === 'complete') {
            return true;
        }
    }
    return false;
};
const stripKittyQueryResponsesAndTrailingPartial = (buffer) => {
    const keptBytes = [];
    let index = 0;
    while (index < buffer.length) {
        const match = matchKittyQueryResponse(buffer, index);
        if (match?.state === 'complete') {
            index = match.endIndex + 1;
            continue;
        }
        if (match?.state === 'partial') {
            break;
        }
        keptBytes.push(buffer[index]);
        index++;
    }
    return keptBytes;
};
// Windows consoles scroll the buffer when the bottom-right cell is written,
// unlike xterm-like terminals which defer the wrap. That extra scroll
// desynchronizes the incremental erase used for frames that exactly fill the
// viewport, leaving stale copies of previous frames behind (#969). Keep the
// pre-7.0 behavior of fully clearing between fullscreen frames there.
const isWindowsConsole = process.platform === 'win32';
const shouldClearTerminalForFrame = ({ isTty, viewportRows, previousOutputHeight, nextOutputHeight, isUnmounting, }) => {
    if (!isTty) {
        return false;
    }
    const hadPreviousFrame = previousOutputHeight > 0;
    const wasFullscreen = previousOutputHeight >= viewportRows;
    const wasOverflowing = previousOutputHeight > viewportRows;
    const isOverflowing = nextOutputHeight > viewportRows;
    const isFullscreen = nextOutputHeight >= viewportRows;
    const isLeavingFullscreen = wasFullscreen && nextOutputHeight < viewportRows;
    const shouldClearOnUnmount = isUnmounting && wasFullscreen;
    if (isWindowsConsole && (wasFullscreen || isFullscreen)) {
        return true;
    }
    return (
    // Overflowing frames still need full clear fallback.
    wasOverflowing ||
        (isOverflowing && hadPreviousFrame) ||
        // Clear when shrinking from fullscreen to non-fullscreen output.
        isLeavingFullscreen ||
        // Preserve legacy unmount behavior for fullscreen frames: final teardown
        // render should clear once to avoid leaving a scrolled viewport state.
        shouldClearOnUnmount);
};
const isErrorInput = (value) => {
    return (value instanceof Error ||
        Object.prototype.toString.call(value) === '[object Error]');
};
const getWritableStreamState = (stdout) => {
    const canWriteToStdout = !stdout.destroyed && !stdout.writableEnded && (stdout.writable ?? true);
    const hasWritableState = stdout._writableState !== undefined || stdout.writableLength !== undefined;
    return {
        canWriteToStdout,
        hasWritableState,
    };
};
const settleThrottle = (throttled, canWriteToStdout) => {
    if (!throttled ||
        typeof throttled.flush !== 'function') {
        return;
    }
    const throttledValue = throttled;
    if (canWriteToStdout) {
        throttledValue.flush();
    }
    else if (typeof throttledValue.cancel === 'function') {
        throttledValue.cancel();
    }
};
export default class Ink {
    /**
    Whether this instance is using concurrent rendering mode.
    */
    isConcurrent;
    options;
    log;
    cursorPosition;
    throttledLog;
    isScreenReaderEnabled;
    interactive;
    renderThrottleMs;
    alternateScreen;
    // Ignore last render after unmounting a tree to prevent empty output before exit
    isUnmounted;
    isUnmounting;
    lastOutput;
    lastOutputToRender;
    lastOutputHeight;
    lastTerminalWidth;
    container;
    rootNode;
    // This variable is used only in debug mode to store full static output
    // so that it's rerendered every time, not just new static parts, like in non-debug mode
    fullStaticOutput;
    exitPromise;
    exitResult;
    beforeExitHandler;
    restoreConsole;
    unsubscribeResize;
    throttledOnRender;
    hasPendingThrottledRender = false;
    kittyProtocolEnabled = false;
    kittyFlags;
    cancelKittyDetection;
    nextRenderCommit;
    // Set while suspendTerminal() has handed the terminal to a child process.
    isSuspended = false;
    // Input pause/resume hooks registered by the App component, which owns raw
    // mode and bracketed paste state.
    pauseInput;
    resumeInput;
    constructor(options) {
        autoBind(this);
        this.options = options;
        this.rootNode = dom.createNode('ink-root');
        this.rootNode.onComputeLayout = this.calculateLayout;
        this.isScreenReaderEnabled =
            options.isScreenReaderEnabled ??
                process.env['INK_SCREEN_READER'] === 'true';
        // CI detection takes precedence: even a TTY stdout in CI defaults to non-interactive.
        // Using Boolean(isTTY) (rather than an 'in' guard) correctly handles piped streams
        // where the property is absent (e.g. `node app.js | cat`).
        this.interactive = this.resolveInteractiveOption(options.interactive);
        this.alternateScreen = false;
        const unthrottled = options.debug || this.isScreenReaderEnabled;
        const maxFps = options.maxFps ?? 30;
        // Treat non-positive maxFps as an internal fallback case, not a supported
        // "disable throttling" mode. Keep animation scheduling on a normal cadence
        // so future changes don't accidentally reintroduce zero-delay loops.
        const renderThrottleMs = maxFps > 0 ? Math.max(1, Math.ceil(1000 / maxFps)) : 0;
        this.renderThrottleMs = unthrottled ? 0 : renderThrottleMs;
        if (unthrottled) {
            this.rootNode.onRender = this.onRender;
            this.throttledOnRender = undefined;
        }
        else {
            const throttled = throttle(this.onRender, renderThrottleMs, {
                leading: true,
                trailing: true,
            });
            this.rootNode.onRender = () => {
                this.hasPendingThrottledRender = true;
                throttled();
            };
            this.throttledOnRender = throttled;
        }
        this.rootNode.onImmediateRender = this.onRender;
        this.rootNode.onStaticChange = this.handleStaticChange;
        this.log = logUpdate.create(options.stdout, {
            incremental: options.incrementalRendering,
        });
        this.cursorPosition = undefined;
        this.throttledLog = unthrottled
            ? this.log
            : throttle((output) => {
                const shouldWrite = this.log.willRender(output);
                const sync = this.shouldSync();
                if (sync && shouldWrite) {
                    this.options.stdout.write(bsu);
                }
                this.log(output);
                if (sync && shouldWrite) {
                    this.options.stdout.write(esu);
                }
            }, undefined, {
                leading: true,
                trailing: true,
            });
        // Ignore last render after unmounting a tree to prevent empty output before exit
        this.isUnmounted = false;
        this.isUnmounting = false;
        // Store concurrent mode setting
        this.isConcurrent = options.concurrent ?? false;
        // Store last output to only rerender when needed
        this.lastOutput = '';
        this.lastOutputToRender = '';
        this.lastOutputHeight = 0;
        this.lastTerminalWidth = getWindowSize(this.options.stdout).columns;
        // This variable is used only in debug mode to store full static output
        // so that it's rerendered every time, not just new static parts, like in non-debug mode
        this.fullStaticOutput = '';
        // Use ConcurrentRoot for concurrent mode, LegacyRoot for legacy mode
        const rootTag = options.concurrent ? ConcurrentRoot : LegacyRoot;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.container = reconciler.createContainer(this.rootNode, rootTag, null, false, null, 'id', () => { }, () => { }, () => { }, () => { });
        // Unmount when process exits
        this.unsubscribeExit = signalExit(this.unmount, { alwaysLast: false });
        this.setAlternateScreen(Boolean(options.alternateScreen));
        if (process.env['DEV'] === 'true') {
            // @ts-expect-error outdated types
            reconciler.injectIntoDevTools();
        }
        if (options.patchConsole) {
            this.patchConsole();
        }
        if (this.interactive) {
            options.stdout.on('resize', this.resized);
            this.unsubscribeResize = () => {
                options.stdout.off('resize', this.resized);
            };
        }
        this.initKittyKeyboard();
        this.exitPromise = new Promise((resolve, reject) => {
            this.resolveExitPromise = resolve;
            this.rejectExitPromise = reject;
        });
        // Prevent global unhandled-rejection crashes when app code exits with an
        // error but consumers never call waitUntilExit().
        void this.exitPromise.catch(noop);
    }
    resized = () => {
        const currentWidth = getWindowSize(this.options.stdout).columns;
        if (currentWidth < this.lastTerminalWidth) {
            // We clear the screen when decreasing terminal width to prevent duplicate overlapping re-renders.
            this.log.clear();
            this.lastOutput = '';
            this.lastOutputToRender = '';
        }
        this.calculateLayout();
        dom.emitLayoutListeners(this.rootNode);
        this.onRender();
        this.lastTerminalWidth = currentWidth;
    };
    resolveExitPromise = () => { };
    rejectExitPromise = () => { };
    unsubscribeExit = () => { };
    handleAppExit = (errorOrResult) => {
        if (this.isUnmounted || this.isUnmounting) {
            return;
        }
        if (isErrorInput(errorOrResult)) {
            this.unmount(errorOrResult);
            return;
        }
        this.exitResult = errorOrResult;
        this.unmount();
    };
    setCursorPosition = (position) => {
        this.cursorPosition = position;
        this.log.setCursorPosition(position);
    };
    restoreLastOutput = () => {
        if (!this.interactive) {
            return;
        }
        // Clear() resets log-update's cursor state, so replay the latest cursor intent
        // before restoring output after external stdout/stderr writes.
        this.log.setCursorPosition(this.cursorPosition);
        this.log(this.lastOutputToRender || this.lastOutput + '\n');
    };
    calculateLayout = () => {
        const terminalWidth = getWindowSize(this.options.stdout).columns;
        this.rootNode.yogaNode.setWidth(terminalWidth);
        this.rootNode.yogaNode.calculateLayout(undefined, undefined, Yoga.DIRECTION_LTR);
    };
    // Resets `fullStaticOutput` when the <Static> identity changes so stale items from a previous instance are not replayed on future rewrites.
    handleStaticChange = () => {
        this.fullStaticOutput = '';
    };
    onRender = () => {
        this.hasPendingThrottledRender = false;
        if (this.isUnmounted) {
            return;
        }
        // While suspended, the terminal belongs to a child process. Discard queued
        // renders; resume() forces a full redraw once Ink reclaims the terminal.
        // Resolve any awaited render commit so callers don't hang during suspension.
        if (this.isSuspended) {
            if (this.nextRenderCommit) {
                this.nextRenderCommit.resolve();
                this.nextRenderCommit = undefined;
            }
            return;
        }
        if (this.nextRenderCommit) {
            this.nextRenderCommit.resolve();
            this.nextRenderCommit = undefined;
        }
        const startTime = performance.now();
        const { output, outputHeight, staticOutput } = render(this.rootNode, this.isScreenReaderEnabled);
        this.options.onRender?.({ renderTime: performance.now() - startTime });
        // If <Static> output isn't empty, it means new children have been added to it
        const hasStaticOutput = staticOutput && staticOutput !== '\n';
        if (this.options.debug) {
            if (hasStaticOutput) {
                this.fullStaticOutput += staticOutput;
            }
            this.lastOutput = output;
            this.lastOutputToRender = output;
            this.lastOutputHeight = outputHeight;
            this.options.stdout.write(this.fullStaticOutput + output);
            return;
        }
        if (!this.interactive) {
            if (hasStaticOutput) {
                this.options.stdout.write(staticOutput);
            }
            this.lastOutput = output;
            this.lastOutputToRender = output + '\n';
            this.lastOutputHeight = outputHeight;
            return;
        }
        if (this.isScreenReaderEnabled) {
            const sync = this.shouldSync();
            if (sync) {
                this.options.stdout.write(bsu);
            }
            if (hasStaticOutput) {
                // We need to erase the main output before writing new static output
                const erase = this.lastOutputHeight > 0
                    ? ansiEscapes.eraseLines(this.lastOutputHeight)
                    : '';
                this.options.stdout.write(erase + staticOutput);
                // After erasing, the last output is gone, so we should reset its height
                this.lastOutputHeight = 0;
            }
            if (output === this.lastOutput && !hasStaticOutput) {
                if (sync) {
                    this.options.stdout.write(esu);
                }
                return;
            }
            const terminalWidth = getWindowSize(this.options.stdout).columns;
            const wrappedOutput = wrapAnsi(output, terminalWidth, {
                trim: false,
                hard: true,
            });
            // If we haven't erased yet, do it now.
            if (hasStaticOutput) {
                this.options.stdout.write(wrappedOutput);
            }
            else {
                const erase = this.lastOutputHeight > 0
                    ? ansiEscapes.eraseLines(this.lastOutputHeight)
                    : '';
                this.options.stdout.write(erase + wrappedOutput);
            }
            this.lastOutput = output;
            this.lastOutputToRender = wrappedOutput;
            this.lastOutputHeight =
                wrappedOutput === '' ? 0 : wrappedOutput.split('\n').length;
            if (sync) {
                this.options.stdout.write(esu);
            }
            return;
        }
        if (hasStaticOutput) {
            this.fullStaticOutput += staticOutput;
        }
        this.renderInteractiveFrame(output, outputHeight, hasStaticOutput ? staticOutput : '');
    };
    render(node) {
        const tree = (React.createElement(AccessibilityContext.Provider, { value: { isScreenReaderEnabled: this.isScreenReaderEnabled } },
            React.createElement(App, { stdin: this.options.stdin, stdout: this.options.stdout, stderr: this.options.stderr, exitOnCtrlC: this.options.exitOnCtrlC, interactive: this.interactive, renderThrottleMs: this.renderThrottleMs, writeToStdout: this.writeToStdout, writeToStderr: this.writeToStderr, setCursorPosition: this.setCursorPosition, onExit: this.handleAppExit, onWaitUntilRenderFlush: this.waitUntilRenderFlush, onSuspendTerminal: this.suspendTerminal, onRegisterInputControl: this.registerInputControl }, node)));
        if (this.options.concurrent) {
            // Concurrent mode: use updateContainer (async scheduling)
            reconciler.updateContainer(tree, this.container, null, noop);
        }
        else {
            // Legacy mode: use updateContainerSync + flushSyncWork (sync)
            reconciler.updateContainerSync(tree, this.container, null, noop);
            reconciler.flushSyncWork();
        }
    }
    writeToStdout(data) {
        if (this.isUnmounted) {
            return;
        }
        // While suspended, the terminal belongs to a child process. Don't erase or
        // repaint Ink's frame around console output; the forced redraw on resume
        // restores the screen.
        if (this.isSuspended) {
            return;
        }
        if (this.options.debug) {
            this.options.stdout.write(data + this.fullStaticOutput + this.lastOutput);
            return;
        }
        if (!this.interactive) {
            this.options.stdout.write(data);
            return;
        }
        const sync = this.shouldSync();
        if (sync) {
            this.options.stdout.write(bsu);
        }
        this.log.clear();
        this.options.stdout.write(data);
        this.restoreLastOutput();
        if (sync) {
            this.options.stdout.write(esu);
        }
    }
    writeToStderr(data) {
        if (this.isUnmounted) {
            return;
        }
        // See writeToStdout: stay off the terminal while suspended.
        if (this.isSuspended) {
            return;
        }
        if (this.options.debug) {
            this.options.stderr.write(data);
            this.options.stdout.write(this.fullStaticOutput + this.lastOutput);
            return;
        }
        if (!this.interactive) {
            this.options.stderr.write(data);
            return;
        }
        const sync = this.shouldSync();
        if (sync) {
            this.options.stdout.write(bsu);
        }
        this.log.clear();
        this.options.stderr.write(data);
        this.restoreLastOutput();
        if (sync) {
            this.options.stdout.write(esu);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-restricted-types
    unmount(error) {
        if (this.isUnmounted || this.isUnmounting) {
            return;
        }
        this.isUnmounting = true;
        if (this.beforeExitHandler) {
            process.off('beforeExit', this.beforeExitHandler);
            this.beforeExitHandler = undefined;
        }
        const stdout = this.options.stdout;
        const { canWriteToStdout, hasWritableState } = getWritableStreamState(stdout);
        // Clear any pending throttled render timer on unmount. When stdout is writable,
        // flush so the final frame is emitted; otherwise cancel to avoid delayed callbacks.
        settleThrottle(this.throttledOnRender, canWriteToStdout);
        if (canWriteToStdout) {
            // If throttling is enabled and there is already a pending render, flushing above
            // is sufficient. Also avoid calling onRender() again when static output already
            // exists, as that can duplicate <Static> children output on exit (see issue #397).
            const shouldRenderFinalFrame = !this.throttledOnRender ||
                (!this.hasPendingThrottledRender && this.fullStaticOutput === '');
            if (shouldRenderFinalFrame) {
                this.calculateLayout();
                this.onRender();
            }
        }
        // Mark as unmounted after the final render but before stdout writes
        // that could re-enter exit() via synchronous write callbacks.
        this.isUnmounted = true;
        this.unsubscribeExit();
        // Flush any pending throttled log writes if possible, otherwise cancel to
        // prevent delayed callbacks from writing to a closed stream.
        settleThrottle(this.throttledLog, canWriteToStdout);
        if (typeof this.restoreConsole === 'function') {
            // Once unmount starts, Ink stops trying to manage teardown-time
            // console output. Restoring the native console before React cleanup keeps
            // unmount behavior simple and avoids special-case handling for custom
            // streams, fullscreen frames, and alternate-screen teardown.
            this.restoreConsole();
        }
        const finishUnmount = () => {
            if (typeof this.unsubscribeResize === 'function') {
                this.unsubscribeResize();
            }
            // Cancel any in-progress auto-detection before checking protocol state
            if (this.cancelKittyDetection) {
                this.cancelKittyDetection();
            }
            if (canWriteToStdout) {
                if (this.kittyProtocolEnabled) {
                    this.writeBestEffort(this.options.stdout, '\u001B[<u');
                }
                // Alternate-screen content is disposable by design. We intentionally
                // leave it active until React cleanup finishes, then restore the
                // primary buffer without replaying prior frames, hook writes, or
                // diagnostics onto it. Trying to preserve teardown output across the
                // buffer switch adds fragile lifecycle-specific behavior, so Ink keeps
                // alternate-screen teardown intentionally simple and best-effort.
                if (this.alternateScreen) {
                    this.writeBestEffort(this.options.stdout, ansiEscapes.exitAlternativeScreen);
                    this.writeBestEffort(this.options.stdout, showCursorEscape);
                    this.alternateScreen = false;
                }
                if (!this.interactive) {
                    // Non-interactive environments don't handle erasing ansi escapes well.
                    // In debug mode, each render already writes to stdout, so only a trailing
                    // newline is needed. In non-debug mode, write the last frame now (it was
                    // deferred during rendering).
                    this.options.stdout.write(this.options.debug ? '\n' : this.lastOutput + '\n');
                }
                else if (!this.options.debug) {
                    this.log.done();
                }
            }
            this.kittyProtocolEnabled = false;
            instances.delete(this.options.stdout);
            // Ensure all queued writes have been processed before resolving the
            // exit promise. For real writable streams, queue an empty write as a
            // barrier — its callback fires only after all prior writes complete.
            // For non-stream objects (e.g. test spies), resolve on next tick.
            //
            // When called from signal-exit during process shutdown (error is a
            // number or null rather than undefined/Error), resolve synchronously
            // because the event loop is draining and async callbacks won't fire.
            const { exitResult } = this;
            const resolveOrReject = () => {
                if (isErrorInput(error)) {
                    this.rejectExitPromise(error);
                }
                else {
                    this.resolveExitPromise(exitResult);
                }
            };
            const isProcessExiting = error !== undefined && !isErrorInput(error);
            if (isProcessExiting) {
                resolveOrReject();
            }
            else if (canWriteToStdout && hasWritableState) {
                this.options.stdout.write('', resolveOrReject);
            }
            else {
                setImmediate(resolveOrReject);
            }
        };
        const concurrentReconciler = reconciler;
        if (this.options.concurrent) {
            reconciler.updateContainerSync(null, this.container, null, noop);
            reconciler.flushSyncWork();
            concurrentReconciler.flushPassiveEffects?.();
            finishUnmount();
        }
        else {
            // Legacy mode: use updateContainerSync + flushSyncWork (sync)
            reconciler.updateContainerSync(null, this.container, null, noop);
            reconciler.flushSyncWork();
            finishUnmount();
        }
    }
    async waitUntilExit() {
        if (!this.beforeExitHandler) {
            this.beforeExitHandler = () => {
                this.unmount();
            };
            process.once('beforeExit', this.beforeExitHandler);
        }
        return this.exitPromise;
    }
    async waitUntilRenderFlush() {
        if (this.isUnmounted || this.isUnmounting) {
            await this.awaitExit();
            return;
        }
        // Yield to the macrotask queue so that React's scheduler has a chance to
        // fire passive effects and process any work they enqueued.
        await yieldImmediate();
        if (this.isUnmounted || this.isUnmounting) {
            await this.awaitExit();
            return;
        }
        // In concurrent mode, React's scheduler may still be mid-render after
        // the yield. Wait for the next render commit instead of polling.
        if (this.isConcurrent && this.hasPendingConcurrentWork()) {
            await Promise.race([this.awaitNextRender(), this.awaitExit()]);
            if (this.isUnmounted || this.isUnmounting) {
                this.nextRenderCommit = undefined;
                await this.awaitExit();
                return;
            }
        }
        reconciler.flushSyncWork();
        const stdout = this.options.stdout;
        const { canWriteToStdout, hasWritableState } = getWritableStreamState(stdout);
        // Flush pending throttled render/log timers so their output is included in this wait.
        settleThrottle(this.throttledOnRender, canWriteToStdout);
        settleThrottle(this.throttledLog, canWriteToStdout);
        if (canWriteToStdout && hasWritableState) {
            await new Promise(resolve => {
                this.options.stdout.write('', () => {
                    resolve();
                });
            });
            return;
        }
        await yieldImmediate();
    }
    clear() {
        if (this.interactive && !this.options.debug) {
            this.log.clear();
            // Sync lastOutput so that unmount's final onRender
            // sees it as unchanged and log-update skips it
            this.log.sync(this.lastOutputToRender || this.lastOutput + '\n');
        }
    }
    patchConsole() {
        if (this.options.debug) {
            return;
        }
        this.restoreConsole = patchConsole((stream, data) => {
            if (stream === 'stdout') {
                this.writeToStdout(data);
            }
            if (stream === 'stderr') {
                const isReactMessage = data.startsWith('The above error occurred');
                if (!isReactMessage) {
                    this.writeToStderr(data);
                }
            }
        });
    }
    registerInputControl(pauseInput, resumeInput) {
        this.pauseInput = pauseInput;
        this.resumeInput = resumeInput;
    }
    async suspendTerminal(callback) {
        this.beginSuspend();
        if (callback) {
            try {
                await callback();
            }
            finally {
                await this.endSuspend();
            }
            return undefined;
        }
        const resume = async () => {
            await this.endSuspend();
        };
        return { resume, [Symbol.asyncDispose]: resume };
    }
    setAlternateScreen(enabled) {
        this.alternateScreen = this.resolveAlternateScreenOption(enabled, this.interactive);
        if (this.alternateScreen) {
            this.writeBestEffort(this.options.stdout, ansiEscapes.enterAlternativeScreen);
            this.writeBestEffort(this.options.stdout, hideCursorEscape);
        }
    }
    resolveInteractiveOption(interactive) {
        return interactive ?? (!isInCi && Boolean(this.options.stdout.isTTY));
    }
    resolveAlternateScreenOption(alternateScreen, interactive) {
        return (Boolean(alternateScreen) &&
            interactive &&
            Boolean(this.options.stdout.isTTY));
    }
    shouldSync() {
        return shouldSynchronize(this.options.stdout, this.interactive);
    }
    // Best-effort write: streams may already be destroyed during shutdown.
    writeBestEffort(stream, data) {
        try {
            stream.write(data);
        }
        catch { }
    }
    // Waits for the exit promise to settle, suppressing any rejection.
    // Errors are surfaced via waitUntilExit() instead.
    async awaitExit() {
        try {
            await this.exitPromise;
        }
        catch { }
    }
    hasPendingConcurrentWork() {
        const concurrentContainer = this.container;
        return ((concurrentContainer.pendingLanes ?? 0) !== 0 &&
            concurrentContainer.callbackNode !== undefined &&
            concurrentContainer.callbackNode !== null);
    }
    async awaitNextRender() {
        if (!this.nextRenderCommit) {
            let resolveRender;
            const promise = new Promise(resolve => {
                resolveRender = resolve;
            });
            this.nextRenderCommit = { promise, resolve: resolveRender };
        }
        return this.nextRenderCommit.promise;
    }
    renderInteractiveFrame(output, outputHeight, staticOutput) {
        const hasStaticOutput = staticOutput !== '';
        const isTty = this.options.stdout.isTTY;
        // Detect fullscreen: output fills or exceeds terminal height.
        // Only apply when writing to a real TTY — piped output always gets trailing newlines.
        const viewportRows = isTty ? getWindowSize(this.options.stdout).rows : 24;
        const isFullscreen = isTty && outputHeight >= viewportRows;
        const outputToRender = isFullscreen ? output : output + '\n';
        const shouldClearTerminal = shouldClearTerminalForFrame({
            isTty,
            viewportRows,
            previousOutputHeight: this.lastOutputHeight,
            nextOutputHeight: outputHeight,
            isUnmounting: this.isUnmounting,
        });
        if (shouldClearTerminal) {
            const sync = this.shouldSync();
            if (sync) {
                this.options.stdout.write(bsu);
            }
            this.options.stdout.write(ansiEscapes.clearTerminal + this.fullStaticOutput + outputToRender);
            this.lastOutput = output;
            this.lastOutputToRender = outputToRender;
            this.lastOutputHeight = outputHeight;
            this.log.sync(outputToRender);
            if (sync) {
                this.options.stdout.write(esu);
            }
            return;
        }
        // To ensure static output is cleanly rendered before main output, clear main output first
        if (hasStaticOutput) {
            const sync = this.shouldSync();
            if (sync) {
                this.options.stdout.write(bsu);
            }
            this.log.clear();
            this.options.stdout.write(staticOutput);
            this.log(outputToRender);
            if (sync) {
                this.options.stdout.write(esu);
            }
        }
        else if (output !== this.lastOutput || this.log.isCursorDirty()) {
            // ThrottledLog manages its own bsu/esu at actual write time
            this.throttledLog(outputToRender);
        }
        this.lastOutput = output;
        this.lastOutputToRender = outputToRender;
        this.lastOutputHeight = outputHeight;
    }
    initKittyKeyboard() {
        // Protocol is opt-in: if kittyKeyboard is not specified, do nothing
        if (!this.options.kittyKeyboard) {
            return;
        }
        const opts = this.options.kittyKeyboard;
        const mode = opts.mode ?? 'auto';
        if (mode === 'disabled') {
            return;
        }
        const flags = opts.flags ?? ['disambiguateEscapeCodes'];
        // 'enabled' force-enables the protocol as long as both streams are TTYs,
        // regardless of the interactive setting (e.g. even in CI).
        if (mode === 'enabled') {
            if (this.options.stdin.isTTY && this.options.stdout.isTTY) {
                this.enableKittyProtocol(flags);
            }
            return;
        }
        // Auto mode: require interactive + TTY
        if (!this.interactive ||
            !this.options.stdin.isTTY ||
            !this.options.stdout.isTTY) {
            return;
        }
        // Auto mode: query the terminal for kitty keyboard protocol support.
        // The CSI ? u query is safe to send to any terminal — unsupporting
        // terminals simply won't respond, and the 200ms timeout handles that.
        // This avoids maintaining a hardcoded whitelist of terminal names.
        this.confirmKittySupport(flags);
    }
    confirmKittySupport(flags) {
        const { stdin, stdout } = this.options;
        let responseBuffer = [];
        const cleanup = () => {
            this.cancelKittyDetection = undefined;
            clearTimeout(timer);
            stdin.removeListener('data', onData);
            // Re-emit any buffered data that wasn't the protocol response,
            // so it isn't lost from Ink's normal input pipeline.
            // Clear responseBuffer afterwards to make cleanup idempotent.
            const remaining = stripKittyQueryResponsesAndTrailingPartial(responseBuffer);
            responseBuffer = [];
            if (remaining.length > 0) {
                stdin.unshift(Uint8Array.from(remaining));
            }
        };
        const onData = (data) => {
            const chunk = typeof data === 'string' ? textEncoder.encode(data) : data;
            for (const byte of chunk) {
                responseBuffer.push(byte);
            }
            if (hasCompleteKittyQueryResponse(responseBuffer)) {
                cleanup();
                if (!this.isUnmounted) {
                    this.enableKittyProtocol(flags);
                }
            }
        };
        // Attach listener before writing the query so that synchronous
        // or immediate responses are not missed.
        stdin.on('data', onData);
        const timer = setTimeout(cleanup, 200);
        this.cancelKittyDetection = cleanup;
        stdout.write('\u001B[?u');
    }
    enableKittyProtocol(flags) {
        this.options.stdout.write(`\u001B[>${resolveFlags(flags)}u`);
        this.kittyProtocolEnabled = true;
        // Remember the flags so suspendTerminal() can re-enable the same protocol
        // after a child process has had the terminal.
        this.kittyFlags = flags;
    }
    beginSuspend() {
        if (this.isSuspended) {
            throw new Error('The terminal is already suspended. Resume the current suspension before suspending again.');
        }
        this.isSuspended = true;
        if (!this.interactive || this.isUnmounted || this.isUnmounting) {
            return;
        }
        try {
            const stdout = this.options.stdout;
            const { canWriteToStdout } = getWritableStreamState(stdout);
            // Flush any pending render/log so the child starts from a settled screen.
            settleThrottle(this.throttledOnRender, canWriteToStdout);
            settleThrottle(this.throttledLog, canWriteToStdout);
            if (canWriteToStdout) {
                // Erase Ink's current frame, then show the cursor and re-arm the hide.
                // The forced redraw on resume hides the cursor again.
                this.log.clear();
                this.log.done();
                if (this.kittyProtocolEnabled) {
                    this.writeBestEffort(this.options.stdout, '\u001B[<u');
                }
                if (this.alternateScreen) {
                    this.writeBestEffort(this.options.stdout, ansiEscapes.exitAlternativeScreen);
                }
            }
            // Hand input back to the terminal (raw mode off, bracketed paste off).
            this.pauseInput?.();
        }
        catch (error) {
            // If handing over the terminal fails partway, don't strand the app in a
            // suspended state with no way back. Best-effort reclaim input, clear the
            // flag, and rethrow so the caller sees the failure.
            this.isSuspended = false;
            try {
                this.resumeInput?.();
            }
            catch { }
            throw error;
        }
    }
    async endSuspend() {
        if (!this.isSuspended) {
            return;
        }
        this.isSuspended = false;
        // Reclaim input even mid-unmount: pauseInput already ran in beginSuspend, so
        // restoring it is symmetric regardless of any state change during suspension.
        this.resumeInput?.();
        if (!this.interactive || this.isUnmounted || this.isUnmounting) {
            return;
        }
        const stdout = this.options.stdout;
        const { canWriteToStdout } = getWritableStreamState(stdout);
        if (canWriteToStdout) {
            if (this.alternateScreen) {
                this.writeBestEffort(this.options.stdout, ansiEscapes.enterAlternativeScreen);
            }
            if (this.kittyProtocolEnabled && this.kittyFlags) {
                this.writeBestEffort(this.options.stdout, `\u001B[>${resolveFlags(this.kittyFlags)}u`);
            }
        }
        // Force a full redraw instead of diffing against the stale pre-suspension
        // frame, which the child process may have overwritten. A redraw failure here
        // is best-effort: it must not mask a callback error propagating through the
        // caller's finally block.
        this.lastOutput = '';
        this.lastOutputToRender = '';
        this.lastOutputHeight = 0;
        this.log.reset();
        try {
            this.calculateLayout();
            this.onRender();
            await this.waitUntilRenderFlush();
        }
        catch { }
    }
}
//# sourceMappingURL=ink.js.map