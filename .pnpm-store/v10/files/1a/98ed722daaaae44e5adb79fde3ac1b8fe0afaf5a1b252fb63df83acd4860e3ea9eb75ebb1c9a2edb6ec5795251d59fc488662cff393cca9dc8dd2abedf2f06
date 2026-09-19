import { isDeepStrictEqual } from 'node:util';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import arrayToRotated from 'to-rotated';
import { Box, useInput } from 'ink';
import Indicator from './Indicator.js';
import ItemComponent from './Item.js';
function SelectInput({ items = [], isFocused = true, initialIndex = 0, indicatorComponent = Indicator, itemComponent = ItemComponent, limit: customLimit, onSelect, onHighlight, }) {
    const hasLimit = typeof customLimit === 'number' && items.length > customLimit;
    const limit = hasLimit ? Math.min(customLimit, items.length) : items.length;
    const lastIndex = limit - 1;
    const [rotateIndex, setRotateIndex] = useState(initialIndex > lastIndex ? lastIndex - initialIndex : 0);
    const [selectedIndex, setSelectedIndex] = useState(initialIndex ? (initialIndex > lastIndex ? lastIndex : initialIndex) : 0);
    const previousItems = useRef(items);
    useEffect(() => {
        if (!isDeepStrictEqual(previousItems.current.map(item => item.value), items.map(item => item.value))) {
            setRotateIndex(0);
            setSelectedIndex(0);
        }
        previousItems.current = items;
    }, [items]);
    useInput(useCallback((input, key) => {
        if (input === 'k' || key.upArrow) {
            const lastIndex = (hasLimit ? limit : items.length) - 1;
            const atFirstIndex = selectedIndex === 0;
            const nextIndex = hasLimit ? selectedIndex : lastIndex;
            const nextRotateIndex = atFirstIndex ? rotateIndex + 1 : rotateIndex;
            const nextSelectedIndex = atFirstIndex
                ? nextIndex
                : selectedIndex - 1;
            setRotateIndex(nextRotateIndex);
            setSelectedIndex(nextSelectedIndex);
            const slicedItems = hasLimit
                ? arrayToRotated(items, nextRotateIndex).slice(0, limit)
                : items;
            if (typeof onHighlight === 'function') {
                onHighlight(slicedItems[nextSelectedIndex]);
            }
        }
        if (input === 'j' || key.downArrow) {
            const atLastIndex = selectedIndex === (hasLimit ? limit : items.length) - 1;
            const nextIndex = hasLimit ? selectedIndex : 0;
            const nextRotateIndex = atLastIndex ? rotateIndex - 1 : rotateIndex;
            const nextSelectedIndex = atLastIndex ? nextIndex : selectedIndex + 1;
            setRotateIndex(nextRotateIndex);
            setSelectedIndex(nextSelectedIndex);
            const slicedItems = hasLimit
                ? arrayToRotated(items, nextRotateIndex).slice(0, limit)
                : items;
            if (typeof onHighlight === 'function') {
                onHighlight(slicedItems[nextSelectedIndex]);
            }
        }
        // Enable selection directly from number keys.
        if (/^[1-9]$/.test(input)) {
            const targetIndex = Number.parseInt(input, 10) - 1;
            const visibleItems = hasLimit
                ? arrayToRotated(items, rotateIndex).slice(0, limit)
                : items;
            if (targetIndex >= 0 && targetIndex < visibleItems.length) {
                const selectedItem = visibleItems[targetIndex];
                if (selectedItem) {
                    onSelect?.(selectedItem);
                }
            }
        }
        if (key.return) {
            const slicedItems = hasLimit
                ? arrayToRotated(items, rotateIndex).slice(0, limit)
                : items;
            if (typeof onSelect === 'function') {
                onSelect(slicedItems[selectedIndex]);
            }
        }
    }, [
        hasLimit,
        limit,
        rotateIndex,
        selectedIndex,
        items,
        onSelect,
        onHighlight,
    ]), { isActive: isFocused });
    const slicedItems = hasLimit
        ? arrayToRotated(items, rotateIndex).slice(0, limit)
        : items;
    return (React.createElement(Box, { flexDirection: "column" }, slicedItems.map((item, index) => {
        const isSelected = index === selectedIndex;
        return (
        // @ts-expect-error - `key` can't be optional but `item.value` is generic T
        React.createElement(Box, { key: item.key ?? item.value },
            React.createElement(indicatorComponent, { isSelected }),
            React.createElement(itemComponent, { ...item, isSelected })));
    })));
}
export default SelectInput;
//# sourceMappingURL=SelectInput.js.map