import { stripVTControlCharacters } from 'node:util';
import { compareStrings, pad, truncate, truncateStart } from './string.js';
const MIN_TRUNCATED_WIDTH = 4;
const COLUMN_SEPARATOR = '  ';
const visibleLength = (text) => stripVTControlCharacters(text).length;
const isPrintable = (value) => typeof value === 'string' || typeof value === 'number';
const toDisplay = (value) => (isPrintable(value) ? String(value) : '');
export class Table {
    columns = [];
    rows = [];
    header;
    maxWidth;
    truncateModes;
    constructor(options) {
        this.header = options?.header ?? false;
        this.maxWidth = options?.maxWidth || process.stdout.columns || 120;
        this.truncateModes = options?.truncate ?? {};
    }
    row() {
        this.rows.push({});
        return this;
    }
    cell(column, value, formatter) {
        if (!this.columns.includes(column))
            this.columns.push(column);
        const row = this.rows[this.rows.length - 1];
        const align = typeof value === 'number' ? 'right' : 'left';
        const formatted = formatter?.(value);
        const display = formatted ?? toDisplay(value);
        row[column] = { value, formatted, align, width: visibleLength(display) };
        return this;
    }
    sort(column, order = 'asc') {
        const dir = order === 'desc' ? -1 : 1;
        this.rows.sort((a, b) => {
            const vA = a[column]?.value;
            const vB = b[column]?.value;
            if (typeof vA === 'string' && typeof vB === 'string')
                return dir * compareStrings(vA, vB);
            if (typeof vA === 'number' && typeof vB === 'number')
                return dir * (vA - vB);
            return !isPrintable(vA) ? 1 : !isPrintable(vB) ? -1 : 0;
        });
        return this;
    }
    modeFor(column) {
        return this.truncateModes[column] ?? 'end';
    }
    distributeWidths(columns, widths, separatorWidth) {
        const truncatable = columns.filter(col => this.modeFor(col) !== 'none');
        if (truncatable.length === 0)
            return;
        const reserved = columns.filter(col => this.modeFor(col) === 'none').reduce((sum, col) => sum + widths[col], 0);
        const budget = Math.max(0, this.maxWidth - separatorWidth - reserved);
        const original = {};
        for (const col of truncatable)
            original[col] = widths[col];
        const unresolved = new Set(truncatable);
        let remainingBudget = budget;
        let changed = true;
        while (changed && unresolved.size > 0) {
            changed = false;
            const share = Math.floor(remainingBudget / unresolved.size);
            for (const col of unresolved) {
                if (original[col] <= share) {
                    widths[col] = original[col];
                    remainingBudget -= original[col];
                    unresolved.delete(col);
                    changed = true;
                }
            }
        }
        if (unresolved.size === 0)
            return;
        const overMin = [...unresolved].reduce((sum, col) => sum + (original[col] - MIN_TRUNCATED_WIDTH), 0);
        const excess = Math.max(0, remainingBudget - unresolved.size * MIN_TRUNCATED_WIDTH);
        let distributed = 0;
        for (const col of unresolved) {
            const share = overMin > 0 ? Math.floor(((original[col] - MIN_TRUNCATED_WIDTH) * excess) / overMin) : 0;
            widths[col] = MIN_TRUNCATED_WIDTH + share;
            distributed += share;
        }
        const leftover = excess - distributed;
        if (leftover > 0)
            widths[[...unresolved][0]] += leftover;
    }
    toCells() {
        const columns = this.columns.filter(col => this.rows.some(row => isPrintable(row[col]?.value)));
        const rows = [];
        if (this.header && this.rows.length > 0) {
            const headerRow = {};
            const linesRow = {};
            for (const col of columns) {
                const align = this.rows[0][col]?.align === 'right' ? 'center' : 'left';
                headerRow[col] = { value: col, align, width: col.length };
                linesRow[col] = { value: '', fill: '-', width: 0 };
            }
            rows.push(headerRow, linesRow);
        }
        rows.push(...this.rows);
        const columnWidths = {};
        for (const col of columns) {
            let max = 0;
            for (const row of rows) {
                const w = row[col]?.width ?? 0;
                if (w > max)
                    max = w;
            }
            columnWidths[col] = max;
        }
        const separatorWidth = columns.length > 1 ? (columns.length - 1) * COLUMN_SEPARATOR.length : 0;
        const totalWidth = columns.reduce((sum, col) => sum + columnWidths[col], 0) + separatorWidth;
        if (totalWidth > this.maxWidth) {
            this.distributeWidths(columns, columnWidths, separatorWidth);
        }
        return rows.map(row => columns.map((col, index) => {
            const cell = row[col];
            const width = columnWidths[col];
            const fill = cell?.fill || ' ';
            const display = cell?.formatted ?? toDisplay(cell?.value);
            const padded = pad(display, width, fill, cell?.align);
            const mode = this.modeFor(col);
            const rendered = mode === 'none' ? padded : mode === 'start' ? truncateStart(padded, width) : truncate(padded, width);
            return index === 0 ? rendered : COLUMN_SEPARATOR + rendered;
        }));
    }
    toRows() {
        return this.toCells().map(row => row.join(''));
    }
    toString() {
        return this.toRows().join('\n');
    }
}
