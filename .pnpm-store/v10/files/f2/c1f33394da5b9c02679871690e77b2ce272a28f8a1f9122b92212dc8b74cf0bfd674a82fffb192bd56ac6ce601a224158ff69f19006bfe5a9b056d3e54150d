type Value = string | number | undefined | false | null;
type TruncateMode = 'start' | 'end' | 'none';
type SortOrder = 'asc' | 'desc';
export declare class Table {
    private columns;
    private rows;
    private header;
    private maxWidth;
    private truncateModes;
    constructor(options?: {
        maxWidth?: number;
        header?: boolean;
        truncate?: Record<string, TruncateMode>;
    });
    row(): this;
    cell(column: string, value: Value, formatter?: (value: Value) => string): this;
    sort(column: string, order?: SortOrder): this;
    private modeFor;
    private distributeWidths;
    toCells(): string[][];
    toRows(): string[];
    toString(): string;
}
export {};
