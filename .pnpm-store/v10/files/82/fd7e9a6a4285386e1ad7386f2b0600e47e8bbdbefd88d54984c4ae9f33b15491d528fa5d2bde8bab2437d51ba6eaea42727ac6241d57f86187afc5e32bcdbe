import { Visitor, visitorKeys, } from 'oxc-parser';
import { FIX_FLAGS, IMPORT_FLAGS, OPAQUE, SYMBOL_TYPE } from '../../constants.js';
import { addValue } from '../../util/module-graph.js';
import { isInNodeModules } from '../../util/path.js';
import { timerify } from '../../util/Performance.js';
import { collectAugmentationRefs, getLineAndCol, getStringValue, isStringLiteral, } from '../ast-nodes.js';
import { EMPTY_TAGS } from './jsdoc.js';
import { handleCallExpression, handleNewExpression, trackCustomElementRegistry } from './calls.js';
import { handleExportAssignment, handleExportDefault, handleExportNamed, handleExpressionStatement, } from './exports.js';
import { handleImportExpression, handleVariableDeclarator } from './imports.js';
import { handleJSXMemberExpression, handleMemberExpression } from './members.js';
let state;
const _getFix = (start, end, flags) => state.options.isFixExports ? [start, end, flags ?? FIX_FLAGS.NONE] : undefined;
const _getTypeFix = (start, end) => state.options.isFixTypes ? [start, end, FIX_FLAGS.NONE] : undefined;
const _addExport = (identifier, type, pos, members, fix, isReExport, jsDocTags) => {
    const item = state.exports.get(identifier);
    if (item) {
        if (members.length)
            for (const m of members)
                item.members.push(m);
        if (fix)
            item.fixes.push(fix);
        if (jsDocTags.size) {
            if (item.jsDocTags === EMPTY_TAGS) {
                item.jsDocTags = new Set(jsDocTags);
            }
            else {
                for (const t of jsDocTags)
                    item.jsDocTags.add(t);
            }
        }
        item.isReExport = isReExport;
    }
    else {
        const { line, col } = getLineAndCol(state.lineStarts, pos);
        state.exports.set(identifier, {
            identifier,
            type,
            members,
            jsDocTags,
            pos,
            line,
            col,
            hasRefsInFile: false,
            isRegistered: false,
            referencedIn: undefined,
            fixes: fix ? [fix] : [],
            isReExport,
        });
    }
};
const _collectRefsInType = (node, exportName, signatureOnly, seen = new Set(), inBody = false, thisType) => {
    if (!node)
        return;
    const type = node.type;
    if (!type)
        return;
    switch (type) {
        case 'TSTypeQuery':
            if (node.exprName?.type === 'Identifier')
                _addRefInExport(node.exprName.name, exportName);
            return;
        case 'TSTypeReference':
            if (node.typeName?.type === 'Identifier')
                _addRefInExport(node.typeName.name, exportName);
            break;
        case 'TSThisType':
            if (thisType)
                _addRefInExport(thisType, exportName);
            return;
        case 'CallExpression': {
            const callee = node.callee;
            if (callee?.type === 'Identifier') {
                state.pendingCallRefs.push({ name: callee.name, exportName, seen, kind: 'callee' });
            }
            else if (callee?.type === 'MemberExpression' &&
                !callee.computed &&
                callee.object?.type === 'Identifier' &&
                callee.property?.type === 'Identifier') {
                state.pendingMemberCallRefs.push({
                    objectName: callee.object.name,
                    propertyName: callee.property.name,
                    exportName,
                    seen,
                });
            }
            if (!inBody) {
                const args = node.arguments;
                if (args) {
                    for (const arg of args) {
                        if (arg?.type === 'Identifier') {
                            state.pendingCallRefs.push({ name: arg.name, exportName, seen, kind: 'argument' });
                        }
                    }
                }
            }
            break;
        }
        case 'FunctionBody':
        case 'BlockStatement':
            if (signatureOnly)
                return;
            break;
        case 'TSAsExpression':
        case 'TSTypeAssertion':
        case 'TSSatisfiesExpression':
            if (inBody) {
                if (node.expression)
                    _collectRefsInType(node.expression, exportName, signatureOnly, seen, inBody, thisType);
                return;
            }
            break;
        case 'VariableDeclarator':
            if (inBody) {
                if (node.init)
                    _collectRefsInType(node.init, exportName, signatureOnly, seen, inBody, thisType);
                return;
            }
            break;
    }
    const keys = visitorKeys[type];
    if (!keys)
        return;
    const childInBody = inBody || type === 'FunctionBody' || type === 'BlockStatement';
    for (const key of keys) {
        const val = node[key];
        if (!val)
            continue;
        if (Array.isArray(val)) {
            for (const item of val) {
                if (item)
                    _collectRefsInType(item, exportName, signatureOnly, seen, childInBody, thisType);
            }
        }
        else {
            _collectRefsInType(val, exportName, signatureOnly, seen, childInBody, thisType);
        }
    }
};
const _collectRefsInDirectMemberResult = (fn, exportName, seen) => {
    const body = fn.body;
    if (body?.type !== 'MemberExpression' ||
        body.computed ||
        body.object?.type !== 'Identifier' ||
        body.property?.type !== 'Identifier') {
        return false;
    }
    const params = Array.isArray(fn.params) ? fn.params : (fn.params?.items ?? []);
    const param = params.find((param) => param.type === 'Identifier' && param.name === body.object.name);
    const paramType = param?.typeAnnotation?.typeAnnotation;
    if (paramType?.type !== 'TSTypeReference' || paramType.typeName?.type !== 'Identifier' || paramType.typeArguments) {
        return false;
    }
    const declaration = state.localInterfaces.get(paramType.typeName.name);
    if (!declaration || declaration.typeParameters)
        return false;
    const members = declaration.body.body.filter((member) => member.type === 'TSPropertySignature' &&
        !member.computed &&
        member.key?.type === 'Identifier' &&
        member.key.name === body.property.name &&
        Boolean(member.typeAnnotation));
    if (members.length !== 1)
        return false;
    _collectRefsInType(members[0].typeAnnotation, exportName, true, seen, false, paramType.typeName.name);
    return true;
};
const _collectRefsInCallResult = (node, exportName, seen) => {
    const annotatedType = node.type === 'VariableDeclarator' ? node.id.typeAnnotation?.typeAnnotation : undefined;
    if (annotatedType?.type === 'TSFunctionType') {
        _collectRefsInType(annotatedType.typeParameters, exportName, true, seen);
        return _collectRefsInType(annotatedType.returnType, exportName, true, seen);
    }
    if (annotatedType)
        return _collectRefsInType(annotatedType, exportName, true, seen);
    const fn = node.type === 'VariableDeclarator' ? node.init : node;
    if (fn?.type !== 'ArrowFunctionExpression' &&
        fn?.type !== 'FunctionDeclaration' &&
        fn?.type !== 'FunctionExpression') {
        return _collectRefsInType(node, exportName, true, seen);
    }
    if (fn.returnType) {
        _collectRefsInType(fn.typeParameters, exportName, true, seen);
        return _collectRefsInType(fn.returnType, exportName, true, seen);
    }
    if (_collectRefsInDirectMemberResult(fn, exportName, seen))
        return;
    _collectRefsInType(fn, exportName, true, seen);
};
const _addRefInExport = (name, exportName) => {
    const refs = state.referencedInExport.get(name);
    if (refs)
        refs.add(exportName);
    else
        state.referencedInExport.set(name, new Set([exportName]));
};
const _isInNamespace = (node) => state.nsRanges.length > 0 && state.nsRanges.some(([start, end]) => node.start >= start && node.end <= end);
export const isShadowed = (name, pos) => {
    if (state.shadowScopes.size === 0)
        return false;
    const ranges = state.shadowScopes.get(name);
    if (!ranges)
        return false;
    if (state.localImportMap.get(name)?.isDynamicImport)
        return false;
    for (const range of ranges) {
        if (pos >= range[0] && pos <= range[1])
            return true;
    }
    return false;
};
const _addLocalRef = (name, pos) => {
    if (isShadowed(name, pos))
        return;
    if (state.localImportMap.has(name))
        (state.importedRefs ??= new Set()).add(name);
    else
        state.localRefs.add(name);
};
const _addShadowRange = (name, range) => {
    const ranges = state.shadowScopes.get(name);
    if (ranges)
        ranges.push(range);
    else
        state.shadowScopes.set(name, [range]);
};
const _addShadow = (name) => {
    const i = state.scopeDepth - 1;
    _addShadowRange(name, [state.scopeStarts[i], state.scopeEnds[i]]);
};
const _collectBindingNames = (pattern, range) => {
    if (!pattern)
        return;
    if (pattern.type === 'Identifier') {
        _addShadowRange(pattern.name, range);
    }
    else if (pattern.type === 'ObjectPattern') {
        for (const prop of pattern.properties ?? []) {
            _collectBindingNames(prop.value ?? prop.argument, range);
        }
    }
    else if (pattern.type === 'ArrayPattern') {
        for (const el of pattern.elements ?? []) {
            _collectBindingNames(el, range);
        }
    }
    else if (pattern.type === 'AssignmentPattern') {
        _collectBindingNames(pattern.left, range);
    }
    else if (pattern.type === 'RestElement') {
        _collectBindingNames(pattern.argument, range);
    }
};
const _addParamShadows = (params, body) => {
    if (!body || !params)
        return;
    const range = [body.start, body.end];
    const items = Array.isArray(params) ? params : (params.items ?? params);
    for (const param of items)
        _collectBindingNames(param, range);
};
const coreVisitorObject = {
    BlockStatement(node) {
        state.scopeStarts[state.scopeDepth] = node.start;
        state.scopeEnds[state.scopeDepth] = node.end;
        state.scopeDepth++;
    },
    'BlockStatement:exit'() {
        state.scopeDepth--;
    },
    TSModuleDeclaration(node) {
        state.nsRanges.push([node.start, node.end]);
        if (node.kind !== 'global' && state.isModuleFile && isStringLiteral(node.id)) {
            const specifier = getStringValue(node.id);
            for (const name of collectAugmentationRefs(node))
                state.addImport(specifier, name, undefined, undefined, node.id.start, IMPORT_FLAGS.TYPE_ONLY | IMPORT_FLAGS.AUGMENT);
        }
    },
    TSInterfaceDeclaration(node) {
        if (state.scopeDepth > 0 || state.isInNamespace(node))
            return;
        const name = node.id.name;
        state.localInterfaces.set(name, state.localInterfaces.has(name) ? null : node);
    },
    ClassDeclaration(node) {
        state.classNameStack.push(node.id?.name ?? '');
        if (node.id?.name) {
            state.localDeclarationTypes.set(node.id.name, SYMBOL_TYPE.CLASS);
            state.localDeclarations.set(node.id.name, node);
        }
    },
    'ClassDeclaration:exit'() {
        state.classNameStack.pop();
    },
    ClassExpression(node) {
        state.classNameStack.push(node.id?.name ?? '');
    },
    'ClassExpression:exit'() {
        state.classNameStack.pop();
    },
    StaticBlock() {
        state.staticBlockDepth++;
    },
    'StaticBlock:exit'() {
        state.staticBlockDepth--;
    },
    FunctionDeclaration(node) {
        if (node.id?.name) {
            state.localDeclarationTypes.set(node.id.name, SYMBOL_TYPE.FUNCTION);
            state.localDeclarations.set(node.id.name, node);
            if (state.scopeDepth > 0)
                _addShadow(node.id.name);
        }
        _addParamShadows(node.params, node.body);
    },
    FunctionExpression(node) {
        _addParamShadows(node.params, node.body);
    },
    ArrowFunctionExpression(node) {
        _addParamShadows(node.params, node.body);
    },
    CatchClause(node) {
        if (node.param?.type === 'Identifier' && node.body) {
            _addShadowRange(node.param.name, [node.body.start, node.body.end]);
        }
    },
    VariableDeclaration(node) {
        state.currentVarDeclStart = node.start;
        if (state.scopeDepth > 0) {
            for (const decl of node.declarations) {
                if (decl.id.type === 'Identifier') {
                    state.localDeclarationTypes.set(decl.id.name, SYMBOL_TYPE.VARIABLE);
                    _addShadow(decl.id.name);
                }
            }
        }
        else {
            for (const decl of node.declarations) {
                if (decl.id.type === 'Identifier') {
                    state.localDeclarationTypes.set(decl.id.name, SYMBOL_TYPE.VARIABLE);
                    state.localDeclarations.set(decl.id.name, decl);
                }
            }
        }
    },
    TSEnumDeclaration(node) {
        if (node.id.name)
            state.localDeclarationTypes.set(node.id.name, SYMBOL_TYPE.ENUM);
    },
    ExportNamedDeclaration(node) {
        handleExportNamed(node, state);
    },
    ExportDefaultDeclaration(node) {
        handleExportDefault(node, state);
    },
    TSExportAssignment(node) {
        handleExportAssignment(node, state);
    },
    ExpressionStatement(node) {
        handleExpressionStatement(node, state);
    },
    VariableDeclarator(node) {
        handleVariableDeclarator(node, state);
        trackCustomElementRegistry(node, state);
    },
    ImportExpression(node) {
        handleImportExpression(node, state);
    },
    CallExpression(node) {
        handleCallExpression(node, state);
    },
    NewExpression(node) {
        handleNewExpression(node, state);
    },
    MemberExpression(node) {
        handleMemberExpression(node, state);
    },
    JSXMemberExpression(node) {
        handleJSXMemberExpression(node, state);
    },
    ForInStatement(node) {
        if (node.left.type === 'VariableDeclaration' && node.body) {
            for (const decl of node.left.declarations)
                _collectBindingNames(decl.id, [node.body.start, node.body.end]);
        }
        if (node.right.type === 'Identifier' && !isShadowed(node.right.name, node.right.start)) {
            const _import = state.localImportMap.get(node.right.name);
            if (_import?.isNamespace) {
                const internalImport = state.internal.get(_import.filePath);
                if (internalImport)
                    addValue(internalImport.import, OPAQUE, state.filePath);
            }
        }
    },
    ForOfStatement(node) {
        if (node.left.type === 'VariableDeclaration' && node.body) {
            for (const decl of node.left.declarations)
                _collectBindingNames(decl.id, [node.body.start, node.body.end]);
        }
        if (node.right.type === 'Identifier' && !isShadowed(node.right.name, node.right.start)) {
            const _import = state.localImportMap.get(node.right.name);
            if (_import?.isNamespace) {
                const internalImport = state.internal.get(_import.filePath);
                if (internalImport)
                    addValue(internalImport.import, OPAQUE, state.filePath);
            }
        }
    },
    TSQualifiedName(node) {
        let left = node;
        const parts = [];
        while (left.type === 'TSQualifiedName') {
            if (left.right.type === 'Identifier')
                parts.unshift(left.right.name);
            left = left.left;
        }
        if (left.type === 'Identifier' && !isShadowed(left.name, left.start)) {
            const rootName = left.name;
            const _import = state.localImportMap.get(rootName);
            if (_import) {
                const internalImport = state.internal.get(_import.filePath);
                if (internalImport) {
                    if (parts.length > 0) {
                        let path = '';
                        for (const part of parts) {
                            path = path ? `${path}.${part}` : part;
                            state.addNsMemberRefs(internalImport, rootName, path);
                        }
                    }
                    else {
                        internalImport.refs.add(rootName);
                    }
                }
            }
            else if (parts.length > 0) {
                let path = '';
                for (const part of parts) {
                    path = path ? `${path}.${part}` : part;
                    state.memberRefsInFile.push(rootName, path);
                }
            }
        }
    },
    TSTypeReference(node) {
        if (node.typeName.type === 'Identifier') {
            const name = node.typeName.name;
            if (!isShadowed(name, node.typeName.start)) {
                const _import = state.localImportMap.get(name);
                if (_import) {
                    const internalImport = state.internal.get(_import.filePath);
                    if (internalImport)
                        internalImport.refs.add(name);
                }
            }
        }
    },
    TSTypeQuery(node) {
        if (node.exprName.type === 'Identifier') {
            const name = node.exprName.name;
            if (!isShadowed(name, node.exprName.start)) {
                const _import = state.localImportMap.get(name);
                if (_import) {
                    const internalImport = state.internal.get(_import.filePath);
                    if (internalImport)
                        internalImport.refs.add(name);
                }
            }
        }
    },
    TSImportType(node) {
        const src = node.source;
        if (isStringLiteral(src)) {
            const specifier = getStringValue(src);
            state.addImport(specifier, undefined, undefined, undefined, src.start, IMPORT_FLAGS.TYPE_ONLY);
        }
    },
    TSImportEqualsDeclaration(node) {
        if (node.moduleReference.type === 'TSExternalModuleReference') {
            const expr = node.moduleReference.expression;
            if (isStringLiteral(expr)) {
                const specifier = getStringValue(expr);
                const localName = node.id.name;
                state.addImport(specifier, 'default', localName, undefined, node.id.start, IMPORT_FLAGS.NONE);
                if (localName) {
                    const module = state.resolveModule(specifier, state.filePath);
                    if (module && !module.isExternalLibraryImport && !isInNodeModules(module.resolvedFileName)) {
                        state.localImportMap.set(localName, {
                            importedName: 'default',
                            filePath: module.resolvedFileName,
                            isNamespace: false,
                        });
                    }
                }
            }
        }
        else if (node.moduleReference.type === 'TSQualifiedName') {
            const left = node.moduleReference.left;
            const right = node.moduleReference.right;
            if (left.type === 'Identifier' && right.type === 'Identifier') {
                const nsName = left.name;
                const _import = state.localImportMap.get(nsName);
                if (_import?.isNamespace) {
                    const internalImport = state.internal.get(_import.filePath);
                    if (internalImport)
                        state.addNsMemberRefs(internalImport, nsName, right.name);
                }
            }
        }
    },
};
const localRefsVisitorObject = {
    ClassDeclaration(node) {
        if (node.superClass?.type === 'Identifier')
            _addLocalRef(node.superClass.name, node.superClass.start);
        for (const impl of node.implements ?? []) {
            if (impl.expression?.type === 'Identifier')
                _addLocalRef(impl.expression.name, impl.expression.start);
        }
    },
    TSInterfaceDeclaration(node) {
        for (const ext of node.extends ?? []) {
            if (ext.expression?.type === 'Identifier')
                _addLocalRef(ext.expression.name, ext.expression.start);
        }
    },
    Property(node) {
        if (node.value?.type === 'Identifier')
            _addLocalRef(node.value.name, node.value.start);
    },
    ReturnStatement(node) {
        if (node.argument?.type === 'Identifier')
            _addLocalRef(node.argument.name, node.argument.start);
    },
    AssignmentExpression(node) {
        if (node.right?.type === 'Identifier')
            _addLocalRef(node.right.name, node.right.start);
    },
    SpreadElement(node) {
        if (node.argument?.type === 'Identifier')
            _addLocalRef(node.argument.name, node.argument.start);
    },
    ConditionalExpression(node) {
        if (node.test?.type === 'Identifier')
            _addLocalRef(node.test.name, node.test.start);
        if (node.consequent?.type === 'Identifier')
            _addLocalRef(node.consequent.name, node.consequent.start);
        if (node.alternate?.type === 'Identifier')
            _addLocalRef(node.alternate.name, node.alternate.start);
    },
    ArrayExpression(node) {
        for (const el of node.elements ?? []) {
            if (el?.type === 'Identifier')
                _addLocalRef(el.name, el.start);
        }
    },
    TemplateLiteral(node) {
        for (const expr of node.expressions ?? []) {
            if (expr.type === 'Identifier')
                _addLocalRef(expr.name, expr.start);
        }
    },
    BinaryExpression(node) {
        if (node.left?.type === 'Identifier')
            _addLocalRef(node.left.name, node.left.start);
        if (node.right?.type === 'Identifier')
            _addLocalRef(node.right.name, node.right.start);
    },
    LogicalExpression(node) {
        if (node.left?.type === 'Identifier')
            _addLocalRef(node.left.name, node.left.start);
        if (node.right?.type === 'Identifier')
            _addLocalRef(node.right.name, node.right.start);
    },
    UnaryExpression(node) {
        if (node.argument?.type === 'Identifier')
            _addLocalRef(node.argument.name, node.argument.start);
    },
    SwitchStatement(node) {
        if (node.discriminant?.type === 'Identifier')
            _addLocalRef(node.discriminant.name, node.discriminant.start);
        for (const c of node.cases ?? []) {
            if (c.test?.type === 'Identifier')
                _addLocalRef(c.test.name, c.test.start);
        }
    },
    IfStatement(node) {
        if (node.test?.type === 'Identifier')
            _addLocalRef(node.test.name, node.test.start);
    },
    ThrowStatement(node) {
        if (node.argument?.type === 'Identifier')
            _addLocalRef(node.argument.name, node.argument.start);
    },
    WhileStatement(node) {
        if (node.test?.type === 'Identifier')
            _addLocalRef(node.test.name, node.test.start);
    },
    DoWhileStatement(node) {
        if (node.test?.type === 'Identifier')
            _addLocalRef(node.test.name, node.test.start);
    },
    YieldExpression(node) {
        if (node.argument?.type === 'Identifier')
            _addLocalRef(node.argument.name, node.argument.start);
    },
    AwaitExpression(node) {
        if (node.argument?.type === 'Identifier')
            _addLocalRef(node.argument.name, node.argument.start);
    },
    ArrowFunctionExpression(node) {
        if (node.body?.type === 'Identifier')
            _addLocalRef(node.body.name, node.body.start);
    },
    AssignmentPattern(node) {
        if (node.right?.type === 'Identifier')
            _addLocalRef(node.right.name, node.right.start);
    },
    SequenceExpression(node) {
        for (const expr of node.expressions ?? []) {
            if (expr.type === 'Identifier')
                _addLocalRef(expr.name, expr.start);
        }
    },
    TSAsExpression(node) {
        if (node.expression?.type === 'Identifier')
            _addLocalRef(node.expression.name, node.expression.start);
    },
    TSSatisfiesExpression(node) {
        if (node.expression?.type === 'Identifier')
            _addLocalRef(node.expression.name, node.expression.start);
    },
    TSNonNullExpression(node) {
        if (node.expression?.type === 'Identifier')
            _addLocalRef(node.expression.name, node.expression.start);
    },
    TSTypeAssertion(node) {
        if (node.expression?.type === 'Identifier')
            _addLocalRef(node.expression.name, node.expression.start);
    },
    ParenthesizedExpression(node) {
        if (node.expression?.type === 'Identifier')
            _addLocalRef(node.expression.name, node.expression.start);
    },
    PropertyDefinition(node) {
        if (node.value?.type === 'Identifier')
            _addLocalRef(node.value.name, node.value.start);
    },
    ForInStatement(node) {
        if (node.right?.type === 'Identifier')
            _addLocalRef(node.right.name, node.right.start);
    },
    ForOfStatement(node) {
        if (node.right?.type === 'Identifier')
            _addLocalRef(node.right.name, node.right.start);
    },
    JSXOpeningElement(node) {
        if (node.name?.type === 'JSXIdentifier')
            _addLocalRef(node.name.name, node.name.start);
        for (const attr of node.attributes ?? []) {
            if (attr.type === 'JSXSpreadAttribute' && attr.argument?.type === 'Identifier')
                _addLocalRef(attr.argument.name, attr.argument.start);
        }
    },
    JSXExpressionContainer(node) {
        if (node.expression?.type === 'Identifier')
            _addLocalRef(node.expression.name, node.expression.start);
    },
    VariableDeclarator(node) {
        if (node.init?.type === 'Identifier')
            _addLocalRef(node.init.name, node.init.start);
    },
    ExpressionStatement(node) {
        if (node.expression?.type === 'Identifier')
            _addLocalRef(node.expression.name, node.expression.start);
    },
    CallExpression(node) {
        if (node.callee?.type === 'Identifier')
            _addLocalRef(node.callee.name, node.callee.start);
        for (const arg of node.arguments ?? []) {
            if (arg.type === 'Identifier')
                _addLocalRef(arg.name, arg.start);
        }
    },
    NewExpression(node) {
        if (node.callee?.type === 'Identifier')
            _addLocalRef(node.callee.name, node.callee.start);
        for (const arg of node.arguments ?? []) {
            if (arg.type === 'Identifier')
                _addLocalRef(arg.name, arg.start);
        }
    },
    MemberExpression(node) {
        if (node.object?.type === 'Identifier')
            _addLocalRef(node.object.name, node.object.start);
        if (node.computed && node.property?.type === 'Identifier')
            _addLocalRef(node.property.name, node.property.start);
    },
    TaggedTemplateExpression(node) {
        if (node.tag?.type === 'Identifier')
            _addLocalRef(node.tag.name, node.tag.start);
    },
    TSQualifiedName(node) {
        let left = node;
        const parts = [];
        while (left.type === 'TSQualifiedName') {
            if (left.right.type === 'Identifier')
                parts.unshift(left.right.name);
            left = left.left;
        }
        if (left.type === 'Identifier') {
            const rootName = left.name;
            if (!state.localImportMap.has(rootName) && !isShadowed(rootName, left.start) && parts.length > 0) {
                state.localRefs.add(rootName);
            }
        }
    },
    TSTypeReference(node) {
        if (node.typeName?.type === 'Identifier') {
            const name = node.typeName.name;
            if (!state.localImportMap.has(name))
                _addLocalRef(name, node.typeName.start);
        }
    },
    TSTypeQuery(node) {
        if (node.exprName?.type === 'Identifier') {
            const name = node.exprName.name;
            if (!state.localImportMap.has(name))
                _addLocalRef(name, node.exprName.start);
        }
    },
};
export function buildVisitor(pluginVisitorObjects, includeLocalRefs) {
    const handlerLists = new Map();
    const coreHandlers = coreVisitorObject;
    for (const key in coreHandlers) {
        const fn = coreHandlers[key];
        if (fn)
            handlerLists.set(key, [fn]);
    }
    const extras = includeLocalRefs
        ? [localRefsVisitorObject, ...pluginVisitorObjects]
        : pluginVisitorObjects;
    for (const obj of extras) {
        for (const key in obj) {
            const fn = obj[key];
            if (!fn)
                continue;
            const list = handlerLists.get(key);
            if (list)
                list.push(fn);
            else
                handlerLists.set(key, [fn]);
        }
    }
    if (extras.length === 0)
        return new Visitor(coreVisitorObject);
    const merged = {};
    for (const [key, list] of handlerLists) {
        if (list.length === 1) {
            merged[key] = list[0];
        }
        else {
            const fns = list;
            merged[key] = ((node) => {
                for (let i = 0; i < fns.length; i++)
                    fns[i](node);
            });
        }
    }
    return new Visitor(merged);
}
const isExternalModule = (program, hasModuleSyntax) => {
    if (hasModuleSyntax)
        return true;
    for (const node of program.body) {
        if (node.type === 'TSImportEqualsDeclaration' && node.moduleReference.type === 'TSExternalModuleReference') {
            return true;
        }
    }
    return false;
};
function walkAST(program, sourceText, filePath, hasModuleSyntax, ctx) {
    const isJS = filePath.endsWith('.js') || filePath.endsWith('.mjs') || filePath.endsWith('.cjs') || filePath.endsWith('.jsx');
    state = {
        ...ctx,
        filePath,
        sourceText,
        isJS,
        isModuleFile: isExternalModule(program, hasModuleSyntax),
        bareExprRefs: new Set(),
        accessedAliases: new Set(),
        nsContainers: new Map(),
        accessedNsContainers: new Set(),
        chainedMemberExprs: new WeakSet(),
        currentVarDeclStart: -1,
        nsRanges: [],
        memberRefsInFile: [],
        importedRefs: undefined,
        scopeDepth: 0,
        scopeStarts: [],
        scopeEnds: [],
        shadowScopes: new Map(),
        localDeclarations: new Map(),
        localInterfaces: new Map(),
        pendingCallRefs: [],
        pendingMemberCallRefs: [],
        localToExports: new Map(),
        customElementRegistries: new Set(),
        classNameStack: [],
        staticBlockDepth: 0,
        addExport: _addExport,
        getFix: _getFix,
        getTypeFix: _getTypeFix,
        collectRefsInType: _collectRefsInType,
        addRefInExport: _addRefInExport,
        isInNamespace: _isInNamespace,
    };
    ctx.visitor.visit(program);
    while (state.pendingCallRefs.length > 0 || state.pendingMemberCallRefs.length > 0) {
        while (state.pendingCallRefs.length > 0) {
            const { name, exportName, seen, kind } = state.pendingCallRefs.pop();
            const key = `${kind}:${name}`;
            if (seen.has(key))
                continue;
            const decl = state.localDeclarations.get(name);
            if (!decl)
                continue;
            seen.add(key);
            if (kind === 'callee')
                _collectRefsInCallResult(decl, exportName, seen);
            else
                _collectRefsInType(decl, exportName, true, seen);
        }
        while (state.pendingMemberCallRefs.length > 0) {
            const { objectName, propertyName, exportName, seen } = state.pendingMemberCallRefs.pop();
            const key = `${objectName}.${propertyName}`;
            if (seen.has(key))
                continue;
            const decl = state.localDeclarations.get(objectName);
            if (decl?.type !== 'VariableDeclarator' || decl.init?.type !== 'ObjectExpression')
                continue;
            const prop = decl.init.properties.find(p => p.type === 'Property' && p.key?.type === 'Identifier' && p.key.name === propertyName);
            if (prop?.type !== 'Property')
                continue;
            const fn = prop.value;
            if (fn.type !== 'ArrowFunctionExpression' && fn.type !== 'FunctionExpression')
                continue;
            seen.add(key);
            _collectRefsInCallResult(fn, exportName, seen);
        }
    }
    for (let i = 0; i < state.memberRefsInFile.length; i += 2) {
        const exp = state.exports.get(state.memberRefsInFile[i]);
        if (exp) {
            const id = state.memberRefsInFile[i + 1];
            for (const member of exp.members) {
                if (member.identifier === id)
                    member.hasRefsInFile = true;
            }
        }
    }
    for (const [aliasName, aliasSet] of state.importAliases) {
        if (!state.accessedAliases.has(aliasName)) {
            for (const alias of aliasSet) {
                const _import = state.localImportMap.get(alias.id);
                if (_import?.isNamespace) {
                    const internalImport = state.internal.get(_import.filePath);
                    if (internalImport) {
                        addValue(internalImport.import, OPAQUE, filePath);
                    }
                }
            }
        }
    }
    for (const [containerName, propMap] of state.nsContainers) {
        for (const [propKey, nsName] of propMap) {
            if (!state.accessedNsContainers.has(`${containerName}.${propKey}`)) {
                const _import = state.localImportMap.get(nsName);
                if (_import) {
                    const internalImport = state.internal.get(_import.filePath);
                    if (internalImport) {
                        addValue(internalImport.import, OPAQUE, filePath);
                    }
                }
            }
        }
    }
    if (!state.skipBareExprRefs) {
        for (const name of state.bareExprRefs) {
            const item = state.exports.get(name);
            if (item)
                item.hasRefsInFile = true;
        }
    }
    for (const name of state.registeredCustomElements) {
        const item = state.exports.get(name);
        if (item)
            item.isRegistered = true;
        const aliases = state.localToExports.get(name);
        if (aliases) {
            for (const exportName of aliases) {
                const aliased = state.exports.get(exportName);
                if (aliased)
                    aliased.isRegistered = true;
            }
        }
    }
    if (state.localRefs && state.importedRefs) {
        for (const name of state.importedRefs) {
            const exportNames = state.localToExports.get(name);
            if (exportNames)
                for (const exportName of exportNames)
                    state.localRefs.add(exportName);
        }
    }
    const localRefs = state.localRefs;
    state = undefined;
    return localRefs;
}
export const _walkAST = timerify(walkAST);
