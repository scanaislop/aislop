import * as fs from 'node:fs';
import { cwd } from 'node:process';
import React from 'react';
import StackUtils from 'stack-utils';
import codeExcerpt from 'code-excerpt';
import Box from './Box.js';
import Text from './Text.js';
// Error's source file is reported as file:///home/user/file.js
// This function removes the file://[cwd] part
const cleanupPath = (path) => {
    return path?.replace(`file://${cwd()}/`, '');
};
const stackUtils = new StackUtils({
    cwd: cwd(),
    internals: StackUtils.nodeInternals(),
});
export default function ErrorOverview({ error }) {
    const stack = error.stack ? error.stack.split('\n').slice(1) : undefined;
    const origin = stack ? stackUtils.parseLine(stack[0]) : undefined;
    const filePath = cleanupPath(origin?.file);
    let excerpt;
    let lineWidth = 0;
    const stackLineCounts = new Map();
    if (filePath && origin?.line && fs.existsSync(filePath)) {
        const sourceCode = fs.readFileSync(filePath, 'utf8');
        excerpt = codeExcerpt(sourceCode, origin.line);
        if (excerpt) {
            for (const { line } of excerpt) {
                lineWidth = Math.max(lineWidth, String(line).length);
            }
        }
    }
    return (React.createElement(Box, { flexDirection: "column", padding: 1 },
        React.createElement(Box, null,
            React.createElement(Text, { backgroundColor: "red", color: "white" },
                ' ',
                "ERROR",
                ' '),
            React.createElement(Text, null,
                " ",
                error.message)),
        origin && filePath ? (React.createElement(Box, { marginTop: 1 },
            React.createElement(Text, { dimColor: true },
                filePath,
                ":",
                origin.line,
                ":",
                origin.column))) : null,
        origin && excerpt ? (React.createElement(Box, { marginTop: 1, flexDirection: "column" }, excerpt.map(({ line, value }) => (React.createElement(Box, { key: line },
            React.createElement(Box, { width: lineWidth + 1 },
                React.createElement(Text, { dimColor: line !== origin.line, backgroundColor: line === origin.line ? 'red' : undefined, color: line === origin.line ? 'white' : undefined, "aria-label": line === origin.line
                        ? `Line ${line}, error`
                        : `Line ${line}` },
                    String(line).padStart(lineWidth, ' '),
                    ":")),
            React.createElement(Text, { key: line, backgroundColor: line === origin.line ? 'red' : undefined, color: line === origin.line ? 'white' : undefined }, ' ' + value)))))) : null,
        error.stack ? (React.createElement(Box, { marginTop: 1, flexDirection: "column" }, error.stack
            .split('\n')
            .slice(1)
            .map(line => {
            const parsedLine = stackUtils.parseLine(line);
            const lineCount = stackLineCounts.get(line) ?? 0;
            stackLineCounts.set(line, lineCount + 1);
            const key = `${line}-${lineCount}`;
            // If the line from the stack cannot be parsed, or parsed into an incomplete
            // frame without source location data (for example, "at native"), we print
            // out the unparsed line.
            if (!parsedLine?.file || !parsedLine.line || !parsedLine.column) {
                return (React.createElement(Box, { key: key },
                    React.createElement(Text, { dimColor: true }, "- "),
                    React.createElement(Text, { dimColor: true, bold: true },
                        line,
                        "\\t",
                        ' ')));
            }
            return (React.createElement(Box, { key: key },
                React.createElement(Text, { dimColor: true }, "- "),
                React.createElement(Text, { dimColor: true, bold: true }, parsedLine.function),
                React.createElement(Text, { dimColor: true, color: "gray", "aria-label": `at ${cleanupPath(parsedLine.file) ?? ''} line ${parsedLine.line} column ${parsedLine.column}` },
                    ' ',
                    "(",
                    cleanupPath(parsedLine.file) ?? '',
                    ":",
                    parsedLine.line,
                    ":",
                    parsedLine.column,
                    ")")));
        }))) : null));
}
//# sourceMappingURL=ErrorOverview.js.map