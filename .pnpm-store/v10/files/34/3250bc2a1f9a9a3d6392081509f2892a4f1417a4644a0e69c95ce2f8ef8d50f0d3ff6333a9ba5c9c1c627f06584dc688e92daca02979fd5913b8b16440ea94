import { Key } from 'node:readline';
import { Readable, Writable } from 'node:stream';

declare const actions: readonly ["up", "down", "left", "right", "space", "enter", "cancel"];
type Action = (typeof actions)[number];
/** Global settings for Clack programs, stored in memory */
interface InternalClackSettings {
    actions: Set<Action>;
    aliases: Map<string, Action>;
    messages: {
        cancel: string;
        error: string;
    };
    withGuide: boolean;
    date: {
        monthNames: string[];
        messages: {
            invalidMonth: string;
            required: string;
            invalidDay: (days: number, month: string) => string;
            afterMin: (min: Date) => string;
            beforeMax: (max: Date) => string;
        };
    };
}
declare const settings: InternalClackSettings;
interface ClackSettings {
    /**
     * Set custom global aliases for the default actions.
     * This will not overwrite existing aliases, it will only add new ones!
     *
     * @param aliases - An object that maps aliases to actions
     * @default { k: 'up', j: 'down', h: 'left', l: 'right', '\x03': 'cancel', 'escape': 'cancel' }
     */
    aliases?: Record<string, Action>;
    /**
     * Custom messages for prompts
     */
    messages?: {
        /**
         * Custom message to display when a spinner is cancelled
         * @default "Canceled"
         */
        cancel?: string;
        /**
         * Custom message to display when a spinner encounters an error
         * @default "Something went wrong"
         */
        error?: string;
    };
    withGuide?: boolean;
    /**
     * Date prompt localization
     */
    date?: {
        /** Month names for validation messages (January, February, ...) */
        monthNames?: string[];
        messages?: {
            /** Shown when date is missing */
            required?: string;
            /** Shown when month > 12 */
            invalidMonth?: string;
            /** (days, monthName) => message for invalid day */
            invalidDay?: (days: number, month: string) => string;
            /** (min) => message when date is before minDate */
            afterMin?: (min: Date) => string;
            /** (max) => message when date is after maxDate */
            beforeMax?: (max: Date) => string;
        };
    };
}
declare function updateSettings(updates: ClackSettings): void;

/**
 * The state of the prompt
 */
type ClackState = 'initial' | 'active' | 'cancel' | 'submit' | 'error';
/**
 * Typed event emitter for clack
 */
interface ClackEvents<TValue> {
    initial: (value?: any) => void;
    active: (value?: any) => void;
    cancel: (value?: any) => void;
    submit: (value?: any) => void;
    error: (value?: any) => void;
    cursor: (key?: Action) => void;
    key: (key: string | undefined, info: Key) => void;
    value: (value?: TValue) => void;
    userInput: (value: string) => void;
    confirm: (value?: boolean) => void;
    finalize: () => void;
    beforePrompt: () => void;
}

/** The Standard Schema interface. */
interface StandardSchemaV1<Input = unknown, Output = Input> {
    /** The Standard Schema properties. */
    readonly '~standard': StandardSchemaV1.Props<Input, Output>;
}
declare namespace StandardSchemaV1 {
    /** The Standard Schema properties interface. */
    interface Props<Input = unknown, Output = Input> {
        /** The version number of the standard. */
        readonly version: 1;
        /** The vendor name of the schema library. */
        readonly vendor: string;
        /** Validates unknown input values. */
        readonly validate: (value: unknown, options?: StandardSchemaV1.Options | undefined) => Result<Output> | Promise<Result<Output>>;
        /** Inferred types associated with the schema. */
        readonly types?: Types<Input, Output> | undefined;
    }
    /** The result interface of the validate function. */
    type Result<Output> = SuccessResult<Output> | FailureResult;
    /** The result interface if validation succeeds. */
    interface SuccessResult<Output> {
        /** The typed output value. */
        readonly value: Output;
        /** A falsy value for `issues` indicates success. */
        readonly issues?: undefined;
    }
    interface Options {
        /** Explicit support for additional vendor-specific parameters, if needed. */
        readonly libraryOptions?: Record<string, unknown> | undefined;
    }
    /** The result interface if validation fails. */
    interface FailureResult {
        /** The issues of failed validation. */
        readonly issues: ReadonlyArray<Issue>;
    }
    /** The issue interface of the failure output. */
    interface Issue {
        /** The error message of the issue. */
        readonly message: string;
        /** The path of the issue, if any. */
        readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
    }
    /** The path segment interface of the issue. */
    interface PathSegment {
        /** The key representing a path segment. */
        readonly key: PropertyKey;
    }
    /** The Standard Schema types interface. */
    interface Types<Input = unknown, Output = Input> {
        /** The input type of the schema. */
        readonly input: Input;
        /** The output type of the schema. */
        readonly output: Output;
    }
    /** Infers the input type of a Standard Schema. */
    type InferInput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['input'];
    /** Infers the output type of a Standard Schema. */
    type InferOutput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['output'];
}

/**
 * A function or [Standard Schema](https://github.com/standard-schema/standard-schema)
 * that validates user input. If a custom function is given, you should return a
 * `string` or `Error` to show as a validation error, or `undefined` to accept the result.
 *
 * @example Using arktype
 * ```ts
 * import { text } from '@clack/prompts';
 * import { type } from 'arktype';
 *
 * const name = await text({
 *   message: 'Enter your name (letters only)',
 *   validate: type('string.alpha').describe('Name can only contain letters'),
 * });
 * ```
 *
 * @example Custom validator
 * ```ts
 * import { text } from '@clack/prompts';
 *
 * const age = await text({
 *   message: 'Enter your age:',
 *   validate(value) {
 *     if (!value) return 'Please enter a value';
 *     const num = parseInt(value);
 *     if (isNaN(num)) return 'Please enter a valid number';
 *     if (num < 0 || num > 120) return 'Age must be between 0 and 120';
 *     return undefined;
 *   },
 * });
 * ```
 */
type Validate<TValue> = ((value: TValue | undefined) => string | Error | undefined) | StandardSchemaV1<TValue | undefined, unknown>;
/**
 * Runs the `validate()` option and normalizes the result
 * @param validate - The validate option
 * @param value - The user input
 * @returns the validation result
 */
declare function runValidation<TValue>(validate: Validate<TValue>, value: TValue | undefined): string | Error | undefined;

interface PromptOptions<TValue, Self extends Prompt<TValue>> {
    render(this: Omit<Self, 'prompt'>): string | undefined;
    initialValue?: any;
    initialUserInput?: string;
    /**
     * A function or a [Standard Schema](https://github.com/standard-schema/standard-schema)
     * that validates user input. If a custom function is given, you should return a `string` or `Error`
     * to show as a validation error, or `undefined` to accept the result.
     */
    validate?: Validate<TValue> | undefined;
    input?: Readable;
    output?: Writable;
    signal?: AbortSignal;
}
declare class Prompt<TValue> {
    protected input: Readable;
    protected output: Writable;
    private _abortSignal?;
    private rl;
    private opts;
    private _render;
    private _track;
    private _prevFrame;
    private _subscribers;
    protected _cursor: number;
    state: ClackState;
    error: string;
    value: TValue | undefined;
    userInput: string;
    constructor(options: PromptOptions<TValue, Prompt<TValue>>, trackValue?: boolean);
    /**
     * Unsubscribe all listeners
     */
    protected unsubscribe(): void;
    /**
     * Set a subscriber with opts
     * @param event - The event name
     */
    private setSubscriber;
    /**
     * Subscribe to an event
     * @param event - The event name
     * @param cb - The callback
     */
    on<T extends keyof ClackEvents<TValue>>(event: T, cb: ClackEvents<TValue>[T]): void;
    /**
     * Subscribe to an event once
     * @param event - The event name
     * @param cb - The callback
     */
    once<T extends keyof ClackEvents<TValue>>(event: T, cb: ClackEvents<TValue>[T]): void;
    /**
     * Emit an event with data
     * @param event - The event name
     * @param data - The data to pass to the callback
     */
    emit<T extends keyof ClackEvents<TValue>>(event: T, ...data: Parameters<ClackEvents<TValue>[T]>): void;
    prompt(): Promise<symbol | TValue | undefined>;
    protected _isActionKey(char: string | undefined, _key: Key): boolean;
    protected _shouldSubmit(_char: string | undefined, _key: Key): boolean;
    protected _setValue(value: TValue | undefined): void;
    protected _setUserInput(value: string | undefined, write?: boolean): void;
    protected _clearUserInput(): void;
    private onKeypress;
    protected close(): void;
    private restoreCursor;
    private render;
}

interface OptionLike$1 {
    value: unknown;
    label?: string;
    disabled?: boolean;
}
type FilterFunction<T extends OptionLike$1> = (search: string, opt: T) => boolean;
interface AutocompleteOptions<T extends OptionLike$1> extends PromptOptions<T['value'] | T['value'][], AutocompletePrompt<T>> {
    options: T[] | ((this: AutocompletePrompt<T>) => T[]);
    filter?: FilterFunction<T>;
    multiple?: boolean;
    /**
     * When set (non-empty), pressing Tab with no input fills the field with this value
     * and runs the normal filter/selection logic so the user can confirm with Enter.
     * Tab only fills the input when the placeholder matches at least one option under
     * the prompt's filter (so the value remains selectable).
     */
    placeholder?: string;
}
declare class AutocompletePrompt<T extends OptionLike$1> extends Prompt<T['value'] | T['value'][]> {
    #private;
    filteredOptions: T[];
    multiple: boolean;
    isNavigating: boolean;
    selectedValues: Array<T['value']>;
    focusedValue: T['value'] | undefined;
    get cursor(): number;
    get userInputWithCursor(): string;
    get options(): T[];
    constructor(opts: AutocompleteOptions<T>);
    protected _isActionKey(char: string | undefined, key: Key): boolean;
    deselectAll(): void;
    toggleSelected(value: T['value']): void;
}

interface ConfirmOptions extends PromptOptions<boolean, ConfirmPrompt> {
    active: string;
    inactive: string;
    initialValue?: boolean;
}
declare class ConfirmPrompt extends Prompt<boolean> {
    get cursor(): 0 | 1;
    private get _value();
    constructor(opts: ConfirmOptions);
}

interface SegmentConfig {
    type: 'year' | 'month' | 'day';
    len: number;
}
interface DateParts {
    year: string;
    month: string;
    day: string;
}
type DateFormat = 'YMD' | 'MDY' | 'DMY';
interface DateOptions extends PromptOptions<Date, DatePrompt> {
    format?: DateFormat;
    locale?: string;
    separator?: string;
    defaultValue?: Date;
    initialValue?: Date;
    minDate?: Date;
    maxDate?: Date;
}
declare class DatePrompt extends Prompt<Date> {
    #private;
    inlineError: string;
    get segmentCursor(): {
        segmentIndex: number;
        positionInSegment: number;
    };
    get segmentValues(): DateParts;
    get segments(): readonly SegmentConfig[];
    get separator(): string;
    get formattedValue(): string;
    constructor(opts: DateOptions);
}

interface GroupMultiSelectOptions<T extends {
    value: any;
}> extends PromptOptions<T['value'][], GroupMultiSelectPrompt<T>> {
    options: Record<string, T[]>;
    initialValues?: T['value'][];
    required?: boolean;
    cursorAt?: T['value'];
    selectableGroups?: boolean;
}
declare class GroupMultiSelectPrompt<T extends {
    value: any;
}> extends Prompt<T['value'][]> {
    #private;
    options: (T & {
        group: string | boolean;
    })[];
    cursor: number;
    getGroupItems(group: string): T[];
    isGroupSelected(group: string): boolean;
    private toggleValue;
    constructor(opts: GroupMultiSelectOptions<T>);
}

interface MultiLineOptions extends PromptOptions<string, MultiLinePrompt> {
    placeholder?: string;
    defaultValue?: string;
    showSubmit?: boolean;
}
declare class MultiLinePrompt extends Prompt<string> {
    #private;
    focused: 'editor' | 'submit';
    get userInputWithCursor(): string;
    get cursor(): number;
    protected _shouldSubmit(_char: string | undefined, _key: Key): boolean;
    constructor(opts: MultiLineOptions);
}

interface OptionLike {
    value: any;
    disabled?: boolean;
}
interface MultiSelectOptions<T extends OptionLike> extends PromptOptions<T['value'][], MultiSelectPrompt<T>> {
    options: T[];
    initialValues?: T['value'][];
    required?: boolean;
    cursorAt?: T['value'];
}
declare class MultiSelectPrompt<T extends OptionLike> extends Prompt<T['value'][]> {
    options: T[];
    cursor: number;
    private get _value();
    private get _enabledOptions();
    private toggleAll;
    private toggleInvert;
    private toggleValue;
    constructor(opts: MultiSelectOptions<T>);
}

interface PasswordOptions extends PromptOptions<string, PasswordPrompt> {
    mask?: string;
}
declare class PasswordPrompt extends Prompt<string> {
    private _mask;
    get cursor(): number;
    get masked(): string;
    get userInputWithCursor(): string;
    clear(): void;
    constructor({ mask, ...opts }: PasswordOptions);
}

interface SelectOptions<T extends {
    value: any;
    disabled?: boolean;
}> extends PromptOptions<T['value'], SelectPrompt<T>> {
    options: T[];
    initialValue?: T['value'];
}
declare class SelectPrompt<T extends {
    value: any;
    disabled?: boolean;
}> extends Prompt<T['value']> {
    options: T[];
    cursor: number;
    private get _selectedValue();
    private changeValue;
    constructor(opts: SelectOptions<T>);
}

interface SelectKeyOptions<T extends {
    value: string;
}> extends PromptOptions<T['value'], SelectKeyPrompt<T>> {
    options: T[];
    caseSensitive?: boolean;
}
declare class SelectKeyPrompt<T extends {
    value: string;
}> extends Prompt<T['value']> {
    options: T[];
    cursor: number;
    constructor(opts: SelectKeyOptions<T>);
}

interface TextOptions extends PromptOptions<string, TextPrompt> {
    placeholder?: string;
    defaultValue?: string;
}
declare class TextPrompt extends Prompt<string> {
    get userInputWithCursor(): string;
    get cursor(): number;
    constructor(opts: TextOptions);
}

declare function isCancel(value: unknown): value is symbol;
interface BlockOptions {
    input?: Readable;
    output?: Writable;
    overwrite?: boolean;
    hideCursor?: boolean;
}
declare function block({ input, output, overwrite, hideCursor, }?: BlockOptions): () => void;
declare const getColumns: (output: Writable) => number;
declare const getRows: (output: Writable) => number;
declare function wrapTextWithPrefix(output: Writable | undefined, text: string, prefix: string, startPrefix?: string, endPrefix?: string, lineFormatter?: (line: string, index: number) => string): string;

export { AutocompletePrompt, ConfirmPrompt, DatePrompt, GroupMultiSelectPrompt, MultiLinePrompt, MultiSelectPrompt, PasswordPrompt, Prompt, SelectKeyPrompt, SelectPrompt, TextPrompt, block, getColumns, getRows, isCancel, runValidation, settings, updateSettings, wrapTextWithPrefix };
export type { AutocompleteOptions, ClackSettings, ConfirmOptions, DateFormat, DateOptions, DateParts, GroupMultiSelectOptions, MultiLineOptions, MultiSelectOptions, PasswordOptions, PromptOptions, SelectKeyOptions, SelectOptions, ClackState as State, TextOptions, Validate };
