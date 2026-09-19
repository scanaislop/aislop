import { Visitor } from 'oxc-parser';
import { findProperty, getPropertyValues } from '../../typescript/ast-helpers.js';
import { getStringValue } from '../../typescript/ast-nodes.js';
export const resolveFromAST = (program, options) => {
    const commands = [];
    const visitor = new Visitor({
        ObjectExpression(node) {
            const run = findProperty(node, 'run');
            const tasks = run?.type === 'ObjectExpression' ? findProperty(run, 'tasks') : undefined;
            if (tasks?.type === 'ObjectExpression') {
                for (const task of tasks.properties ?? []) {
                    if (task.type === 'Property' && task.value?.type === 'ObjectExpression') {
                        for (const command of getPropertyValues(task.value, 'command'))
                            commands.push(command);
                    }
                }
            }
            const staged = findProperty(node, 'staged');
            if (staged?.type === 'ObjectExpression') {
                for (const prop of staged.properties ?? []) {
                    if (prop.type === 'Property') {
                        const command = getStringValue(prop.value);
                        if (command)
                            commands.push(command);
                    }
                }
            }
        },
    });
    visitor.visit(program);
    const inputs = [];
    for (const command of commands) {
        for (const input of options.getInputsFromScripts(command, { knownBinsOnly: true }))
            inputs.push(input);
    }
    return inputs;
};
