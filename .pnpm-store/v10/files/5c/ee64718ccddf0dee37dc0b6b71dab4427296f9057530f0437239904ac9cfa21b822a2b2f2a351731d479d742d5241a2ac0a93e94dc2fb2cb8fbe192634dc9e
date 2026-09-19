import React, { useContext } from 'react';
import chalk from 'chalk';
import colorize from '../colorize.js';
import { accessibilityContext } from './AccessibilityContext.js';
import { backgroundContext } from './BackgroundContext.js';
/**
This component can display text and change its style to make it bold, underlined, italic, or strikethrough.
*/
export default function Text({ color, backgroundColor, dimColor = false, bold = false, italic = false, underline = false, strikethrough = false, inverse = false, wrap = 'wrap', children, 'aria-label': ariaLabel, 'aria-hidden': ariaHidden = false, }) {
    const { isScreenReaderEnabled } = useContext(accessibilityContext);
    const inheritedBackgroundColor = useContext(backgroundContext);
    const childrenOrAriaLabel = isScreenReaderEnabled && ariaLabel ? ariaLabel : children;
    if (childrenOrAriaLabel === undefined || childrenOrAriaLabel === null) {
        return null;
    }
    const transform = (children) => {
        if (dimColor) {
            children = chalk.dim(children);
        }
        if (color) {
            children = colorize(children, color, 'foreground');
        }
        // Use explicit backgroundColor if provided, otherwise use inherited from parent Box
        const effectiveBackgroundColor = backgroundColor ?? inheritedBackgroundColor;
        if (effectiveBackgroundColor) {
            children = colorize(children, effectiveBackgroundColor, 'background');
        }
        if (bold) {
            children = chalk.bold(children);
        }
        if (italic) {
            children = chalk.italic(children);
        }
        if (underline) {
            children = chalk.underline(children);
        }
        if (strikethrough) {
            children = chalk.strikethrough(children);
        }
        if (inverse) {
            children = chalk.inverse(children);
        }
        return children;
    };
    if (isScreenReaderEnabled && ariaHidden) {
        return null;
    }
    return (React.createElement("ink-text", { style: { flexGrow: 0, flexShrink: 1, flexDirection: 'row', textWrap: wrap }, internal_transform: transform }, childrenOrAriaLabel));
}
//# sourceMappingURL=Text.js.map