import React, { forwardRef, useContext } from 'react';
import { accessibilityContext } from './AccessibilityContext.js';
import { backgroundContext } from './BackgroundContext.js';
/**
`<Box>` is an essential Ink component to build your layout. It's like `<div style="display: flex">` in the browser.
*/
const Box = forwardRef(({ children, backgroundColor, 'aria-label': ariaLabel, 'aria-hidden': ariaHidden, 'aria-role': role, 'aria-state': ariaState, ...style }, ref) => {
    const { isScreenReaderEnabled } = useContext(accessibilityContext);
    const label = ariaLabel ? React.createElement("ink-text", null, ariaLabel) : undefined;
    if (isScreenReaderEnabled && ariaHidden) {
        return null;
    }
    const boxElement = (React.createElement("ink-box", { ref: ref, style: {
            flexWrap: 'nowrap',
            flexDirection: 'row',
            flexGrow: 0,
            flexShrink: 1,
            ...style,
            backgroundColor,
            overflowX: style.overflowX ?? style.overflow ?? 'visible',
            overflowY: style.overflowY ?? style.overflow ?? 'visible',
        }, internal_accessibility: {
            role,
            state: ariaState,
        } }, isScreenReaderEnabled && label ? label : children));
    // If this Box has a background color, provide it to children via context
    if (backgroundColor) {
        return (React.createElement(backgroundContext.Provider, { value: backgroundColor }, boxElement));
    }
    return boxElement;
});
Box.displayName = 'Box';
export default Box;
//# sourceMappingURL=Box.js.map