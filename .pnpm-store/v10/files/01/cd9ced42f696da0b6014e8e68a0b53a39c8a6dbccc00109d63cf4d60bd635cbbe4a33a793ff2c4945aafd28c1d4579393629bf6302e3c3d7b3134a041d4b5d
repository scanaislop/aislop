import Yoga from 'yoga-layout';
const positionEdges = [
    ['top', Yoga.EDGE_TOP],
    ['right', Yoga.EDGE_RIGHT],
    ['bottom', Yoga.EDGE_BOTTOM],
    ['left', Yoga.EDGE_LEFT],
];
const applyPositionStyles = (node, style) => {
    if ('position' in style) {
        let positionType = Yoga.POSITION_TYPE_RELATIVE;
        if (style.position === 'absolute') {
            positionType = Yoga.POSITION_TYPE_ABSOLUTE;
        }
        else if (style.position === 'static') {
            positionType = Yoga.POSITION_TYPE_STATIC;
        }
        node.setPositionType(positionType);
    }
    for (const [property, edge] of positionEdges) {
        if (!(property in style)) {
            continue;
        }
        const value = style[property];
        if (typeof value === 'string') {
            node.setPositionPercent(edge, Number.parseFloat(value));
            continue;
        }
        node.setPosition(edge, value);
    }
};
const applyMarginStyles = (node, style) => {
    if ('margin' in style) {
        node.setMargin(Yoga.EDGE_ALL, style.margin ?? 0);
    }
    if ('marginX' in style) {
        node.setMargin(Yoga.EDGE_HORIZONTAL, style.marginX ?? 0);
    }
    if ('marginY' in style) {
        node.setMargin(Yoga.EDGE_VERTICAL, style.marginY ?? 0);
    }
    if ('marginLeft' in style) {
        node.setMargin(Yoga.EDGE_START, style.marginLeft ?? 0);
    }
    if ('marginRight' in style) {
        node.setMargin(Yoga.EDGE_END, style.marginRight ?? 0);
    }
    if ('marginTop' in style) {
        node.setMargin(Yoga.EDGE_TOP, style.marginTop ?? 0);
    }
    if ('marginBottom' in style) {
        node.setMargin(Yoga.EDGE_BOTTOM, style.marginBottom ?? 0);
    }
};
const applyPaddingStyles = (node, style) => {
    if ('padding' in style) {
        node.setPadding(Yoga.EDGE_ALL, style.padding ?? 0);
    }
    if ('paddingX' in style) {
        node.setPadding(Yoga.EDGE_HORIZONTAL, style.paddingX ?? 0);
    }
    if ('paddingY' in style) {
        node.setPadding(Yoga.EDGE_VERTICAL, style.paddingY ?? 0);
    }
    if ('paddingLeft' in style) {
        node.setPadding(Yoga.EDGE_LEFT, style.paddingLeft ?? 0);
    }
    if ('paddingRight' in style) {
        node.setPadding(Yoga.EDGE_RIGHT, style.paddingRight ?? 0);
    }
    if ('paddingTop' in style) {
        node.setPadding(Yoga.EDGE_TOP, style.paddingTop ?? 0);
    }
    if ('paddingBottom' in style) {
        node.setPadding(Yoga.EDGE_BOTTOM, style.paddingBottom ?? 0);
    }
};
const applyFlexStyles = (node, style) => {
    if ('flexGrow' in style) {
        node.setFlexGrow(style.flexGrow ?? 0);
    }
    if ('flexShrink' in style) {
        node.setFlexShrink(typeof style.flexShrink === 'number' ? style.flexShrink : 1);
    }
    if ('flexWrap' in style) {
        if (style.flexWrap === 'nowrap') {
            node.setFlexWrap(Yoga.WRAP_NO_WRAP);
        }
        if (style.flexWrap === 'wrap') {
            node.setFlexWrap(Yoga.WRAP_WRAP);
        }
        if (style.flexWrap === 'wrap-reverse') {
            node.setFlexWrap(Yoga.WRAP_WRAP_REVERSE);
        }
    }
    if ('flexDirection' in style) {
        if (style.flexDirection === 'row') {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW);
        }
        if (style.flexDirection === 'row-reverse') {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_ROW_REVERSE);
        }
        if (style.flexDirection === 'column') {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN);
        }
        if (style.flexDirection === 'column-reverse') {
            node.setFlexDirection(Yoga.FLEX_DIRECTION_COLUMN_REVERSE);
        }
    }
    if ('flexBasis' in style) {
        if (typeof style.flexBasis === 'number') {
            node.setFlexBasis(style.flexBasis);
        }
        else if (typeof style.flexBasis === 'string') {
            node.setFlexBasisPercent(Number.parseInt(style.flexBasis, 10));
        }
        else {
            node.setFlexBasisAuto();
        }
    }
    if ('alignItems' in style) {
        if (style.alignItems === 'stretch' || !style.alignItems) {
            node.setAlignItems(Yoga.ALIGN_STRETCH);
        }
        if (style.alignItems === 'flex-start') {
            node.setAlignItems(Yoga.ALIGN_FLEX_START);
        }
        if (style.alignItems === 'center') {
            node.setAlignItems(Yoga.ALIGN_CENTER);
        }
        if (style.alignItems === 'flex-end') {
            node.setAlignItems(Yoga.ALIGN_FLEX_END);
        }
        if (style.alignItems === 'baseline') {
            node.setAlignItems(Yoga.ALIGN_BASELINE);
        }
    }
    if ('alignSelf' in style) {
        if (style.alignSelf === 'auto' || !style.alignSelf) {
            node.setAlignSelf(Yoga.ALIGN_AUTO);
        }
        if (style.alignSelf === 'flex-start') {
            node.setAlignSelf(Yoga.ALIGN_FLEX_START);
        }
        if (style.alignSelf === 'center') {
            node.setAlignSelf(Yoga.ALIGN_CENTER);
        }
        if (style.alignSelf === 'flex-end') {
            node.setAlignSelf(Yoga.ALIGN_FLEX_END);
        }
        if (style.alignSelf === 'stretch') {
            node.setAlignSelf(Yoga.ALIGN_STRETCH);
        }
        if (style.alignSelf === 'baseline') {
            node.setAlignSelf(Yoga.ALIGN_BASELINE);
        }
    }
    if ('alignContent' in style) {
        // Keep wrapped lines top-packed by default; stretch can add surprising empty rows in fixed-height boxes.
        if (style.alignContent === 'flex-start' || !style.alignContent) {
            node.setAlignContent(Yoga.ALIGN_FLEX_START);
        }
        if (style.alignContent === 'center') {
            node.setAlignContent(Yoga.ALIGN_CENTER);
        }
        if (style.alignContent === 'flex-end') {
            node.setAlignContent(Yoga.ALIGN_FLEX_END);
        }
        if (style.alignContent === 'space-between') {
            node.setAlignContent(Yoga.ALIGN_SPACE_BETWEEN);
        }
        if (style.alignContent === 'space-around') {
            node.setAlignContent(Yoga.ALIGN_SPACE_AROUND);
        }
        if (style.alignContent === 'space-evenly') {
            node.setAlignContent(Yoga.ALIGN_SPACE_EVENLY);
        }
        if (style.alignContent === 'stretch') {
            node.setAlignContent(Yoga.ALIGN_STRETCH);
        }
    }
    if ('justifyContent' in style) {
        if (style.justifyContent === 'flex-start' || !style.justifyContent) {
            node.setJustifyContent(Yoga.JUSTIFY_FLEX_START);
        }
        if (style.justifyContent === 'center') {
            node.setJustifyContent(Yoga.JUSTIFY_CENTER);
        }
        if (style.justifyContent === 'flex-end') {
            node.setJustifyContent(Yoga.JUSTIFY_FLEX_END);
        }
        if (style.justifyContent === 'space-between') {
            node.setJustifyContent(Yoga.JUSTIFY_SPACE_BETWEEN);
        }
        if (style.justifyContent === 'space-around') {
            node.setJustifyContent(Yoga.JUSTIFY_SPACE_AROUND);
        }
        if (style.justifyContent === 'space-evenly') {
            node.setJustifyContent(Yoga.JUSTIFY_SPACE_EVENLY);
        }
    }
};
const applyDimensionStyles = (node, style) => {
    if ('width' in style) {
        if (typeof style.width === 'number') {
            node.setWidth(style.width);
        }
        else if (typeof style.width === 'string') {
            node.setWidthPercent(Number.parseInt(style.width, 10));
        }
        else {
            node.setWidthAuto();
        }
    }
    if ('height' in style) {
        if (typeof style.height === 'number') {
            node.setHeight(style.height);
        }
        else if (typeof style.height === 'string') {
            node.setHeightPercent(Number.parseInt(style.height, 10));
        }
        else {
            node.setHeightAuto();
        }
    }
    if ('minWidth' in style) {
        if (typeof style.minWidth === 'string') {
            node.setMinWidthPercent(Number.parseInt(style.minWidth, 10));
        }
        else {
            node.setMinWidth(style.minWidth ?? 0);
        }
    }
    if ('minHeight' in style) {
        if (typeof style.minHeight === 'string') {
            node.setMinHeightPercent(Number.parseInt(style.minHeight, 10));
        }
        else {
            node.setMinHeight(style.minHeight ?? 0);
        }
    }
    if ('maxWidth' in style) {
        if (typeof style.maxWidth === 'string') {
            node.setMaxWidthPercent(Number.parseInt(style.maxWidth, 10));
        }
        else {
            node.setMaxWidth(style.maxWidth);
        }
    }
    if ('maxHeight' in style) {
        if (typeof style.maxHeight === 'string') {
            node.setMaxHeightPercent(Number.parseInt(style.maxHeight, 10));
        }
        else {
            node.setMaxHeight(style.maxHeight);
        }
    }
    if ('aspectRatio' in style) {
        node.setAspectRatio(style.aspectRatio);
    }
};
const applyDisplayStyles = (node, style) => {
    if ('display' in style) {
        node.setDisplay(style.display === 'flex' ? Yoga.DISPLAY_FLEX : Yoga.DISPLAY_NONE);
    }
};
const applyBorderStyles = (node, style, currentStyle) => {
    const hasBorderChanges = 'borderStyle' in style ||
        'borderTop' in style ||
        'borderBottom' in style ||
        'borderLeft' in style ||
        'borderRight' in style;
    if (!hasBorderChanges) {
        return;
    }
    const borderWidth = currentStyle.borderStyle ? 1 : 0;
    node.setBorder(Yoga.EDGE_TOP, currentStyle.borderTop === false ? 0 : borderWidth);
    node.setBorder(Yoga.EDGE_BOTTOM, currentStyle.borderBottom === false ? 0 : borderWidth);
    node.setBorder(Yoga.EDGE_LEFT, currentStyle.borderLeft === false ? 0 : borderWidth);
    node.setBorder(Yoga.EDGE_RIGHT, currentStyle.borderRight === false ? 0 : borderWidth);
};
const applyGapStyles = (node, style) => {
    if ('gap' in style) {
        node.setGap(Yoga.GUTTER_ALL, style.gap ?? 0);
    }
    if ('columnGap' in style) {
        node.setGap(Yoga.GUTTER_COLUMN, style.columnGap ?? 0);
    }
    if ('rowGap' in style) {
        node.setGap(Yoga.GUTTER_ROW, style.rowGap ?? 0);
    }
};
const styles = (node, style = {}, currentStyle = style) => {
    applyPositionStyles(node, style);
    applyMarginStyles(node, style);
    applyPaddingStyles(node, style);
    applyFlexStyles(node, style);
    applyDimensionStyles(node, style);
    applyDisplayStyles(node, style);
    applyBorderStyles(node, style, currentStyle);
    applyGapStyles(node, style);
};
export default styles;
//# sourceMappingURL=styles.js.map