import { State, AutocompletePrompt, Validate, DateFormat } from '@clack/core';
export { ClackSettings, DateFormat, isCancel, settings, updateSettings } from '@clack/core';
import { Readable, Writable } from 'node:stream';

declare const unicode: boolean;
declare const isCI: () => boolean;
declare const isTTY: (output: Writable) => boolean;
declare const unicodeOr: (c: string, fallback: string) => string;
declare const S_STEP_ACTIVE: string;
declare const S_STEP_CANCEL: string;
declare const S_STEP_ERROR: string;
declare const S_STEP_SUBMIT: string;
declare const S_BAR_START: string;
declare const S_BAR: string;
declare const S_BAR_END: string;
declare const S_BAR_START_RIGHT: string;
declare const S_BAR_END_RIGHT: string;
declare const S_RADIO_ACTIVE: string;
declare const S_RADIO_INACTIVE: string;
declare const S_CHECKBOX_ACTIVE: string;
declare const S_CHECKBOX_SELECTED: string;
declare const S_CHECKBOX_INACTIVE: string;
declare const S_PASSWORD_MASK: string;
declare const S_BAR_H: string;
declare const S_CORNER_TOP_RIGHT: string;
declare const S_CONNECT_LEFT: string;
declare const S_CORNER_BOTTOM_RIGHT: string;
declare const S_CORNER_BOTTOM_LEFT: string;
declare const S_CORNER_TOP_LEFT: string;
declare const S_INFO: string;
declare const S_SUCCESS: string;
declare const S_WARN: string;
declare const S_ERROR: string;
declare const symbol: (state: State) => string;
declare const symbolBar: (state: State) => string;
interface CommonOptions {
    input?: Readable;
    output?: Writable;
    signal?: AbortSignal;
    withGuide?: boolean;
}
declare function formatInstructionFooter(instructions: string[], hasGuide: boolean): string[];

declare const SELECT_INSTRUCTIONS: string[];
type Primitive = Readonly<string | boolean | number>;
type Option<Value> = Value extends Primitive ? {
    /**
     * Internal data for this option.
     */
    value: Value;
    /**
     * The optional, user-facing text for this option.
     *
     * By default, the `value` is converted to a string.
     */
    label?: string;
    /**
     * An optional hint to display to the user when
     * this option might be selected.
     *
     * By default, no `hint` is displayed.
     */
    hint?: string;
    /**
     * Whether this option is disabled.
     * Disabled options are visible but cannot be selected.
     *
     * By default, options are not disabled.
     */
    disabled?: boolean;
} : {
    /**
     * Internal data for this option.
     */
    value: Value;
    /**
     * Required. The user-facing text for this option.
     */
    label: string;
    /**
     * An optional hint to display to the user when
     * this option might be selected.
     *
     * By default, no `hint` is displayed.
     */
    hint?: string;
    /**
     * Whether this option is disabled.
     * Disabled options are visible but cannot be selected.
     *
     * By default, options are not disabled.
     */
    disabled?: boolean;
};
interface SelectOptions<Value> extends CommonOptions {
    message: string;
    options: Option<Value>[];
    initialValue?: Value;
    maxItems?: number;
    /**
     * Show keyboard instructions below the option list.
     * @default true
     */
    showInstructions?: boolean;
}
declare const select: <Value>(opts: SelectOptions<Value>) => Promise<Value | symbol>;

/**
 * Options for the {@link autocomplete} prompt.
 */
interface AutocompleteSharedOptions<Value> extends CommonOptions {
    /**
     * The message or question shown to the user above the input.
     */
    message: string;
    /**
     * The options to present, or a function that returns the options to present
     * allowing for custom search/filtering.
     *
     * @see https://bomb.sh/docs/clack/packages/prompts/#dynamic-options-getter
     */
    options: Option<Value>[] | ((this: AutocompletePrompt<Option<Value>>) => Option<Value>[]);
    /**
     * The maximum number of items/options to display in the autocomplete list at once.
     */
    maxItems?: number;
    /**
     * Placeholder text displayed when the search field is empty. When set, pressing
     * tab copies the placeholder into the input.
     */
    placeholder?: string;
    /**
     * A function or a [Standard Schema](https://github.com/standard-schema/standard-schema)
     * that validates user input. If a custom function is given, you should return a `string` or `Error`
     * to show as a validation error, or `undefined` to accept the result.
     */
    validate?: Validate<Value | Value[]>;
    /**
     * Custom filter function to match options against the search input.
     */
    filter?: (search: string, option: Option<Value>) => boolean;
}
interface AutocompleteOptions<Value> extends AutocompleteSharedOptions<Value> {
    /**
     * The initially selected option from the list.
     */
    initialValue?: Value;
    /**
     * The starting value shown in the users input box.
     */
    initialUserInput?: string;
}
/**
 * The `autocomplete` prompt combines a text input with a searchable list of options.
 * It's perfect for when you have a large list of options and want to help users
 * find what they're looking for quickly.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#autocomplete
 *
 * @example
 * ```ts
 * import { autocomplete } from '@clack/prompts';
 *
 * const framework = await autocomplete({
 *   message: 'Search for a framework',
 *   options: [
 *     { value: 'next', label: 'Next.js', hint: 'React framework' },
 *     { value: 'astro', label: 'Astro', hint: 'Content-focused' },
 *     { value: 'svelte', label: 'SvelteKit', hint: 'Compile-time framework' },
 *     { value: 'remix', label: 'Remix', hint: 'Full stack framework' },
 *     { value: 'nuxt', label: 'Nuxt', hint: 'Vue framework' },
 *   ],
 *   placeholder: 'Type to search...',
 *   maxItems: 5,
 * });
 * ```
 */
declare const autocomplete: <Value>(opts: AutocompleteOptions<Value>) => Promise<Value | symbol>;
/**
 * Options for the {@link autocompleteMultiselect} prompt
 */
interface AutocompleteMultiSelectOptions<Value> extends AutocompleteSharedOptions<Value> {
    /**
     * The initially selected option(s) from the list.
     */
    initialValues?: Value[];
    /**
     * When `true` at least one option must be selected.
     * @default false
     */
    required?: boolean;
}
/**
 * The `autocompleteMultiselect` prompt combines the search functionality of autocomplete
 * with the ability to select multiple options.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#autocomplete-multiselect
 *
 * @example
 * ```ts
 * import { autocompleteMultiselect } from '@clack/prompts';
 *
 * const frameworks = await autocompleteMultiselect({
 *   message: 'Select frameworks',
 *   options: [
 *     { value: 'next', label: 'Next.js', hint: 'React framework' },
 *     { value: 'astro', label: 'Astro', hint: 'Content-focused' },
 *     { value: 'svelte', label: 'SvelteKit', hint: 'Compile-time framework' },
 *     { value: 'remix', label: 'Remix', hint: 'Full stack framework' },
 *     { value: 'nuxt', label: 'Nuxt', hint: 'Vue framework' },
 *   ],
 *   placeholder: 'Type to search...',
 *   maxItems: 5,
 * });
 * ```
 */
declare const autocompleteMultiselect: <Value>(opts: AutocompleteMultiSelectOptions<Value>) => Promise<Value[] | symbol>;

/**
 * Alignment for content or titles within the box.
 */
type BoxAlignment = 'left' | 'center' | 'right';
/**
 * Options for the {@link box} prompt.
 */
interface BoxOptions extends CommonOptions {
    /**
     * Alignment of the content (`'left'`, `'center'`, or `'right'`).
     * @default 'left'
     */
    contentAlign?: BoxAlignment;
    /**
     * Alignment of the title (`'left'`, `'center'`, or `'right'`).
     * @default 'left'
     */
    titleAlign?: BoxAlignment;
    /**
     * The width of the box, either `'auto'` to fit the content or a number for a fixed width.
     * @default 'auto'
     */
    width?: number | 'auto';
    /**
     * Padding around the title.
     * @default 1
     */
    titlePadding?: number;
    /**
     * Padding around the content.
     * @default 2
     */
    contentPadding?: number;
    /**
     * Use rounded corners when `true`, square corners when `false`.
     * @default true
     */
    rounded?: boolean;
    /**
     * Custom function to style the border characters.
     */
    formatBorder?: (text: string) => string;
}
/**
 * Renders a customizable box around text content. It's similar to {@link note} but offers
 * more styling options.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#box
 *
 * @param message - The content to display inside the box.
 * @param title - The title to display in the top border of the box.
 * @param opts - Optional configuration for the box styling and behavior.
 *
 * @example
 * ```ts
 * import { box } from '@clack/prompts';
 *
 * box('This is the content of the box', 'Box Title', {
 *   contentAlign: 'center',
 *   titleAlign: 'center',
 *   width: 'auto',
 *   rounded: true,
 * });
 * ```
 */
declare const box: (message?: string, title?: string, opts?: BoxOptions) => void;

/**
 * Options for the {@link confirm} prompt.
 */
interface ConfirmOptions extends CommonOptions {
    /**
     * The message or question shown to the user above the input.
     */
    message: string;
    /**
     * The label to use for the active (true) option.
     * @default 'Yes'
     */
    active?: string;
    /**
     * The label to use for the inactive (false) option.
     * @default 'No'
     */
    inactive?: string;
    /**
     * The initial selected value (true or false).
     * @default true
     */
    initialValue?: boolean;
    /**
     * Whether to render the options vertically instead of horizontally.
     * @default false
     */
    vertical?: boolean;
}
/**
 * The `confirm` prompt accepts a yes or no choice, returning a boolean value
 * corresponding to the user's selection.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#confirmation
 *
 * @example
 * ```ts
 * import { confirm } from '@clack/prompts';
 *
 * const shouldProceed = await confirm({
 *   message: 'Do you want to continue?',
 * });
 * ```
 */
declare const confirm: (opts: ConfirmOptions) => Promise<boolean | symbol>;

/**
 * Options for the {@link date} prompt.
 */
interface DateOptions extends CommonOptions {
    /**
     * The message or question shown to the user above the input.
     */
    message: string;
    /**
     * The date format for the input segments.
     * @deafult based on locale
     */
    format?: DateFormat;
    /**
     * The BCP 47 language tag to use for formatting
     * @see https://developer.mozilla.org/en-US/docs/Glossary/BCP_47_language_tag
     * @example "en-GB"
     */
    locale?: string;
    /**
     * The default value returned when the user doesn't select a date.
     */
    defaultValue?: Date;
    /**
     * The starting date shown when the prompt first renders.
     * Users can edit this value before submitting.
     */
    initialValue?: Date;
    /**
     * The minimum allowed date for validation.
     */
    minDate?: Date;
    /**
     * The maximum allowed date for validation.
     */
    maxDate?: Date;
    /**
     * A function or a [Standard Schema](https://github.com/standard-schema/standard-schema)
     * that validates user input. If a custom function is given, you should return a `string` or `Error`
     * to show as a validation error, or `undefined` to accept the result.
     */
    validate?: Validate<Date>;
}
/**
 * The `date` prompt provides an interactive date picker, allowing users
 * to navigate between year, month, and day segments and
 * increment/decrement values using keyboard controls.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#date-input
 *
 * @example
 * ```ts
 * import { date } from '@clack/prompts';
 *
 * const birthday = await date({
 *   message: 'Pick your birthday',
 *   minDate: new Date('1900-01-01'),
 *   initialValue: new Date(),
 *   maxDate: new Date(),
 * });
 * ```
 */
declare const date: (opts: DateOptions) => Promise<Date | symbol>;

type Prettify<T> = {
    [P in keyof T]: T[P];
} & {};
/**
 * The return type of a {@link PromptGroup}.
 * Resolves all prompt results, excluding the cancel symbol.
 */
type PromptGroupAwaitedReturn<T> = {
    [P in keyof T]: Exclude<Awaited<T[P]>, symbol>;
};
/**
 * Options for the {@link group} utility.
 */
interface PromptGroupOptions<T> {
    /**
     * Called when any one of the prompts is canceled.
     */
    onCancel?: (opts: {
        results: Prettify<Partial<PromptGroupAwaitedReturn<T>>>;
    }) => void;
}
/**
 * A group of prompts to be displayed sequentially, with each prompt receiving
 * the results of all previous prompts in the group.
 */
type PromptGroup<T> = {
    [P in keyof T]: (opts: {
        results: Prettify<Partial<PromptGroupAwaitedReturn<Omit<T, P>>>>;
    }) => undefined | Promise<T[P] | undefined>;
};
/**
 * The `group` utility provides a consistent way to combine a series of prompts,
 * combining each answer into one object. Each prompt receives the results of
 * all previously completed prompts, and are displayed sequentially.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#group
 *
 * @example
 * ```ts
 * import { group, text, password } from '@clack/prompts';
 *
 * const account = await group({
 *   email: () => text({
 *     message: 'What is your email address?',
 *   }),
 *   username: ({ results }) => text({
 *     message: 'What is your username?',
 *     placeholder: results.email?.replace(/@.+$/, '').toLowerCase() ?? '',
 *   }),
 *   password: () => password({
 *     message: 'Define your password',
 *   }),
 * });
 * ```
 */
declare const group: <T>(prompts: PromptGroup<T>, opts?: PromptGroupOptions<T>) => Promise<Prettify<PromptGroupAwaitedReturn<T>>>;

/**
 * Options for the {@link groupMultiselect} prompt.
 */
interface GroupMultiSelectOptions<Value> extends CommonOptions {
    /**
     * The message or question shown to the user above the input.
     */
    message: string;
    /**
     * Grouped options to display. Each key is a group label, and each value is an array of options.
     */
    options: Record<string, Option<Value>[]>;
    /**
     * The initially selected option(s).
     */
    initialValues?: Value[];
    /**
     * The maximum number of items/options to display at once.
     */
    maxItems?: number;
    /**
     * When `true` at least one option must be selected.
     * @default true
     */
    required?: boolean;
    /**
     * The value the cursor should be positioned at initially.
     */
    cursorAt?: Value;
    /**
     * Whether entire groups can be selected at once.
     * @default true
     */
    selectableGroups?: boolean;
    /**
     * Number of blank lines between groups.
     * @default 0
     */
    groupSpacing?: number;
    /**
     * Show keyboard instructions below the option list.
     * @default true
     */
    showInstructions?: boolean;
}
/**
 * The `groupMultiselect` prompt extends the {@link multiselect} prompt to allow
 * arranging distinct Multi-Selects, whilst keeping all of them interactive.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#group-multiselect
 *
 * @example
 * ```ts
 * import { groupMultiselect } from '@clack/prompts';
 *
 * const result = await groupMultiselect({
 * 	message: 'Define your project',
 * 	options: {
 * 		'Testing': [
 * 			{ value: 'Jest', hint: 'JavaScript testing framework' },
 * 			{ value: 'Playwright', hint: 'End-to-end testing' },
 * 		],
 * 		'Language': [
 * 			{ value: 'js', label: 'JavaScript', hint: 'Dynamic typing' },
 * 			{ value: 'ts', label: 'TypeScript', hint: 'Static typing' },
 * 		],
 * 	},
 * });
 * ```
 *
 * @param opts The options for the group multiselect prompt
 */
declare const groupMultiselect: <Value>(opts: GroupMultiSelectOptions<Value>) => Promise<Value[] | symbol>;

/**
 * Options for the {@link limitOptions} function.
 */
interface LimitOptionsParams<TOption> extends CommonOptions {
    /**
     * The list of options to display.
     */
    options: TOption[];
    /**
     * The index of the currently active/selected option.
     */
    cursor: number;
    /**
     * A function that styles the given option string.
     *
     * @param option - The option string to style.
     * @param active - Whether the option is currently selected.
     */
    style: (option: TOption, active: boolean) => string;
    /**
     * Maximum number of options to display at once.
     * @default Infinity
     */
    maxItems?: number;
    /**
     * Number of columns to reserve for padding.
     * @default 0
     */
    columnPadding?: number;
    /**
     * Number of rows to reserve for padding.
     * @default 4
     */
    rowPadding?: number;
}
/**
 * Trims an option list to what fits the terminal, while keeping the active
 * option (cursor) visible using a Clack style sliding window.
 *
 * @returns The lines to render.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#limitoptions
 *
 * @example
 * ```ts
 * import { limitOptions } from '@clack/prompts';
 * import { styleText } from 'node:util';
 *
 * const options = ['apple', 'banana', 'cherry', 'date'];
 * const lines = limitOptions({
 *   options,
 *   cursor: 2,
 *   maxItems: 8,
 *   style: (opt, active) =>
 *     active ? styleText('cyan', opt) : styleText('dim', opt),
 * });
 * ```
 */
declare const limitOptions: <TOption>({ cursor, options, style, output, maxItems, columnPadding, rowPadding, }: LimitOptionsParams<TOption>) => string[];

interface LogMessageOptions extends CommonOptions {
    symbol?: string;
    spacing?: number;
    secondarySymbol?: string;
}
declare const log: {
    message: (message?: string | string[], { symbol, secondarySymbol, output, spacing, withGuide, }?: LogMessageOptions) => void;
    info: (message: string, opts?: LogMessageOptions) => void;
    success: (message: string, opts?: LogMessageOptions) => void;
    step: (message: string, opts?: LogMessageOptions) => void;
    warn: (message: string, opts?: LogMessageOptions) => void;
    /** alias for `log.warn()`. */
    warning: (message: string, opts?: LogMessageOptions) => void;
    error: (message: string, opts?: LogMessageOptions) => void;
};

/**
 * The `cancel` function defines an interruption of an interaction
 * and therefore its end.
 *
 * @param title Optional closing message to be displayed.
 * @param opts Additional configuration options.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#cancel
 *
 * @example
 * ```ts
 * import { cancel } from '@clack/prompts';
 * import process from 'node:process';
 *
 * cancel('Installation canceled');
 * process.exit(1);
 * ```
 */
declare const cancel: (message?: string, opts?: CommonOptions) => void;
/**
 * The `intro` function defines the beginning of an interaction.
 *
 * @param title Optional title to be displayed.
 * @param opts Additional configuration options.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#intro
 *
 * @example
 * ```ts
 * import { intro } from '@clack/prompts';
 *
 * intro('Welcome to clack');
 * ```
 */
declare const intro: (title?: string, opts?: CommonOptions) => void;
/**
 * The `outro` function defines the end of an interaction.
 *
 * @param title Optional closing message to be displayed.
 * @param opts Additional configuration options.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#outro
 *
 * @example
 * ```ts
 * import { outro } from '@clack/prompts';
 *
 * outro('All operations are finished');
 * ```
 */
declare const outro: (message?: string, opts?: CommonOptions) => void;

/**
 * Options for the {@link text} prompt
 */
interface TextOptions extends CommonOptions {
    /**
     * The prompt message or question shown to the user above the input.
     */
    message: string;
    /**
     * A visual hint shown when the field has no content.
     */
    placeholder?: string;
    /**
     * A fallback value returned when the user provides nothing (empty input).
     */
    defaultValue?: string;
    /**
     * The starting value shown when the prompt first renders.
     * Users can edit this value before submitting.
     */
    initialValue?: string;
    /**
     * A function or a [Standard Schema](https://github.com/standard-schema/standard-schema)
     * that validates user input. If a custom function is given, you should return a `string` or `Error`
     * to show as a validation error, or `undefined` to accept the result.
     */
    validate?: Validate<string>;
}
/**
 * The text prompt accepts a single line of text.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#text-input
 *
 * @example
 * ```ts
 * import { text } from '@clack/prompts';
 *
 * const name = await text({
 *   message: 'What is your name?',
 *   placeholder: 'John Doe',
 *   validate: (value) => {
 *     if (!value || value.length < 2) return 'Name must be at least 2 characters';
 *     return undefined;
 *   },
 * });
 * ```
 */
declare const text: (opts: TextOptions) => Promise<string | symbol>;

/**
 * Options for the {@link multiline} prompt
 */
interface MultiLineOptions extends TextOptions {
    /**
     * When enabled it shows a `[ submit ]` button that can be focused with tab.
     * By default, pressing `Enter` twice submits the input
     *
     * @default false
     */
    showSubmit?: boolean;
}
/**
 * The multi-line prompt accepts multiple lines of text input.
 * By default, pressing `Enter` twice submits the input.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#multi-line-text
 *
 * @example
 * ```ts
 * import { multiline } from '@clack/prompts';
 *
 * const bio = await multiline({
 *   message: 'Enter your bio',
 *   placeholder: 'Tell us about yourself...',
 *   showSubmit: true,
 * });
 * ```
 */
declare const multiline: (opts: MultiLineOptions) => Promise<string | symbol>;

declare const MULTISELECT_INSTRUCTIONS: string[];
interface MultiSelectOptions<Value> extends CommonOptions {
    message: string;
    options: Option<Value>[];
    initialValues?: Value[];
    maxItems?: number;
    required?: boolean;
    cursorAt?: Value;
    /**
     * Show keyboard instructions below the option list.
     * @default true
     */
    showInstructions?: boolean;
}
declare const multiselect: <Value>(opts: MultiSelectOptions<Value>) => Promise<Value[] | symbol>;

type FormatFn = (line: string) => string;
interface NoteOptions extends CommonOptions {
    format?: FormatFn;
}
declare const note: (message?: string, title?: string, opts?: NoteOptions) => void;

/**
 * Options for the {@link password} prompt
 */
interface PasswordOptions extends CommonOptions {
    /**
     * The prompt message or question shown to the user above the input.
     */
    message: string;
    /**
     * Character to use for masking input.
     * @default ▪/•
     */
    mask?: string;
    /**
     * A function or a [Standard Schema](https://github.com/standard-schema/standard-schema)
     * that validates user input. If a custom function is given, you should return a `string` or `Error`
     * to show as a validation error, or `undefined` to accept the result.
     */
    validate?: Validate<string>;
    /**
     * When enabled it causes the input to be cleared if/when validation fails.
     * @default false
     */
    clearOnError?: boolean;
}
/**
 * The password prompt behaves like the {@link text} prompt, but the input is masked.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#password-input
 *
 * @example
 * ```ts
 * import { password } from '@clack/prompts';
 *
 * const result = await password({
 *   message: 'Enter your password',
 * });
 * ```
 */
declare const password: (opts: PasswordOptions) => Promise<string | symbol>;

/**
 * Options for the {@link path} prompt.
 */
interface PathOptions extends CommonOptions {
    /**
     * The message or question shown to the user above the input.
     */
    message: string;
    /**
     * The starting directory for path suggestions (defaults to current working directory).
     */
    root?: string;
    /**
     * When `true` only **directories** appear in suggestions while you navigate.
     */
    directory?: boolean;
    /**
     * The starting path shown when the prompt first renders, which users can edit
     * before submitting. If not provided it will fall back to the given `root`,
     * or the current working directory.
     *
     * In `directory` mode, if the initial value points to a directory that exists,
     * pressing enter will submit the input instead of jumping to the first child.
     */
    initialValue?: string;
    /**
     * A function or a [Standard Schema](https://github.com/standard-schema/standard-schema)
     * that validates user input. If a custom function is given, you should return a `string` or `Error`
     * to show as a validation error, or `undefined` to accept the result.
     */
    validate?: Validate<string>;
}
/**
 * The `path` prompt extends `autocomplete` to provide file and directory suggestions.
 *
 * @see https://bomb.sh/docs/clack/packages/prompts/#path-selection
 *
 * @example
 * ```ts
 * import { path } from '@clack/prompts';
 *
 * const result = await path({
 *   message: 'Select a file:',
 *   root: process.cwd(),
 *   directory: false,
 * });
 * ```
 */
declare const path: (opts: PathOptions) => Promise<string | symbol>;

interface SpinnerOptions extends CommonOptions {
    indicator?: 'dots' | 'timer';
    onCancel?: () => void;
    cancelMessage?: string;
    errorMessage?: string;
    frames?: string[];
    delay?: number;
    styleFrame?: (frame: string) => string;
}
interface SpinnerResult {
    start(msg?: string): void;
    stop(msg?: string): void;
    cancel(msg?: string): void;
    error(msg?: string): void;
    message(msg?: string): void;
    clear(): void;
    readonly isCancelled: boolean;
}
declare const spinner: ({ indicator, onCancel, output, cancelMessage, errorMessage, frames, delay, signal, ...opts }?: SpinnerOptions) => SpinnerResult;

interface ProgressOptions extends SpinnerOptions {
    style?: 'light' | 'heavy' | 'block';
    max?: number;
    size?: number;
}
interface ProgressResult extends SpinnerResult {
    advance(step?: number, msg?: string): void;
}
declare function progress({ style, max: userMax, size: userSize, ...spinnerOptions }?: ProgressOptions): ProgressResult;

interface SelectKeyOptions<Value extends string> extends CommonOptions {
    message: string;
    options: Option<Value>[];
    initialValue?: Value;
    caseSensitive?: boolean;
}
declare const selectKey: <Value extends string>(opts: SelectKeyOptions<Value>) => Promise<Value | symbol>;

declare const stream: {
    message: (iterable: Iterable<string> | AsyncIterable<string>, { symbol }?: LogMessageOptions) => Promise<void>;
    info: (iterable: Iterable<string> | AsyncIterable<string>) => Promise<void>;
    success: (iterable: Iterable<string> | AsyncIterable<string>) => Promise<void>;
    step: (iterable: Iterable<string> | AsyncIterable<string>) => Promise<void>;
    warn: (iterable: Iterable<string> | AsyncIterable<string>) => Promise<void>;
    /** alias for `log.warn()`. */
    warning: (iterable: Iterable<string> | AsyncIterable<string>) => Promise<void>;
    error: (iterable: Iterable<string> | AsyncIterable<string>) => Promise<void>;
};

type Task = {
    /**
     * Task title
     */
    title: string;
    /**
     * Task function
     */
    task: (message: (string: string) => void) => string | Promise<string> | void | Promise<void>;
    /**
     * If enabled === false the task will be skipped
     */
    enabled?: boolean;
};
/**
 * Define a group of tasks to be executed
 */
declare const tasks: (tasks: Task[], opts?: CommonOptions) => Promise<void>;

interface TaskLogOptions extends CommonOptions {
    title: string;
    limit?: number;
    spacing?: number;
    retainLog?: boolean;
}
interface TaskLogMessageOptions {
    raw?: boolean;
}
interface TaskLogCompletionOptions {
    showLog?: boolean;
}
/**
 * Renders a log which clears on success and remains on failure
 */
declare const taskLog: (opts: TaskLogOptions) => {
    message(msg: string, mopts?: TaskLogMessageOptions): void;
    group(name: string): {
        message(msg: string, mopts?: TaskLogMessageOptions): void;
        error(message: string): void;
        success(message: string): void;
    };
    error(message: string, opts?: TaskLogCompletionOptions): void;
    success(message: string, opts?: TaskLogCompletionOptions): void;
};

export { MULTISELECT_INSTRUCTIONS, SELECT_INSTRUCTIONS, S_BAR, S_BAR_END, S_BAR_END_RIGHT, S_BAR_H, S_BAR_START, S_BAR_START_RIGHT, S_CHECKBOX_ACTIVE, S_CHECKBOX_INACTIVE, S_CHECKBOX_SELECTED, S_CONNECT_LEFT, S_CORNER_BOTTOM_LEFT, S_CORNER_BOTTOM_RIGHT, S_CORNER_TOP_LEFT, S_CORNER_TOP_RIGHT, S_ERROR, S_INFO, S_PASSWORD_MASK, S_RADIO_ACTIVE, S_RADIO_INACTIVE, S_STEP_ACTIVE, S_STEP_CANCEL, S_STEP_ERROR, S_STEP_SUBMIT, S_SUCCESS, S_WARN, autocomplete, autocompleteMultiselect, box, cancel, confirm, date, formatInstructionFooter, group, groupMultiselect, intro, isCI, isTTY, limitOptions, log, multiline, multiselect, note, outro, password, path, progress, select, selectKey, spinner, stream, symbol, symbolBar, taskLog, tasks, text, unicode, unicodeOr };
export type { AutocompleteMultiSelectOptions, AutocompleteOptions, BoxAlignment, BoxOptions, CommonOptions, ConfirmOptions, DateOptions, GroupMultiSelectOptions, LimitOptionsParams, LogMessageOptions, MultiLineOptions, MultiSelectOptions, NoteOptions, Option, PasswordOptions, PathOptions, ProgressOptions, ProgressResult, PromptGroup, PromptGroupAwaitedReturn, PromptGroupOptions, SelectKeyOptions, SelectOptions, SpinnerOptions, SpinnerResult, Task, TaskLogCompletionOptions, TaskLogMessageOptions, TaskLogOptions, TextOptions };
